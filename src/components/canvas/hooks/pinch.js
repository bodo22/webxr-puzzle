import React from "react";
import { useHelper } from "@react-three/drei";
import { BoxHelper } from "three";
import { formatRgb } from "culori";
import useSound from "use-sound";

import useSocket, { useDebug, useUser, useLog } from "@/stores/socket";
import useInteracting, { useIsObjectPinched } from "@/stores/interacting";
import { useIsInBoundary } from "./useBoundInteraction";

import pinchSfx from "@/assets/sounds/pinch.mp3";
import releaseSfx from "@/assets/sounds/release.mp3";

export function usePinch({ name, isColliding }) {
  const { color } = useUser();
  const ref = React.useRef({ userData: {} });
  const pinchingControllerRef = React.useRef();
  const previousTransformRef = React.useRef();
  const { setPinchedObject, setPinching, pinchedObjects } = useInteracting(
    (state) => state
  );
  const isPinched = !!useIsObjectPinched(name);
  const helperColor = isPinched ? formatRgb(color) : "blue";
  const { boundBoxes } = useDebug();
  const isInBoundary = useIsInBoundary();
  const [playPinch] = useSound(pinchSfx);
  const [playRelease] = useSound(releaseSfx);
  const updatePiece = useSocket((state) => state.updatePiece);
  const log = useLog();

  useHelper(boundBoxes && ref, BoxHelper, helperColor);

  const selectOrPinchStart = React.useCallback(
    ({ handedness, pinchingController }) => {
      const position = pinchingController.position;
      const inBoundary = isInBoundary(position);
      if (!inBoundary) {
        return;
      }
      setPinching(handedness, true);
      const colliding = isColliding({ position, pinchingController });
      if (colliding) {
        log({
          type: "selectOrPinchStart",
          colliding,
          handedness,
          name: ref.current.name,
        });
        const transform = pinchingController.transform;
        previousTransformRef.current = transform.clone();
        pinchingControllerRef.current = pinchingController;
        updatePiece(ref.current.name, "pinchStart", Date.now());
        setPinchedObject(handedness, ref.current.name);
        playPinch();
      }
    },
    [
      isColliding,
      setPinchedObject,
      setPinching,
      isInBoundary,
      playPinch,
      updatePiece,
      log,
    ]
  );

  const selectOrPinchEnd = React.useCallback(
    ({ handedness }) => {
      const { pinching } = useInteracting.getState();
      if (pinching[handedness]) {
        setPinching(handedness, false);
        // ref.current.userData.pinchStart = undefined;
        pinchingControllerRef.current = undefined;
        previousTransformRef.current = undefined;
        setPinchedObject(handedness, undefined);
        if (pinchedObjects[handedness]) {
          log({
            type: "selectOrPinchEnd",
            handedness,
            name: ref.current.name,
          });
          playRelease();
        }
      }
    },
    [setPinchedObject, setPinching, playRelease, pinchedObjects, log]
  );

  return {
    selectOrPinchEnd,
    selectOrPinchStart,
    ref,
    pinchingControllerRef,
    previousTransformRef,
  };
}
