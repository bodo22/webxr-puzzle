import React from "react";
import { Stars, Sparkles } from "@react-three/drei";
import useSound from "use-sound";
import useSocket, { useUsers, useLog } from "@/stores/socket";
import RemoteHands from "./RemoteHands";
import RemoteViewers from "./RemoteViewers";
import GenericGltf from "@/components/canvas/GenericGltf";

import successSfx from "@/assets/sounds/success.mp3";
import { useXREvent } from "@react-three/xr";
import Questions from "../Questions";

function RemoteTarget({ target }) {
  return <primitive object={target} />;
}

function RemoteXRControllers({ targets, userId }) {
  return (
    <group>
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
  return <GenericGltf key={props.name} {...props} />;
}

const positionTrash = [0, -10.45, 0];

const defaultTableHeight = 10;

export default function RemoteHandsAndControllers() {
  const [tableY, setTableY] = React.useState(defaultTableHeight);
  const controllers = useSocket((state) => state.controllers);
  const origPieces = useSocket((state) => state.pieces);
  let pieces = origPieces;
  const users = useUsers();
  const [playSuccess] = useSound(successSfx);
  const log = useLog();

  const levelSuccess =
    pieces.length && pieces.every(({ success }) => success === true);

  React.useEffect(() => {
    if (levelSuccess) {
      log({ type: "levelSuccess" });
      playSuccess();
    }
  }, [levelSuccess, playSuccess, log]);

  useXREvent("selectstart", ({ nativeEvent, ...rest }) => {
    log({
      type: "selectstart",
      handedness: nativeEvent.data.handedness,
    });
  });
  useXREvent("selectend", ({ nativeEvent }) => {
    log({
      type: "selectend",
      handedness: nativeEvent.data.handedness,
    });
  });

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
              ignorePinch={levelSuccess}
              // position={[props.position[0], tableY + .2, props.position[2]]}
            />
          );
        })}
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
          <Questions />
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
              index={index}
            />
          );
        })
        .flat()}
      <RemoteHands visible={!levelSuccess} />
      <RemoteViewers
        levelSuccess={levelSuccess}
        tableY={tableY}
        setTableY={setTableY}
        defaultTableHeight={defaultTableHeight}
      />
    </>
  );
}
