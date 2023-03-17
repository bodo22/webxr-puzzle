import React from "react";
import { MathUtils } from "three";

import useSocket, { useUsers } from "@/stores/socket";
// import RemoteControllers from "./RemoteControllers";
import RemoteHands from "./RemoteHands";
import Crate from "@/components/canvas/Crate";
import LiverArteries from "@/components/canvas/LiverArteries";

function RemoteTarget({ target }) {
  return <primitive object={target} />;
}

function RemoteXRControllers({ targets, pizzaPositions, index, userId }) {
  const handView = useSocket((state) => state.handView);
  const users = useUsers();

  const groupProps = {
    "rotation-y": 0,
  };
  if (handView === "Pizza") {
    groupProps.position = pizzaPositions[index];
    // to not have the 2 users be opposite of each other when there are only 2
    // put them 90° next to each other (as if there were 4)
    const rotateSegments = users.length === 2 ? 4 : users.length;
    // index of hands in users array (the position on the pizza)
    const rotationDeg = index * -(360 / rotateSegments);
    groupProps["rotation-y"] = MathUtils.degToRad(rotationDeg);
  }

  return (
    <group {...groupProps}>
      {targets?.map((target) => {
        const { handedness } = target;
        return (
          <RemoteTarget key={`${userId}-${handedness}-xr`} target={target} />
        );
      })}
    </group>
  );
}

export default function RemoteHandsAndControllers({ pizzaPositions }) {
  const controllers = useSocket((state) => state.controllers);
  const users = useUsers();

  return (
    <>
      <LiverArteries
        debug={true}
        name="my-fun-test-LiverArteries"
        scale={0.5}
        position={[-0.15, -0.2, -0.3]}
      />
      <Crate
        debug={true}
        name="my-fun-test-crate"
        scale={0.3}
        position={[-0.15, -0.2, -0.3]}
      />
      {users
        .map(({ userId }, index) => {
          const targets = controllers[userId];
          return (
            <RemoteXRControllers
              key={`${userId}-xr`}
              targets={targets}
              userId={userId}
              pizzaPositions={pizzaPositions}
              index={index}
            />
          );
        })
        .flat()}
      {/* <RemoteControllers controllers={controllers} /> */}
      <RemoteHands />
    </>
  );
}
