import React from "react";
import { useHelper } from "@react-three/drei";
import { BoxHelper } from "three";
import { formatRgb } from "culori";

import { useDebug, useUser } from "@/stores/socket";
import useInteracting, { useIsObjectPinched } from "@/stores/interacting";
import { useIsInBoundary } from "./useBoundInteraction";

export function usePinch({
  name,
  isColliding,
  pinchSoundRef,
  releaseSoundRef,
}) {
  const { color } = useUser();
  const ref = React.useRef({ userData: {} });
  const pinchingControllerRef = React.useRef();
  const previousTransformRef = React.useRef();
  const { setPinchedObject, setPinching } = useInteracting((state) => state);
  const isPinched = !!useIsObjectPinched(name);
  const helperColor = isPinched ? formatRgb(color) : "blue";
  const { boundBoxes } = useDebug();
  const isInBoundary = useIsInBoundary();

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
        pinchSoundRef.current.play();
      }
    },
    [isColliding, setPinchedObject, setPinching, isInBoundary, pinchSoundRef]
  );

  const selectOrPinchEnd = React.useCallback(
    ({ handedness }) => {
      const { pinching } = useInteracting.getState();
      if (pinching[handedness]) {
        // avoid multiple events being thrown
        setPinching(handedness, false);
        ref.current.userData.pinchStart = undefined;
        pinchingControllerRef.current = undefined;
        previousTransformRef.current = undefined;
        setPinchedObject(handedness, undefined);
        releaseSoundRef.current.play();
      }
    },
    [setPinchedObject, setPinching, releaseSoundRef]
  );

  return {
    selectOrPinchEnd,
    selectOrPinchStart,
    ref,
    pinchingControllerRef,
    previousTransformRef,
  };
}
