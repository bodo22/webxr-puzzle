import React from "react";
import { useHelper } from "@react-three/drei";
import { BoxHelper } from "three";
import { formatRgb } from "culori";

import { useUser } from "@/stores/socket";

import useInteracting, { useIsObjectPinched } from "@/stores/interacting";
export function usePinch({ name, debug, isColliding }) {
  const { color } = useUser();
  const ref = React.useRef({ userData: {} });
  const pinchingControllerRef = React.useRef();
  const previousTransformRef = React.useRef();
  const { unpinchObject, setPinchedObject } = useInteracting((state) => state);
  const isPinched = useIsObjectPinched(name);
  const helperColor = isPinched ? formatRgb(color) : "blue";
  useHelper(debug && ref, BoxHelper, helperColor);

  const selectOrPinchStart = React.useCallback(
    ({ handedness, pinchingController }) => {
      const colliding = isColliding({ pinchingController });

      if (colliding) {
        const transform = pinchingController.transform;
        previousTransformRef.current = transform.clone();
        pinchingControllerRef.current = pinchingController;
        ref.current.userData.pinchStart = Date.now();
        setPinchedObject(handedness, ref.current.name);
      }
    },
    [isColliding, setPinchedObject]
  );

  const selectOrPinchEnd = React.useCallback(
    ({ handedness, name }) => {
      ref.current.userData.pinchStart = undefined;
      pinchingControllerRef.current = undefined;
      previousTransformRef.current = undefined;
      if (handedness) {
        setPinchedObject(handedness, undefined);
      } else {
        unpinchObject(name);
      }
    },
    [setPinchedObject, unpinchObject]
  );

  return {
    selectOrPinchEnd,
    selectOrPinchStart,
    ref,
    pinchingControllerRef,
    previousTransformRef,
  };
}
