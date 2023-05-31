import React from "react";
import { useHelper } from "@react-three/drei";
import { BoxHelper } from "three";
import { formatRgb } from "culori";
import useSound from "use-sound";

import { useDebug, useUser } from "@/stores/socket";
import useInteracting, { useIsObjectPinched } from "@/stores/interacting";
import { useIsInBoundary } from "./useBoundInteraction";

import pinchSfx from "@/sounds/pinch.mp3";
import releaseSfx from "@/sounds/release.mp3";

export function usePinch({ name, isColliding }) {
  const { color } = useUser();
  const ref = React.useRef({ userData: {} });
  const pinchingControllerRef = React.useRef();
  const previousTransformRef = React.useRef();
  const { setPinchedObject, setPinching, pinchedObjects } = useInteracting((state) => state);
  const isPinched = !!useIsObjectPinched(name);
  const helperColor = isPinched ? formatRgb(color) : "blue";
  const { boundBoxes } = useDebug();
  const isInBoundary = useIsInBoundary();
  const [playPinch] = useSound(pinchSfx);
  const [playRelease] = useSound(releaseSfx);

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
        const transform = pinchingController.transform;
        previousTransformRef.current = transform.clone();
        pinchingControllerRef.current = pinchingController;
        ref.current.userData.pinchStart = Date.now();
        setPinchedObject(handedness, ref.current.name);
        playPinch();
      }
    },
    [isColliding, setPinchedObject, setPinching, isInBoundary, playPinch]
  );

  const selectOrPinchEnd = React.useCallback(
    ({ handedness }) => {
      const { pinching } = useInteracting.getState();
      if (pinching[handedness]) {
        setPinching(handedness, false);
        ref.current.userData.pinchStart = undefined;
        pinchingControllerRef.current = undefined;
        previousTransformRef.current = undefined;
        setPinchedObject(handedness, undefined);
        if (pinchedObjects[handedness]) {
          playRelease();
        }
      }
    },
    [setPinchedObject, setPinching, playRelease, pinchedObjects]
  );

  return {
    selectOrPinchEnd,
    selectOrPinchStart,
    ref,
    pinchingControllerRef,
    previousTransformRef,
  };
}
