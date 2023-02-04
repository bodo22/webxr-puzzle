import React from "react";
import { Vector3 } from "three";
import useSocket from "@/stores/socket";

import RemoteControllers from "./RemoteControllers";
import RemoteHands from "./RemoteHands";

export default function RemoteHandsAndControllers({ pizzaPositions }) {
  const controllers = useSocket((state) => state.controllers);
  const pizzaCenter = pizzaPositions[0];
  const lookAt = React.useCallback(
    (group) => {
      if (pizzaCenter && group) {
        group.lookAt(pizzaCenter);
        group.rotateOnAxis(new Vector3(0, 1, 0), 180 * (Math.PI / 180));
      }
    },
    [pizzaCenter]
  );

  return (
    <>
      {Object.entries(controllers).map(([userId, targets], index) =>
        targets.map((target) => {
          const groupProps = {
            key: `${userId}-${target.handedness}`,
            ref: lookAt,
          };
          if (pizzaPositions[index + 2]) { // TODO use position from admin panel
            groupProps.position = pizzaPositions[index + 2];
          }
          return (
            <group {...groupProps}>
              <primitive object={target} />
            </group>
          );
        })
      )}
      <RemoteControllers controllers={controllers} />
      <RemoteHands controllers={controllers} />
    </>
  );
}
