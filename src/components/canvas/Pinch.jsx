import React, { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useXREvent } from "@react-three/xr";
import { mergeRefs } from "react-merge-refs";
import { Matrix4, Quaternion, Vector3, MathUtils } from "three";

import useSocket, { useUsers } from "@/stores/socket";
import useInteracting, { useHandEvent } from "@/stores/interacting";
import * as handModelUtils from "@/utils";

function useUpdateGroup(ref, pinchingControllerRef, previousTransformRef) {
  const sendPinchData = useSocket((state) => state.sendPinchData);
  const userIdIndex = useSocket((state) => state.userIdIndex);

  useFrame(() => {
    const { pinchedObjects } = useInteracting.getState();
    const pinchingThisObject = Object.values(pinchedObjects).some(
      (pinchedObject) =>
        pinchedObject?.current && pinchedObject.current === ref.current
    );
    if (
      !pinchingControllerRef.current ||
      !pinchingThisObject ||
      !previousTransformRef.current
    ) {
      return;
    }
    let transform = handModelUtils.getHandTransform(
      pinchingControllerRef.current
    );
    // apply previous transform
    ref.current.applyMatrix4(previousTransformRef.current.clone().invert());
    // const currMatrix = ref.current.matrix.clone();
    // currMatrix.premultiply(previousTransformRef.current.clone().invert());

    // get quaternion from previous matrix
    const previousQuaternion = new Quaternion();
    previousTransformRef.current.decompose(
      new Vector3(),
      previousQuaternion,
      new Vector3(1, 1, 1)
    );
    // get quaternion from current matrix
    const currentQuaternion = new Quaternion();
    transform.decompose(new Vector3(), currentQuaternion, new Vector3(1, 1, 1));
    // slerp to current quaternion
    previousQuaternion.slerp(currentQuaternion, 0.1);
    const position = handModelUtils.getHandPosition(
      pinchingControllerRef.current
    );
    transform = new Matrix4().compose(
      position,
      previousQuaternion,
      new Vector3(1, 1, 1)
    );

    ref.current.applyMatrix4(transform);
    // currMatrix.premultiply(transform);
    // ref.current.matrix = currMatrix;
    // ref.current.matrix.decompose(
    //   ref.current.position,
    //   ref.current.quaternion,
    //   ref.current.scale
    // );
    ref.current.updateWorldMatrix(false, true);
    previousTransformRef.current = transform.clone();

    sendPinchData({
      matrix: ref.current.matrix.elements,
      name: ref.current.name,
      pinchStart: ref.current.userData.pinchStart,
      userIdIndex,
    });
  });
}

// TODO: base on pizza circle radius
const point = new Vector3(0, 0, -0.5);

function useSetPinching(ref) {
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const socket = useSocket((state) => state.socket);
  const users = useUsers();
  const usersLength = users.length;
  const handView = useSocket((state) => state.handView);

  const circleSegments = usersLength < 3 ? 4 : usersLength;

  useEffect(() => {
    function handlePinchData(pinchData) {
      const obj = ref?.current;
      const matrix = obj?.name === pinchData.name ? pinchData.matrix : null;
      if (matrix) {
        obj.matrix = new Matrix4();
        obj.matrix.elements = pinchData.matrix;
        obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);

        if (handView === "Pizza") {
          const rotationDeg =
            (userIdIndex - pinchData.userIdIndex) * (360 / circleSegments);
          obj.position.sub(point); // remove the offset
          // rotate around center of pizza
          obj.position.applyAxisAngle(
            new Vector3(0, 1, 0),
            MathUtils.degToRad(rotationDeg)
          );
          // rotate around center of self
          obj.rotateOnWorldAxis(
            new Vector3(0, 1, 0),
            MathUtils.degToRad(rotationDeg)
          );
          obj.position.add(point); // re-add the offset
        }

        ref.current.updateWorldMatrix(false, true);
      }
    }
    socket.on("pinchData", handlePinchData);
    return () => {
      socket.off("pinchData", handlePinchData);
    };
  }, [socket, ref, userIdIndex, circleSegments, handView]);
}

const Pinch = React.forwardRef(
  ({ children, onChange, isColliding, ...props }, passedRef) => {
    const ref = React.useRef();
    const pinchingControllerRef = React.useRef();
    const previousTransformRef = React.useRef();
    const setPinchedObject = useInteracting((store) => store.setPinchedObject);

    function selectOrPinchStart({ handedness, motionController }) {
      const colliding = isColliding({ hand: motionController });

      if (colliding) {
        onChange({ isPinched: true });
        const transform = handModelUtils.getHandTransform(motionController);
        previousTransformRef.current = transform.clone();
        pinchingControllerRef.current = motionController;
        ref.current.userData.pinchStart = Date.now();
        setPinchedObject(handedness, ref);
      }
    }

    function selectOrPinchEnd({ handedness }) {
      onChange({ isPinched: false });
      pinchingControllerRef.current = undefined;
      previousTransformRef.current = undefined;
      setPinchedObject(handedness, undefined);
    }

    // for inline or remote hands
    useHandEvent("pinchend", selectOrPinchEnd);

    // for inline or remote hands
    useHandEvent("pinchstart", selectOrPinchStart);

    // for XR hands
    useXREvent("selectstart", ({ nativeEvent, target }) => {
      const motionController = target.hand.children.find(
        (child) => child.constructor.name === "OculusHandModel"
      )?.motionController;
      selectOrPinchStart({
        handedness: nativeEvent.data.handedness,
        motionController,
      });
    });

    // for XR hands
    useXREvent("selectend", ({ nativeEvent }) => {
      selectOrPinchEnd({ handedness: nativeEvent.data.handedness });
    });

    useUpdateGroup(ref, pinchingControllerRef, previousTransformRef);
    useSetPinching(ref);


    return (
      <group ref={mergeRefs([passedRef, ref])} {...props}>
        {children}
      </group>
    );
  }
);

export default Pinch;
