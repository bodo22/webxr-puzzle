import { Vector3, MathUtils } from "three";
import useSocket, { useUsers } from "@/stores/socket";
import React from "react";

export default function usePlayerTransform({ index, userId } = {}) {
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const userIdSelf = useSocket((state) => state.userId);
  const i = index ?? userIdIndex;
  const uId = userId ?? userIdSelf;

  const getPlayerTransform = useGetPlayerTransform();
  return getPlayerTransform({ uId, i });
}

export function useGetPlayerTransform() {
  const pizzaPositions = useSocket((state) => state.pizzaPositions);
  const handView = useSocket((state) => state.handView);
  const { studyMode } = useSocket((state) => state.level);
  const users = useUsers();
  return React.useCallback(({ uId, i }) => {
    const player1Transform = ["VR", "VR2"].includes(uId);

    let rotationY = 0;
    let position = new Vector3();
    if (studyMode === true && pizzaPositions.length > 1) {
      if (player1Transform) {
        position = pizzaPositions[1];
        rotationY = MathUtils.degToRad(180);
      } else {
        position = pizzaPositions[0];
      }
    } else {
      if (handView === "Pizza" && pizzaPositions[i]) {
        position = pizzaPositions[i];
        const rotateSegments = users.length;
        // absolute i of userId of hands in users array
        const rotationDeg = i * -(360 / rotateSegments);
        rotationY = MathUtils.degToRad(rotationDeg);
      }
    }

    return {
      position,
      "rotation-y": rotationY,
    };
  }, [handView, pizzaPositions, studyMode, users.length]);
}
