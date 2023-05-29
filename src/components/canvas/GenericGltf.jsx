import React from "react";
import { Gltf, QuadraticBezierLine, PositionalAudio } from "@react-three/drei";
import { formatRgb } from "culori";

import Pinch from "./Pinch";
import ShowWorldPosition from "./debug/ShowWorldPosition";
import useIsColliding from "./hooks/useIsColliding";
import { useDebug } from "@/stores/socket";

// https://github.com/pmndrs/drei#gltf
export default function GenericGltf({
  gltfPath,
  gltfPathDebug,
  gltfPathGoal,
  ...props
}) {
  const ref = React.useRef();
  const goalRef = React.useRef();
  const lockSoundRef = React.useRef();
  const isColliding = useIsColliding(ref);
  const { pieces } = useDebug();
  const src = pieces ? gltfPathDebug : gltfPath;
  const [goalReached, setGoalReached] = React.useState(false);

  React.useEffect(() => {
    const group = ref.current;
    function handleGoalReached(e) {
      setGoalReached(true);
      lockSoundRef.current?.play();
    }
    group.addEventListener("goalReached", handleGoalReached);
    return () => {
      group.removeEventListener("goalReached", handleGoalReached);
    };
  });

  React.useEffect(() => {
    const group = goalRef.current;
    const color = goalReached ? "green" : formatRgb(props.color);
    group.traverse((node) => {
      if (node.material) {
        node.material.color.set(color);
        node.material.metalness = 0;
      }
    });
  }, [goalRef, goalReached, props.color]);

  return (
    <>
      <Pinch
        isColliding={isColliding}
        ref={ref}
        {...props}
        goalReached={goalReached}
      >
        <ShowWorldPosition target={ref} />
        <Gltf src={src} /* receiveShadow castShadow */ />
        {/* https://github.com/pmndrs/drei#quadraticbezierline */}
      </Pinch>
      {pieces && (
        <QuadraticBezierLine
          start={props.position} // Starting point, can be an array or a vec3
          end={[props.positionGoal[0], 0.2, props.positionGoal[2]]} // Ending point, can be an array or a vec3
          mid={[0, 1, 0]} // Optional control point, can be an array or a vec3
          color="red" // Default
          lineWidth={2} // In pixels (default)
        />
      )}
      <group position={props.positionGoal} scale={props.scale * 1.5}>
        <Gltf src={gltfPathGoal} ref={goalRef} />
        <PositionalAudio url="sounds/lock.mp3" ref={lockSoundRef} loop={false} />
      </group>
    </>
  );
}
