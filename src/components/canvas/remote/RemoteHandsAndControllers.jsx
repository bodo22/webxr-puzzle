import React from "react";
import { MathUtils } from "three";
import { Select } from "@react-three/postprocessing";

import useSocket, { useUsers } from "@/stores/socket";
// import RemoteControllers from "./RemoteControllers";
import RemoteHands from "./RemoteHands";
import Crate from "@/components/canvas/Crate";
import LiverArteries from "@/components/canvas/LiverArteries";
import { useIsObjectPinched } from "@/stores/interacting";

const pieceComponentMapping = {
  "my-fun-test-LiverArteries": LiverArteries,
  "my-fun-test-crate": Crate,
};

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

function SelectablePuzzlePiece(props) {
  const isPinched = useIsObjectPinched(props.name);
  const MappedComponent = pieceComponentMapping[props.name];
  return (
    <Select enabled={isPinched}>
      <MappedComponent key={props.name} {...props} />
    </Select>
  );
}

export default function RemoteHandsAndControllers({ pizzaPositions }) {
  const controllers = useSocket((state) => state.controllers);
  const pieces = useSocket((state) => state.pieces);
  const users = useUsers();

  return (
    <>
      {pieces.map((props) => {
        return <SelectablePuzzlePiece key={props.key ?? props.name} {...props} />;
      })}
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
