import React from "react";
import { MathUtils } from "three";

import useSocket, { useUsers } from "@/stores/socket";
// import RemoteControllers from "./RemoteControllers";
import RemoteHands from "./RemoteHands";

function RemoteHandAndController({ userId, target, pizzaPositions, index }) {
  const handView = useSocket((state) => state.handView);
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const users = useUsers();

  const groupProps = {
    key: `${userId}-${target.handedness}`,
    "rotation-y": 0,
  };
  if (handView === "Pizza") {
    groupProps.position = pizzaPositions[index];
    // to not have the 2 users be opposite of each other when there are only 2
    // put them 90° next to each other (as if there were 4)
    const rotateSegments = users.length === 2 ? 4 : users.length;
    // absolute index of hands in users array
    // minus userIdIndex to compensate array rotation of pizzaPositions
    // reason behind all the hassle: in pizza view, connected XR user hands have
    // no common reference space, so we need the rotate users around pizza center
    // for every user individually
    const rotationDeg = (index - userIdIndex) * -(360 / rotateSegments);
    groupProps["rotation-y"] = MathUtils.degToRad(rotationDeg);
  }
  return (
    <group {...groupProps}>
      <primitive object={target} />
    </group>
  );
}

export default function RemoteHandsAndControllers({ pizzaPositions }) {
  const controllers = useSocket((state) => state.controllers);
  const users = useUsers();

  return (
    <>
      {users.map(({ userId }, index) => {
        const targets = controllers[userId];
        if (!targets) {
          return null;
        }
        return targets.map((target) => {
          return (
            <RemoteHandAndController
              key={`${userId}-${target.handedness}`}
              userId={userId}
              target={target}
              pizzaPositions={pizzaPositions}
              index={index}
            />
          );
        });
      })}
      {/* <RemoteControllers controllers={controllers} /> */}
      <RemoteHands controllers={controllers} />
    </>
  );
}
