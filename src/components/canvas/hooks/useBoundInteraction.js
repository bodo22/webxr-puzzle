// only works for 2 player-mode for now
import React from "react";
import { Box3, DoubleSide } from "three";
import useSocket, { useDebug, useUser } from "@/stores/socket";
import { formatRgb } from "culori";

import { create } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";
import usePlayerTransform from "./usePlayerTransform";

export function useIsInBoundary(type = "z-0-plane") {
  const boxRef = useBox((state) => state.boxRef);
  const userIdSelf = useSocket((state) => state.userId);

  const isInBox = React.useCallback(
    (position) => {
      const box = new Box3().setFromObject(boxRef?.current);
      return box.containsPoint(position);
    },
    [boxRef]
  );

  const isThisSideOfPlane = React.useCallback(
    (position) => {
      let inBoundary = true;
      if (userIdSelf === "VR" && position.z > 0.15) {
        inBoundary = false;
      }
      if (userIdSelf === "AR" && position.z < -0.15) {
        inBoundary = false;
      }
      return inBoundary;
    },
    [userIdSelf]
  );

  const isInBoundary = {
    "z-0-plane": isThisSideOfPlane,
    box: isInBox,
  }[type];

  return isInBoundary;
}

export function useBoundingBoxProps(pizzaPositions) {
  const { pizzaRadius } = useDebug();
  const { color } = useUser();
  const playerTransform = usePlayerTransform({ pizzaPositions });

  const boxProps = {
    args: [10, 10, pizzaRadius * 2],
    ...playerTransform,
    visible: false,
    // "material-wireframe": true,
    // "material-side": DoubleSide,
    "material-color": formatRgb(color),
  };

  return boxProps;
}

const initialState = {
  boxRef: undefined,
};

const mutations = (set, get) => {
  return {
    setBoxRef(boxRef) {
      set({ boxRef });
    },
  };
};

export const useBox = create(
  subscribeWithSelector(combine(initialState, mutations))
);
