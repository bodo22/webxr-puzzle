import React from "react";
import { Cylinder, Gltf, QuadraticBezierLine } from "@react-three/drei";
import { formatRgb } from "culori";
import Pinch from "./Pinch";
import ShowWorldPosition from "./debug/ShowWorldPosition";
import useIsColliding from "./hooks/useIsColliding";
import useSocket, { useDebug } from "@/stores/socket";

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
  const { pieces: debugPieces } = useDebug();
  const src = debugPieces ? gltfPathDebug : gltfPath;
  const userIdSelf = useSocket((state) => state.userId);

  const goalReached = props.success && !props.trash;
  const color = goalReached ? "green" : formatRgb(props.color);

  React.useEffect(() => {
    const piece = pieceRef.current;
    piece.traverse((node) => {
      if (node.material) {
        node.material.metalness = 0;
        node.material.color.set(color);
      }
    });
  }, [color]);

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
        goalReached={goalReached}
        ignore={goalReached || ignorePinch}
      >
        <ShowWorldPosition target={ref} />
        <ShowWorldPosition target={goalRef} />
        <Gltf src={src} ref={pieceRef} /* visible={!props.trashed} */ />
        {/* https://github.com/pmndrs/drei#quadraticbezierline */}
      </Pinch>
      {(spectator || showGoalPlatform) && (
        <group position={props.positionGoal} scale={props.scale * 1.5}>
          <Cylinder args={[1, 1, 0.1, 30]} ref={goalRef}>
            <meshStandardMaterial metalness={0} color={color} />
          </Cylinder>
        </group>
      )}
      {debugPieces && (
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
