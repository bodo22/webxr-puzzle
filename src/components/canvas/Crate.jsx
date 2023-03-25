import React from "react";
import { useGLTF } from "@react-three/drei";

import Pinch from "./Pinch";
import ShowWorldPosition from "./debug/ShowWorldPosition";
import { useIsColliding } from "./hooks";

export default function Crate(props) {
  const group = React.useRef();
  const isColliding = useIsColliding(group);
  const { nodes, materials } = useGLTF(
    "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf"
  );

  return (
    <Pinch isColliding={isColliding} ref={group} {...props}>
      <ShowWorldPosition target={group} />
      <group>
        <mesh
          geometry={nodes.Cube013.geometry}
          material={materials["BrownDark.057"]}
        />
        <mesh
          geometry={nodes.Cube013_1.geometry}
          material={materials["Metal.089"]}
        />
      </group>
    </Pinch>
  );
}

useGLTF.preload(
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf"
);
