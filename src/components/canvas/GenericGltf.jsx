import React from "react";
import {
  // Cylinder,
  QuadraticBezierLine,
  useGLTF,
} from "@react-three/drei";
import Pinch from "./Pinch";
import Bvh from "./physics/Bvh";
import ShowWorldPosition from "./debug/ShowWorldPosition";
import { useDebug } from "@/stores/socket";
import { simplifiedHOH } from "@/utils/index";

simplifiedHOH.forEach((name) => {
  useGLTF.preload(`models/simplified/glbs/aligned/z-toward-user/${name}.glb`);
});

// https://github.com/pmndrs/drei#gltf
export default function GenericGltf({
  gltfPath,
  gltfPathDebug,
  gltfPathGoal,
  ignorePinch,
  ...props
}) {
  const ref = React.useRef();
  const goalRef = React.useRef();
  const { pieces: debugPieces, showBvhs } = useDebug();
  const src = gltfPath;

  const goalReached = props.success && !props.trash;

  const gltf = useGLTF(src);
  let mesh;
  gltf.scene.traverse((node) => {
    if (node.isMesh) {
      mesh = node;
      mesh.name = `${props.name}-mesh`;
    }
  });
  let meshWithBvh;
  const cloned = React.useMemo(() => gltf.scene.clone(), [gltf.scene]);
  cloned.traverse((node) => {
    if (node.isMesh) {
      meshWithBvh = node;
      meshWithBvh.name = `${props.name}-meshWithBvh`;
      meshWithBvh.material = meshWithBvh.material.clone();
      meshWithBvh.material.color.set("red");
    }
  });

  return (
    <>
      <Pinch
        ref={ref}
        mesh={mesh}
        {...props}
        userData={{
          origProps: props,
        }}
        goalReached={goalReached}
        ignore={goalReached || ignorePinch}
        // visible={false}
      >
        <ShowWorldPosition
          target={ref}
          text={props.pinchStart ?? props.pinchStart}
        />
        <ShowWorldPosition target={goalRef} />
        <primitive object={gltf.scene} />
        {/* <axesHelper args={[200]} /> */}
      </Pinch>
      <group {...props} name={`${props.name}-bvh-parent`} visible={!!showBvhs}>
        <primitive object={meshWithBvh} />
      </group>
      {/* {(spectatorAndNotTrash || showGoalPlatform) && (
        <group
          position={props.positionGoal}
          scale={props.scaleGoal ?? props.scale}
        >
          <group scale={1.5}>
            <Cylinder args={[1, 1, 0.1, 30]} ref={goalRef}>
              <meshStandardMaterial metalness={0} color={color} />
            </Cylinder>
          </group>
        </group>
      )} */}
      {/* {!props.trash && (
      <group position={props.positionGoal} scale={props.scale * 1.4}>
          <Cylinder args={[1, 1, 0.1, 30]} ref={goalRef}>
            <meshStandardMaterial metalness={0} color={color} />
          </Cylinder>
        </group>
      )} */}
      {/* https://github.com/pmndrs/drei#quadraticbezierline */}
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
      <Bvh mesh={meshWithBvh} />
    </>
  );
}
