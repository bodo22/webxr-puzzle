import React from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { useThree, createPortal } from "@react-three/fiber";

export default function ShowWorldPosition({ target }) {
  const ref = React.useRef();
  const scene = useThree((state) => state.scene);

  useFrame(() => {
    if (target.current) {
      const position = target.current.getWorldPosition(new Vector3());
      if (ref.current) {
        ref.current.position.copy(position);
      }
    }
  });

  return createPortal(
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="blue" />
      </mesh>
    </group>,
    scene
  );
}
