import React from "react";
import { useFrame } from "@react-three/fiber";
import { useXREvent } from "@react-three/xr";
import { mergeRefs } from "react-merge-refs";
import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import useSound from "use-sound";

import useSocket, { useLog } from "@/stores/socket";
import { useHandEvent, useIsObjectPinched } from "@/stores/interacting";
import {
  HandMotionController,
  TriggerMotionController,
} from "@/utils/MotionController";
import { usePinch } from "./hooks/pinch";
import { useIsInBoundary } from "./hooks/useBoundInteraction";

import lockSfx from "@/assets/sounds/lock.mp3";
import trashSfx from "@/assets/sounds/trash.mp3";

function useUpdateGroup(
  ref,
  pinchingControllerRef,
  previousTransformRef,
  selectOrPinchEnd,
  props
) {
  const sendPinchData = useSocket((state) => state.sendPinchData);
  const pinched = useIsObjectPinched(ref.current?.name);
  const goal = new Vector3(
    props.positionGoal[0],
    props.positionGoal[1] + 0.055,
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
    if (props.goalReached && ref.current) {
      ref.current.position.set(
        props.positionGoal[0],
        props.positionGoal[1] + 0.025,
        props.positionGoal[2]
      );
      ref.current.rotation.set(...props.rotationGoal);
      return;
    }
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
    const insideTrash = dToTrash <= positionThreshold * 2;

    let event;
    if (positionReached && !props.trash) {
      event = {
        type: "goalReached",
        distance: dToGoal,
        handedness: pinched[0],
      };
      ref.current.dispatchEvent(event);
    }
    if (insideTrash && !props.trashed) {
      event = {
        type: "insideTrash",
        distance: dToTrash,
        handedness: pinched[0],
      };
      ref.current.dispatchEvent(event);
    } else if (!insideTrash && props.trashed) {
      event = {
        type: "outsideTrash",
        distance: dToTrash,
        handedness: pinched[0],
      };
      ref.current.dispatchEvent(event);
    }

    sendPinchData({
      pinchStart: props.pinchStart,
      matrix: ref.current.matrix.elements,
      name: ref.current.name,
    });
  });
}

function useListenForRemotePinch(ref, selectOrPinchEnd, props) {
  const socket = useSocket((state) => state.socket);
  const pinched = useIsObjectPinched(props.name);
  const updatePiece = useSocket((state) => state.updatePiece);

  React.useEffect(() => {
    function handlePinchData(pinchData) {
      const obj = ref?.current;
      const dataIsForThisObj = props.name === pinchData.name;
      if (dataIsForThisObj) {
        if (pinched) {
          // the server has decided that a remote pinch on this object
          // is younger we can end the current local pinch
          selectOrPinchEnd({ handedess: pinched[0] });
          console.log("end local pinch because of remote pinch");
          return; // test: remove this return?
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
  }, [socket, pinched, ref, selectOrPinchEnd, props.name]);
  React.useEffect(() => {
    function handlePieceStateData(pieceStateData) {
      const dataIsForThisObj = props.name === pieceStateData.name;
      if (
        dataIsForThisObj &&
        (props.pinchStart ?? 0) < pieceStateData.pinchStart
      ) {
        if (pieceStateData.trashed !== props.trashed) {
          updatePiece(props.name, "trashed", pieceStateData.trashed);
        }
        if (pieceStateData.success !== props.success) {
          updatePiece(props.name, "success", pieceStateData.success);
        }
      }
    }
    socket.on("pieceStateData", handlePieceStateData);
    return () => {
      socket.off("pieceStateData", handlePieceStateData);
    };
  }, [
    socket,
    props.name,
    props.trashed,
    props.success,
    props.pinchStart,
    updatePiece,
  ]);
}

const Pinch = React.forwardRef(({ children, ignore, ...props }, passedRef) => {
  const {
    selectOrPinchEnd,
    selectOrPinchStart,
    ref,
    pinchingControllerRef,
    previousTransformRef,
  } = usePinch({ ...props });
  const [playLock] = useSound(lockSfx);
  const [playTrash] = useSound(trashSfx);
  const updatePiece = useSocket((state) => state.updatePiece);
  const pieces = useSocket((state) => state.pieces);
  const log = useLog();

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
      console.warn(
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
  useListenForRemotePinch(ref, selectOrPinchEnd, props);

  React.useEffect(() => {
    const group = ref.current;
    function handleGoalReached({ target, ...e }) {
      log(e);
      updatePiece(props.name, "success", true);
      selectOrPinchEnd({ handedness: e.handedness });
      playLock();
    }
    group.addEventListener("goalReached", handleGoalReached);
    return () => {
      group.removeEventListener("goalReached", handleGoalReached);
    };
  }, [
    playLock,
    props.name,
    props.trash,
    updatePiece,
    selectOrPinchEnd,
    ref,
    log,
  ]);

  const lastSuccess =
    pieces.filter(({ success }) => success === true).length + 1 ===
    pieces.length;

  React.useEffect(() => {
    const group = ref.current;
    function handleEvent({ target, ...e }) {
      log(e);
      const trashed = e.type === "insideTrash";
      updatePiece(props.name, "trashed", trashed);
      if (props.trash) {
        updatePiece(props.name, "success", trashed);
        if (trashed === true && lastSuccess) {
          selectOrPinchEnd({ handedness: e.handedness });
        }
      }

      trashed && playTrash();
    }
    group.addEventListener("insideTrash", handleEvent);
    group.addEventListener("outsideTrash", handleEvent);
    return () => {
      group.removeEventListener("insideTrash", handleEvent);
      group.removeEventListener("outsideTrash", handleEvent);
    };
  }, [
    playTrash,
    props.name,
    props.trashed,
    props.trash,
    updatePiece,
    lastSuccess,
    ref,
    selectOrPinchEnd,
    log,
  ]);

  return (
    <group ref={mergeRefs([passedRef, ref])} {...props}>
      {children}
    </group>
  );
});

export default Pinch;
