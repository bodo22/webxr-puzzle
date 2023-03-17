import React, { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useXREvent } from "@react-three/xr";
import { mergeRefs } from "react-merge-refs";
import { Matrix4, Quaternion, Vector3 } from "three";

import useSocket from "@/stores/socket";
import useInteracting, { useHandEvent } from "@/stores/interacting";
import {
  HandMotionController,
  TriggerMotionController,
} from "@/utils/MotionController";

function useUpdateGroup(ref, pinchingControllerRef, previousTransformRef) {
  const sendPinchData = useSocket((state) => state.sendPinchData);
  const userId = useSocket((state) => state.userId);

  useFrame(() => {
    const { pinchedObjects } = useInteracting.getState();
    const pinchingThisObject = Object.values(pinchedObjects).some(
      (pinchedObject) => pinchedObject && pinchedObject === ref.current.name
    );
    if (
      !pinchingControllerRef.current ||
      !pinchingThisObject ||
      !previousTransformRef.current
    ) {
      return;
    }
    let transform = pinchingControllerRef.current.transform;
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
    const position = pinchingControllerRef.current.position;
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
      pinchStart: ref.current.userData.pinchStart,
      matrix: ref.current.matrix.elements,
      name: ref.current.name,
      userId,
    });
  });
}

function useSetPinching(ref, selectOrPinchEnd) {
  const socket = useSocket((state) => state.socket);

  useEffect(() => {
    function handlePinchData(pinchData) {
      const obj = ref?.current;
      const dataIsForThisObj = obj?.name === pinchData.name;
      if (dataIsForThisObj) {
        if (
          obj.userData.pinchStart &&
          pinchData.pinchStart > obj.userData.pinchStart
        ) {
          // TODO: move this logic to server side (server decides: latest pinch wins)
          // the remote pinch was triggered after the local, so cancel the local pinch
          const { pinchedObjects } = useInteracting.getState();

          const pinchingThisObject = Object.entries(pinchedObjects).find(
            ([_, pinchedObject]) =>
              pinchedObject && pinchedObject === ref.current.name
          );
          selectOrPinchEnd({ handedness: pinchingThisObject[0] });
          return;
        }
        obj.matrix = new Matrix4();
        obj.matrix.elements = pinchData.matrix;
        obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
        ref.current.updateWorldMatrix(false, true);
      }
    }
    socket.on("pinchData", handlePinchData);
    return () => {
      socket.off("pinchData", handlePinchData);
    };
  }, [socket, ref, selectOrPinchEnd]);
}

const Pinch = React.forwardRef(
  ({ children, onChange, isColliding, ...props }, passedRef) => {
    const ref = React.useRef();
    const pinchingControllerRef = React.useRef();
    const previousTransformRef = React.useRef();
    const setPinchedObject = useInteracting((store) => store.setPinchedObject);

    function selectOrPinchStart({ handedness, pinchingController }) {
      const colliding = isColliding({ pinchingController });

      if (colliding) {
        onChange({ isPinched: true });
        const transform = pinchingController.transform;
        previousTransformRef.current = transform.clone();
        pinchingControllerRef.current = pinchingController;
        ref.current.userData.pinchStart = Date.now();
        setPinchedObject(handedness, ref.current.name);
      }
    }

    const selectOrPinchEnd = React.useCallback(
      ({ handedness }) => {
        onChange({ isPinched: false });
        ref.current.userData.pinchStart = undefined;
        pinchingControllerRef.current = undefined;
        previousTransformRef.current = undefined;
        setPinchedObject(handedness, undefined);
      },
      [onChange, setPinchedObject]
    );

    // for inline or remote hands
    useHandEvent("pinchend", selectOrPinchEnd);

    // for inline or remote hands
    useHandEvent("pinchstart", selectOrPinchStart);

    // for XR hands
    useXREvent("selectstart", ({ nativeEvent, target }) => {
      const oculusHandModel = target.hand.children.find(
        (child) => child.constructor.name === "OculusHandModel"
      );

      let pinchingController;
      if (oculusHandModel.motionController) {
        pinchingController = new HandMotionController(
          oculusHandModel.motionController
        );
      } else {
        pinchingController = new TriggerMotionController(target.controller);
      }
      selectOrPinchStart({
        nativeEvent,
        handedness: nativeEvent.data.handedness,
        pinchingController,
      });
    });

    // for XR hands
    useXREvent("selectend", ({ nativeEvent }) => {
      selectOrPinchEnd({
        nativeEvent,
        handedness: nativeEvent.data.handedness,
      });
    });

    useUpdateGroup(ref, pinchingControllerRef, previousTransformRef);
    useSetPinching(ref, selectOrPinchEnd);

    // React.useEffect(() => {
    //   if (pinchingControllerRef.current) {
    //     console.log("add obb", pinchingControllerRef.current.obb);
    //     scene.add(pinchingControllerRef.current.obb);
    //   }
    // });

    // console.log(!!pinchingControllerRef.current && pinchingControllerRef.current.target);
    // useHelper(!!pinchingControllerRef.current && pinchingControllerRef.current.target, BoxHelper, "blue");

    return (
      <group ref={mergeRefs([passedRef, ref])} {...props}>
        {children}
      </group>
    );
  }
);

export default Pinch;
