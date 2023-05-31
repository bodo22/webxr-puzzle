import React from "react";
import { Select } from "@react-three/postprocessing";
import { Gltf, Stars, Sparkles } from "@react-three/drei";
import useSound from "use-sound";
import useSocket, { useUsers } from "@/stores/socket";
import RemoteHands from "./RemoteHands";
import GenericGltf from "@/components/canvas/GenericGltf";
import { useIsObjectPinched } from "@/stores/interacting";
import usePlayerTransform from "../hooks/usePlayerTransform";
// import RemoteControllers from "./RemoteControllers";
// import Crate from "@/components/canvas/Crate";
// import LiverArteries from "@/components/canvas/LiverArteries";

import successSfx from "@/sounds/success.mp3";
import failSfx from "@/sounds/fail.mp3";

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

const positionTrash = [-0.125, -0.45, 0];

export default function RemoteHandsAndControllers({ pizzaPositions }) {
  const controllers = useSocket((state) => state.controllers);
  const pieces = useSocket((state) => state.pieces);
  const users = useUsers();
  const [playSuccess] = useSound(successSfx);
  const [playFail] = useSound(failSfx);

  const plateRef = React.useRef();
  const trashRef = React.useRef();

  const levelSuccess =
    pieces.length && pieces.every(({ success }) => success === true);
  const levelFail =
    pieces.length && pieces.some(({ trashed, trash }) => trashed && !trash);

  React.useEffect(() => {
    levelSuccess && playSuccess();
  }, [levelSuccess, playSuccess]);

  React.useEffect(() => {
    levelFail && playFail();
  }, [levelFail, playFail]);

  return (
    <>
      {pieces
        .filter(({ render }) => !!render)
        .map((props) => {
          let positionGoal = props.positionGoal;
          if (props.trash) {
            positionGoal = positionTrash;
          }
          return (
            <SelectablePuzzlePiece
              key={props.key ?? props.name}
              {...props}
              positionGoal={positionGoal}
              positionTrash={positionTrash}
              ignorePinch={levelSuccess || levelFail}
            />
          );
        })}
      <Gltf
        src="models/pieces/plate.glb"
        ref={plateRef}
        scale={0.0025}
        position={[0.125, -0.35, 0]}
      />
      <Gltf
        src="models/pieces/1-trash.glb"
        ref={trashRef}
        scale={0.001}
        position={positionTrash}
      />
      {levelSuccess ? (
        <>
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          <Sparkles />
        </>
      ) : null}
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
