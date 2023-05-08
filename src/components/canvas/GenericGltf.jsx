import React from "react";
import { Gltf } from "@react-three/drei";

import Pinch from "./Pinch";
import ShowWorldPosition from "./debug/ShowWorldPosition";
import { useIsColliding } from "./hooks";

// https://github.com/pmndrs/drei#gltf
export default function GenericGltf({ gltfPath, ...props }) {
  const group = React.useRef();
  const isColliding = useIsColliding(group);

  return (
    <Pinch isColliding={isColliding} ref={group} {...props}>
      <ShowWorldPosition target={group} />
      <Gltf src={gltfPath} /* receiveShadow castShadow */ />
    </Pinch>
  );
}
