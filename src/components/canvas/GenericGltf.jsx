import React from "react";
import { Gltf, QuadraticBezierLine } from "@react-three/drei";
import { formatRgb } from "culori";
import Pinch from "./Pinch";
import ShowWorldPosition from "./debug/ShowWorldPosition";
import useIsColliding from "./hooks/useIsColliding";
import useSocket, { useDebug } from "@/stores/socket";
import useSound from "use-sound";
import lockSfx from "@/sounds/lock.mp3";
import trashSfx from "@/sounds/trash.mp3";

// https://github.com/pmndrs/drei#gltf
export default function GenericGltf({
  gltfPath,
  gltfPathDebug,
  gltfPathGoal,
  ignorePinch,
  ...props
}) {
  const ref = React.useRef();
  const pieceRef = React.useRef();
  const goalRef = React.useRef();
  const isColliding = useIsColliding(ref);
  const { pieces } = useDebug();
  const src = pieces ? gltfPathDebug : gltfPath;
  const [playLock] = useSound(lockSfx);
  const [playTrash] = useSound(trashSfx);
  const userIdSelf = useSocket((state) => state.userId);
  const updatePiece = useSocket((state) => state.updatePiece);

  React.useEffect(() => {
    const group = ref.current;
    function handleGoalReached(e) {
      updatePiece(props.name, "success", true);
      playLock();
    }
    group.addEventListener("goalReached", handleGoalReached);
    return () => {
      group.removeEventListener("goalReached", handleGoalReached);
    };
  }, [playLock, props.name, updatePiece]);

  React.useEffect(() => {
    const group = ref.current;
    function handleEvent(e) {
      updatePiece(props.name, "trashed", true);
      if (props.trash) {
        updatePiece(props.name, "success", true);
      }
      playTrash();
    }
    group.addEventListener("trashReached", handleEvent);
    return () => {
      group.removeEventListener("trashReached", handleEvent);
    };
  }, [props.trash, props.name, playTrash, updatePiece]);

  React.useEffect(() => {
    const goal = goalRef.current;
    const piece = pieceRef.current;
    const color = props.success ? "green" : formatRgb(props.color);
    goal?.traverse((node) => {
      if (node.material) {
        node.material.color.set(color);
        node.material.metalness = 0;
      }
    });
    piece.traverse((node) => {
      if (node.material) {
        node.material.metalness = 0;
        node.material.color.set(color);
      }
    });
  }, [goalRef, pieceRef, props.success, props.color]);

  const spectator = userIdSelf === "spectator";
  // goal is not trash and (goal is on this side (self or other sides give))
  const showGoalPlatform =
    !props.trash &&
    ((props.type === "self" && userIdSelf === props.env) ||
      (props.type === "give" && userIdSelf !== props.env));

  return (
    <>
      <Pinch
        isColliding={isColliding}
        ref={ref}
        {...props}
        ignore={props.success || props.trashed || ignorePinch}
      >
        <ShowWorldPosition target={ref} />
        <Gltf src={src} ref={pieceRef} visible={!props.trashed} />
        {/* https://github.com/pmndrs/drei#quadraticbezierline */}
      </Pinch>
      {(spectator || showGoalPlatform) && (
        <group position={props.positionGoal} scale={props.scale * 1.5}>
          <Gltf src={gltfPathGoal} ref={goalRef} />
        </group>
      )}
      {pieces && (
        <QuadraticBezierLine
          start={props.position}
          // end={[props.positionGoal[0], 0.1, props.positionGoal[2]]} // Ending point, can be an array or a vec3
          end={props.positionGoal}
          // mid={[0, 1, 0]} // Optional control point, can be an array or a vec3
          color="red" // Default
          lineWidth={2} // In pixels (default)
        />
      )}
    </>
  );
}
