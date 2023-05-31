import React from "react";
import { useFrame } from "@react-three/fiber";
import { useXREvent } from "@react-three/xr";
import { mergeRefs } from "react-merge-refs";
import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";

import useSocket from "@/stores/socket";
import { useHandEvent, useIsObjectPinched } from "@/stores/interacting";
import {
  HandMotionController,
  TriggerMotionController,
} from "@/utils/MotionController";
import { usePinch } from "./hooks/pinch";
import { useIsInBoundary } from "./hooks/useBoundInteraction";

function useUpdateGroup(
  ref,
  pinchingControllerRef,
  previousTransformRef,
  selectOrPinchEnd,
  props
) {
  const sendPinchData = useSocket((state) => state.sendPinchData);
  const userId = useSocket((state) => state.userId);
  const pinched = useIsObjectPinched(ref.current?.name);
  const goal = new Vector3(
    props.positionGoal[0],
    props.positionGoal[1] + 0.05,
    props.positionGoal[2]
  );
  const trash = new Vector3(
    props.positionTrash[0],
    props.positionTrash[1] + 0.05,
    props.positionTrash[2]
  );
  const { positionThreshold, rotationThreshold } = useSocket(
    (state) => state.level
  );

  const isInBoundary = useIsInBoundary();

  useFrame(() => {
    if (
      !pinched ||
      !pinchingControllerRef.current ||
      !previousTransformRef.current
    ) {
      return;
    }
    const handedness = pinched[0];

    const indexFingerTipPosition =
      pinchingControllerRef.current?.jointWorldPositionFor("index-finger-tip");

    const inBoundary = isInBoundary(indexFingerTipPosition);
    if (!inBoundary) {
      selectOrPinchEnd({ handedness });
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
    previousQuaternion.slerp(currentQuaternion, 1);
    const position = pinchingControllerRef.current.position;
    transform = new Matrix4().compose(
      position,
      previousQuaternion,
      new Vector3(1, 1, 1)
    );

    ref.current.applyMatrix4(transform);
    ref.current.updateWorldMatrix(false, true);
    previousTransformRef.current = transform.clone();

    // done moving pinched object

    const dToGoal = ref.current.position.distanceTo(goal);
    const positionReached = dToGoal <= positionThreshold;
    const dToTrash = ref.current.position.distanceTo(trash);
    const trashReached = dToTrash <= positionThreshold * 2;

    let event;
    if (trashReached) {
      event = {
        type: "trashReached",
        distance: dToTrash,
        handedness: pinched[0],
      };
      ref.current.dispatchEvent(event);
    } else if (positionReached) {
      const degX = Math.abs(MathUtils.radToDeg(ref.current.rotation.x));
      const degY = Math.abs(MathUtils.radToDeg(ref.current.rotation.y));
      const degZ = Math.abs(MathUtils.radToDeg(ref.current.rotation.z));
      const rotationReached =
        degX <= rotationThreshold &&
        degY <= rotationThreshold &&
        degZ <= rotationThreshold;
      if (rotationReached) {
        event = {
          type: "goalReached",
          distance: dToGoal,
          handedness: pinched[0],
        };
        ref.current.dispatchEvent(event);
      }
    }

    sendPinchData({
      pinchStart: ref.current.userData.pinchStart,
      matrix: ref.current.matrix.elements,
      name: ref.current.name,
      userId,
      event,
    });
  });
}

function useListenForRemotePinch(name, ref, selectOrPinchEnd) {
  const socket = useSocket((state) => state.socket);
  const pinched = useIsObjectPinched(name);

  React.useEffect(() => {
    function handlePinchData(pinchData) {
      const obj = ref?.current;
      const dataIsForThisObj = name === pinchData.name;
      if (dataIsForThisObj) {
        if (pinched) {
          // the server has decided that a remote pinch on this object
          // is younger we can end the current local pinch
          selectOrPinchEnd({ handedess: pinched[0] });
          return;
        }
        obj.matrix = new Matrix4();
        obj.matrix.elements = pinchData.matrix;
        obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
        obj.updateWorldMatrix(false, true);
        if (pinchData.event) {
          ref.current.dispatchEvent(pinchData.event);
        }
      }
    }
    socket.on("pinchData", handlePinchData);
    return () => {
      socket.off("pinchData", handlePinchData);
    };
  }, [socket, name, pinched, ref, selectOrPinchEnd]);
}

const Pinch = React.forwardRef(
  ({ children, ignore, ...props }, passedRef) => {
    const {
      selectOrPinchEnd,
      selectOrPinchStart,
      ref,
      pinchingControllerRef,
      previousTransformRef,
    } = usePinch({ ...props });

    // for XR hands
    useXREvent("selectstart", ({ nativeEvent, target }) => {
      if (ignore) {
        return;
      }
      const handModelController = target.hand.children.find(
        (child) => child.constructor.name === "OculusHandModel"
      )?.motionController;
      let pinchingController;
      if (handModelController) {
        pinchingController = new HandMotionController(handModelController);
      } else {
        console.warning(
          "using motion trigger controller, make sure this is intended"
        );
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
      if (ignore) {
        return;
      }
      selectOrPinchEnd({
        nativeEvent,
        handedness: nativeEvent.data.handedness,
      });
    });

    // for inline or remote hands, only for testing
    // useHandEvent("pinchstart", selectOrPinchStart);
    // useHandEvent("pinchend", selectOrPinchEnd);

    useUpdateGroup(
      ref,
      pinchingControllerRef,
      previousTransformRef,
      selectOrPinchEnd,
      props
    );
    useListenForRemotePinch(props.name, ref, selectOrPinchEnd);

    React.useEffect(() => {
      const group = ref.current;
      function handleEvent(e) {
        selectOrPinchEnd({ handedness: e.handedness });
      }
      group.addEventListener("goalReached", handleEvent);
      group.addEventListener("trashReached", handleEvent);
      return () => {
        group.removeEventListener("goalReached", handleEvent);
        group.removeEventListener("trashReached", handleEvent);
      };
    });

    return (
      <group ref={mergeRefs([passedRef, ref])} {...props}>
        {children}
      </group>
    );
  }
);

export default Pinch;
