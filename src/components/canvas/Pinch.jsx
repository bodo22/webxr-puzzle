import React from "react";
import { useFrame } from "@react-three/fiber";
import { useXREvent } from "@react-three/xr";
import { mergeRefs } from "react-merge-refs";
import { Matrix4, Quaternion, Vector3 } from "three";

import useSocket from "@/stores/socket";
import useInteracting, {
  useHandEvent,
  useIsObjectPinched,
} from "@/stores/interacting";
import {
  HandMotionController,
  TriggerMotionController,
} from "@/utils/MotionController";
import { usePinch } from "./hooks/pinch";

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

function useListenForRemotePinch(name, ref, selectOrPinchEnd) {
  const socket = useSocket((state) => state.socket);
  const isPinched = useIsObjectPinched(name);

  React.useEffect(() => {
    function handlePinchData(pinchData) {
      const obj = ref?.current;
      const dataIsForThisObj = name === pinchData.name;
      if (dataIsForThisObj) {
        if (isPinched) {
          // the server has decided that a remote pinch on this object
          // is younger we can end the current local pinch
          selectOrPinchEnd({ name });
          return;
        }
        obj.matrix = new Matrix4();
        obj.matrix.elements = pinchData.matrix;
        obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
        obj.updateWorldMatrix(false, true);
      }
    }
    socket.on("pinchData", handlePinchData);
    return () => {
      socket.off("pinchData", handlePinchData);
    };
  }, [socket, name, isPinched, ref, selectOrPinchEnd]);
}

const Pinch = React.forwardRef(({ children, ...props }, passedRef) => {
  const {
    selectOrPinchEnd,
    selectOrPinchStart,
    ref,
    pinchingControllerRef,
    previousTransformRef,
  } = usePinch(props);

  // for XR hands
  useXREvent("selectstart", ({ nativeEvent, target }) => {
    const handModelController = target.hand.children.find(
      (child) => child.constructor.name === "OculusHandModel"
    )?.handModelController;

    let pinchingController;
    if (handModelController) {
      pinchingController = new HandMotionController(handModelController);
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

  // for inline or remote hands
  useHandEvent("pinchstart", selectOrPinchStart);

  // for inline or remote hands
  useHandEvent("pinchend", selectOrPinchEnd);

  useUpdateGroup(ref, pinchingControllerRef, previousTransformRef);
  useListenForRemotePinch(props.name, ref, selectOrPinchEnd);

  return (
    <group ref={mergeRefs([passedRef, ref])} {...props}>
      {children}
    </group>
  );
});

export default Pinch;
