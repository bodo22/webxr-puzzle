// only works for 2 player-mode for now
import React from "react";
import { Box3 } from "three";
import { useDebug, useUser } from "@/stores/socket";
import { formatRgb } from "culori";

import { create } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";
import usePlayerTransform from "./usePlayerTransform";

export function useIsInBoundary() {
  const boxRef = useBox((state) => state.boxRef);
  const isInBoundary = React.useCallback(
    (position) => {
      const box = new Box3().setFromObject(boxRef?.current);
      return box.containsPoint(position);
    },
    [boxRef]
  );

  return isInBoundary;
}

export function useBoundingBoxProps(pizzaPositions) {
  const { pizzaRadius } = useDebug();
  const { color } = useUser();
  const playerTransform = usePlayerTransform({ pizzaPositions });

  const boxProps = {
    args: [1, 1, pizzaRadius * 2],
    ...playerTransform,
    visible: false,
    // "material-wireframe": true,
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
