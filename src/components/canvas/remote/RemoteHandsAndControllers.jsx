import React from "react";
import { MathUtils } from "three";

import useSocket, { useUsers } from "@/stores/socket";
import RemoteControllers from "./RemoteControllers";
import RemoteHands from "./RemoteHands";

export default function RemoteHandsAndControllers({ pizzaPositions }) {
  const controllers = useSocket((state) => state.controllers);
  const handView = useSocket((state) => state.handView);
  const users = useUsers();

  return (
    <>
      {users.map(({ userId }, index) => {
        const targets = controllers[userId];
        const targetComponents = targets.map((target) => {
          const groupProps = {
            key: `${userId}-${target.handedness}`,
            "rotation-y": 0,
          };
          if (handView === "Pizza") {
            // as first (and last) pizzaPosition is center, + 1 here to get circle border points
            groupProps.position = pizzaPositions[index + 1];
            const rotationDeg = index * -(360 / users.length);
            groupProps["rotation-y"] = MathUtils.degToRad(rotationDeg);
          }
          return (
            <group {...groupProps}>
              <primitive object={target} />
            </group>
          );
        });
        return targetComponents;
      })}
      <RemoteControllers controllers={controllers} />
      <RemoteHands controllers={controllers} />
    </>
  );
}
