import React from "react";
import { BoxHelper } from "three";
import { OBJLoader } from "three-stdlib";
import { useLoader } from "@react-three/fiber";
import { useHelper } from "@react-three/drei";

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
  const boxHelperRef = useHelper(props.debug && group, BoxHelper, "blue");
  const isColliding = useIsColliding(group, props.debug);
  const offset = useCenterObject(innerGroup);

  const onChange = React.useCallback(({ isPinched }) => {}, []);

  return (
    <Pinch
      onChange={onChange}
      isColliding={isColliding}
      ref={group}
      boxHelperRef={boxHelperRef}
      {...props}
      dispose={null}
    >
      {props.debug && <ShowWorldPosition target={group} />}
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
