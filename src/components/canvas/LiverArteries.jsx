import React from "react";
import { OBJLoader } from "three-stdlib";
import { useLoader } from "@react-three/fiber";

import Pinch from "./Pinch";
import { useIsColliding, useCenterObject } from "./hooks";
import ShowWorldPosition from "./debug/ShowWorldPosition";

export default function LiverArteries(props) {
  const innerGroup = React.useRef();
  const group = React.useRef();

  const obj1 = useLoader(OBJLoader, "/models/LiVR_Pat_ID4_Vein.obj");
  const obj2 = useLoader(OBJLoader, "/models/LiVR_Pat_ID4_Portal.obj");
  const meshRef1 = React.useRef();
  const meshRef2 = React.useRef();
  const isColliding = useIsColliding(group);
  const offset = useCenterObject(innerGroup);

  return (
    <Pinch isColliding={isColliding} ref={group} {...props}>
      <ShowWorldPosition target={group} />
      <group ref={innerGroup}>
        <mesh
          ref={meshRef1}
          position={offset}
          scale={0.005}
          geometry={obj1.children[0].geometry}
          material={obj1.children[0].material}
        />
        <mesh
          ref={meshRef2}
          position={offset}
          scale={0.005}
          geometry={obj2.children[0].geometry}
          material={obj2.children[0].material}
        />
      </group>
    </Pinch>
  );
}
