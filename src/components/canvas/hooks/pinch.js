import React from "react";
import { useThree } from "@react-three/fiber";
import { useHelper } from "@react-three/drei";
import { BoxHelper, Vector3, Matrix4 } from "three";
import { formatRgb } from "culori";

import { useDebug, useUser } from "@/stores/socket";
import useInteracting, { useIsObjectPinched } from "@/stores/interacting";
import { useIsInBoundary } from "./useBoundInteraction";

export function usePinch({ name, isColliding }) {
  const { color } = useUser();
  const ref = React.useRef({ userData: {} });
  const pinchingControllerRef = React.useRef();
  const previousTransformRef = React.useRef();
  const { setPinchedObject, setPinching, pinching } = useInteracting(
    (state) => state
  );
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
      }
    },
    [isColliding, setPinchedObject, setPinching, isInBoundary]
  );

  const selectOrPinchEnd = React.useCallback(
    ({ handedness }) => {
      setPinching(handedness, false);
      ref.current.userData.pinchStart = undefined;
      pinchingControllerRef.current = undefined;
      previousTransformRef.current = undefined;
      setPinchedObject(handedness, undefined);
    },
    [setPinchedObject, setPinching]
  );

  const xr = useThree((state) => state.gl.xr);

  const somePinching = Object.values(pinching).some(Boolean);

  React.useEffect(() => {
    const handler = ({ data }) => {
      if (!somePinching) {
        return;
      }
      Object.entries(data).forEach(([handedness, joints]) => {
        const indexFingerTip = joints["index-finger-tip"];
        const matrix = new Matrix4();
        matrix.fromArray(indexFingerTip.transformMatrix);
        const position = new Vector3().setFromMatrixPosition(matrix);
        const inBoundary = isInBoundary(position);
        if (!inBoundary) {
          selectOrPinchEnd({ handedness });
        }
      });
    };
    xr.addEventListener("managedHandsJointData", handler);
    return () => {
      xr.removeEventListener("managedHandsJointData", handler);
    };
  }, [xr, isInBoundary, selectOrPinchEnd, somePinching]);

  return {
    selectOrPinchEnd,
    selectOrPinchStart,
    ref,
    pinchingControllerRef,
    previousTransformRef,
  };
}
