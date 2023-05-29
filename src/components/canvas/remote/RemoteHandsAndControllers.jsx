import React from "react";
import { Select } from "@react-three/postprocessing";

import useSocket, { useUsers } from "@/stores/socket";
import RemoteHands from "./RemoteHands";
import GenericGltf from "@/components/canvas/GenericGltf";
import { useIsObjectPinched } from "@/stores/interacting";
import usePlayerTransform from "../hooks/usePlayerTransform";
// import RemoteControllers from "./RemoteControllers";
// import Crate from "@/components/canvas/Crate";
// import LiverArteries from "@/components/canvas/LiverArteries";

const pieceComponentMapping = {
  // "my-fun-test-LiverArteries": LiverArteries,
  // "my-fun-test-crate": Crate,
};

function RemoteTarget({ target }) {
  return <primitive object={target} />;
}

function RemoteXRControllers({ targets, pizzaPositions, index, userId }) {
  const groupProps = usePlayerTransform({ index, pizzaPositions, userId });

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
  const isPinched = !!useIsObjectPinched(props.name);
  const MappedComponent = pieceComponentMapping[props.name];
  let component;

  if (MappedComponent === undefined) {
    component = <GenericGltf key={props.name} {...props} />;
  } else {
    component = <MappedComponent key={props.name} {...props} />;
  }
  return <Select enabled={isPinched}>{component}</Select>;
}

export default function RemoteHandsAndControllers({ pizzaPositions }) {
  const controllers = useSocket((state) => state.controllers);
  const pieces = useSocket((state) => state.pieces);
  const users = useUsers();

  return (
    <>
      {pieces
        .filter(({ render }) => !!render)
        .map((props) => {
          return (
            <SelectablePuzzlePiece key={props.key ?? props.name} {...props} />
          );
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
