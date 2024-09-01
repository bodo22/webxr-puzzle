import React from "react";
import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import useSocket, { useLog, useUser } from "@/stores/socket";
import useInteracting, { useIsObjectPinched } from "@/stores/interacting";
import { useThree } from "@react-three/fiber";
import { getServerDateNow } from "../useGetServerDate";

export default function useListenForRemotePinch(ref, selectOrPinchEnd, props) {
  const scene = useThree((state) => state.scene);
  const socket = useSocket((state) => state.socket);
  const pinched = useIsObjectPinched(props.name);
  const updatePiece = useSocket((state) => state.updatePiece);
  const log = useLog();
  const setLastRemotePinchOverride = useInteracting(
    (state) => state.setLastRemotePinchOverride
  );
  const objectOrientation = useSocket((state) => state.objectOrientation);
  const { type: userType } = useUser();
  const slerpAfterBothHandover =
    userType === "giver" && objectOrientation.level === "towardBoth";

  const { glb } = useSocket((state) => state.level);
  const meshName = `${glb}-meshWithBvh`;
  const collideObjectParent = scene.getObjectByName(meshName)?.parent;
  React.useEffect(() => {
    function handlePinchData(pinchData) {
      const obj = ref?.current;
      const dataIsForThisObj = props.name === pinchData.name;
      if (dataIsForThisObj) {
        if (pinched && props.pinchStart < pinchData.pinchStart) {
          // the server has decided that a remote pinch on this object
          // is younger, so we can end the current local pinch
          setLastRemotePinchOverride(pinched[0]);
          selectOrPinchEnd({ handedness: pinched[0] });
          console.log("end local pinch because of remote pinch", pinched);
          return; // test: remove this return?
        }
        obj.matrix = new Matrix4();
        obj.matrix.elements = pinchData.matrix;
        const currQuat = new Quaternion().copy(obj.quaternion);
        obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
        if (slerpAfterBothHandover) {
          const tmp = new Matrix4();
          tmp.elements = pinchData.matrix;
          const goalQuat = new Quaternion();
          tmp.decompose(new Vector3(), goalQuat, new Vector3());
          const angle = MathUtils.radToDeg(goalQuat.angleTo(currQuat));
          if (angle > 10) {
            // console.log("angle too big", angle);
            // obj.quaternion.slerpQuaternions(currQuat, goalQuat, 0.05);
            currQuat.rotateTowards(goalQuat, MathUtils.degToRad(5));
            obj.quaternion.copy(currQuat);
            obj.updateMatrix();
          }
        }
        obj.updateWorldMatrix(false, true);
        collideObjectParent.matrix = new Matrix4();
        collideObjectParent.matrix.elements = obj.matrix.elements;
        collideObjectParent.matrix.decompose(
          collideObjectParent.position,
          collideObjectParent.quaternion,
          collideObjectParent.scale
        );
        collideObjectParent.updateWorldMatrix(false, true);
        if (pinchData.timestamp) {
          const received = getServerDateNow();
          log({
            type: "objectMatrixUpdate",
            name: pinchData.name,
            sent: pinchData.timestamp,
            received,
            difference: received - pinchData.timestamp,
          });
        }
      }
    }
    socket.on("pinchData", handlePinchData);
    return () => {
      socket.off("pinchData", handlePinchData);
    };
  }, [
    socket,
    pinched,
    ref,
    selectOrPinchEnd,
    props.name,
    props.pinchStart,
    log,
    collideObjectParent,
    setLastRemotePinchOverride,
    slerpAfterBothHandover,
  ]);
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
