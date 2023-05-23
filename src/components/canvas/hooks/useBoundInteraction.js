// only works for 2 player-mode for now
import React from "react";
import { Vector3, Box3, MathUtils } from "three";
import useSocket, { useDebug, useUser, useUsers } from "@/stores/socket";
import { formatRgb } from "culori";

import { create } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";

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
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const handView = useSocket((state) => state.handView);
  const { pizzaRadius } = useDebug();
  const { color } = useUser();
  const users = useUsers();

  let rotationY = 0;
  let position = new Vector3();
  if (handView === "Pizza" && pizzaPositions[userIdIndex]) {
    position = pizzaPositions[userIdIndex];
    const rotateSegments = users.length;
    // absolute index of userId of hands in users array
    const rotationDeg = userIdIndex * -(360 / rotateSegments);
    rotationY = MathUtils.degToRad(rotationDeg);
  }

  const boxProps = {
    args: [1, 1, pizzaRadius * 2],
    position,
    "rotation-y": rotationY,
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
