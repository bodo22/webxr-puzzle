import React from "react";
import { Gltf, QuadraticBezierLine } from "@react-three/drei";

import Pinch from "./Pinch";
import ShowWorldPosition from "./debug/ShowWorldPosition";
import useIsColliding from "./hooks/useIsColliding";
import { useDebug } from "@/stores/socket";

// https://github.com/pmndrs/drei#gltf
export default function GenericGltf({ gltfPath, gltfPathDebug, ...props }) {
  const group = React.useRef();
  const isColliding = useIsColliding(group);
  const { pieces } = useDebug();
  const src = pieces ? gltfPathDebug : gltfPath;
  return (
    <>
      <Pinch isColliding={isColliding} ref={group} {...props}>
        <ShowWorldPosition target={group} />
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
    </>
  );
}
