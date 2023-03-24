import { useGLTF } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";

import Pinch from "./Pinch";
import ShowWorldPosition from "./debug/ShowWorldPosition";
import { useIsColliding } from "./hooks";

export default function Crate(props) {
  const group = useRef();
  const isColliding = useIsColliding(group, props.debug);
  const { nodes, materials } = useGLTF(
    "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf"
  );


  const materialsRef = useRef(materials);
  const [isPinched, setPinched] = useState(false);

  useEffect(() => {
    materialsRef.current = Object.values(materials).reduce(
      (object, material) => {
        object[material.name] = material.clone();
        material.metalness = 0.5;
        return object;
      },
      {}
    );
  }, [materials]);

  useEffect(() => {
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

  const onChange = React.useCallback(({ isPinched }) => {
    setPinched(isPinched);
  }, []);

  return (
    <Pinch
      onChange={onChange}
      isColliding={isColliding}
      ref={group}
      {...props}
    >
      {props.debug && <ShowWorldPosition target={group} />}
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
