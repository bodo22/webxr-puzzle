import React from "react";
import { useGLTF } from "@react-three/drei";

import Pinch from "./Pinch";
import ShowWorldPosition from "./debug/ShowWorldPosition";
import { useIsColliding } from "./hooks";
import { useIsObjectPinched } from "@/stores/interacting";
export default function Crate(props) {
  const group = React.useRef();
  const isColliding = useIsColliding(group);
  const { nodes, materials } = useGLTF(
    "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf"
  );

  const materialsRef = React.useRef(materials);
  const isPinched = useIsObjectPinched(props.name);

  React.useEffect(() => {
    if (isPinched) {
      Object.values(materialsRef.current).forEach((material) => {
        material.metalness = 0.1;
      });
    } else {
      Object.values(materialsRef.current).forEach((material) => {
        material.metalness = 0.5;
      });
    }
  }, [isPinched]);

  return (
    <Pinch isColliding={isColliding} ref={group} {...props}>
      <ShowWorldPosition target={group} />
      <group>
        <mesh
          geometry={nodes.Cube013.geometry}
          material={materialsRef.current["BrownDark.057"]}
        />
        <mesh
          geometry={nodes.Cube013_1.geometry}
          material={materialsRef.current["Metal.089"]}
        />
      </group>
    </Pinch>
  );
}

useGLTF.preload(
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf"
);
