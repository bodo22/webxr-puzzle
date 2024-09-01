import React from "react";

import { useGLTF } from "@react-three/drei";

const furniture = {
  room: "models/furniture/Cube Room.glb",
  plant1: "models/furniture/Fiddle-leaf Plant.glb",
  plant2: "models/furniture/House plant.glb",
};

Object.values(furniture).forEach((v) => {
  useGLTF.preload(v);
});

function Room(props) {
  const { nodes, materials } = useGLTF(furniture.room);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.CubeRoom_GEO.geometry}
        material={materials.surfaceShader1SG}
      />
    </group>
  );
}

export function Plant1(props) {
  const { nodes, materials } = useGLTF(furniture.plant1);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.FiddleleafFigPottedPlant_mesh.geometry}
        material={materials.FiddleleafFigPottedPlant_mat}
      />
    </group>
  );
}

function Plant2(props) {
  const { nodes, materials } = useGLTF(furniture.plant2);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Houseplant_mesh.geometry}
        material={materials.Houseplant_mat1}
      />
    </group>
  );
}

export default function Furniture() {
  return (
    <group>
      <Room position-y="-1" />
      <Plant1 scale=".3" position={[3, -1, 3]} />
      <Plant2 scale=".3" position={[-3,-1,-3]} />
    </group>
  );
}
