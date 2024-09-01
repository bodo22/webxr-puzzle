import React from "react";
import { useHelper } from "@react-three/drei";
import { BoxHelper, Quaternion, Vector3 } from "three";
import { formatRgb } from "culori";
import useSound from "use-sound";

import useSocket, { useDebug, useUser, useLog } from "@/stores/socket";
import useInteracting, { useIsObjectPinched } from "@/stores/interacting";
// import { useIsInBoundary } from "../useBoundInteraction";

import pinchSfx from "@/assets/sounds/pinch.mp3";
import releaseSfx from "@/assets/sounds/release.mp3";
import useIsColliding from "../useIsColliding";
import { /* getHandPosition, */ getHandRotationMatrix } from "@/utils";
import useListenForBvhCollision from "./useListenForBvhCollision";
import { useThree } from "@react-three/fiber";
import useGetServerDateNow from "@/components/canvas/hooks/useGetServerDate";

export function usePinch({ name, mesh, ref, ignore }) {
  const isColliding = useIsColliding(mesh);
  const { color } = useUser();
  const { setPinchedObject, setPinching, pinchedObjects } = useInteracting(
    (state) => state
  );
  const isPinched = !!useIsObjectPinched(name);
  const helperColor = isPinched ? formatRgb(color) : "blue";
  const { boundBoxes } = useDebug();
  // const isInBoundary = useIsInBoundary();
  const [playPinch] = useSound(pinchSfx);
  const [playRelease] = useSound(releaseSfx);
  const updatePiece = useSocket((state) => state.updatePiece);
  const log = useLog();
  const scene = useThree((state) => state.scene);
  const handMeshModel = useInteracting(
    (state) => state.motionControllers.right
  );
  const { glb } = useSocket((state) => state.level);
  const meshName = `${glb}-meshWithBvh`;
  const collideObjectParent = scene.getObjectByName(meshName)?.parent;

  useHelper(boundBoxes, BoxHelper, helperColor);

  const getServerDateNow = useGetServerDateNow();

  const getHandQuat = React.useCallback(() => {
    const quat = new Quaternion();
    getHandRotationMatrix(handMeshModel).decompose(
      new Vector3(),
      quat,
      new Vector3()
    );
    return quat.toArray();
  }, [handMeshModel]);

  const lockObjectToHand = React.useCallback(
    (handedness) => {
      if (ignore) {
        return;
      }
      updatePiece(name, "pinchStart", getServerDateNow());
      setPinchedObject(handedness, name);
      const handQuat = getHandQuat();
      log({ type: "lockObjectToHand", handedness, name, handQuat });
      playPinch();
    },
    [
      ignore,
      updatePiece,
      name,
      getServerDateNow,
      setPinchedObject,
      getHandQuat,
      log,
      playPinch,
    ]
  );

  const releaseObjectFromHand = React.useCallback(
    (handedness) => {
      setPinching(handedness, false);
      setPinchedObject(handedness, undefined);
      if (collideObjectParent) {
        collideObjectParent.matrix.copy(ref.current.matrix);
        collideObjectParent.matrix.decompose(
          collideObjectParent.position,
          collideObjectParent.rotation,
          collideObjectParent.scale
        );
      }
      if (pinchedObjects[handedness]) {
        const handQuat = getHandQuat();

        log({ type: "releaseObjectFromHand", handedness, name, handQuat });
        playRelease();
      }
    },
    [
      getHandQuat,
      collideObjectParent,
      log,
      name,
      pinchedObjects,
      playRelease,
      ref,
      setPinchedObject,
      setPinching,
    ]
  );

  const selectOrPinchStart = React.useCallback(
    ({ handedness }) => {
      // const handMeshModel =
      //   useInteracting.getState().motionControllers[handedness];
      // const position = getHandPosition(handMeshModel);
      // const inBoundary = isInBoundary(position);
      // if (!inBoundary) {
      //   return;
      // }
      setPinching(handedness, true);
      const colliding = isColliding({ handedness });
      log({ type: "selectOrPinchStart", colliding, handedness, name });
      if (colliding) {
        lockObjectToHand(handedness);
      }
    },
    [/* isInBoundary,  */ setPinching, isColliding, lockObjectToHand, log, name]
  );

  const selectOrPinchEnd = React.useCallback(
    ({ handedness }) => {
      // const { pinching } = useInteracting.getState();
      log({ type: "selectOrPinchEnd", handedness, name });
      // if (pinching[handedness]) {
      releaseObjectFromHand(handedness);
      // }
    },
    [releaseObjectFromHand, log, name]
  );

  useListenForBvhCollision({
    handedness: "right",
    lockObjectToHand,
    releaseObjectFromHand,
  });
  // useListenForBvhCollision({
  //   handedness: "left",
  //   lockObjectToHand,
  //   releaseObjectFromHand,
  // });

  return { selectOrPinchEnd, selectOrPinchStart };
}
