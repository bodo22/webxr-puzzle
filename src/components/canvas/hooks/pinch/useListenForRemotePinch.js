import React from "react";
import { Matrix4 } from "three";
import useSocket, { useLog } from "@/stores/socket";
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
          // is younger we can end the current local pinch
          setLastRemotePinchOverride(pinched[0]);
          selectOrPinchEnd({ handedness: pinched[0] });
          console.log("end local pinch because of remote pinch", pinched);
          return; // test: remove this return?
        }
        obj.matrix = new Matrix4();
        obj.matrix.elements = pinchData.matrix;
        obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
        obj.updateWorldMatrix(false, true);
        collideObjectParent.matrix = new Matrix4();
        collideObjectParent.matrix.elements = pinchData.matrix;
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
