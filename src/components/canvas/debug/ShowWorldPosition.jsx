import React from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { useThree, createPortal } from "@react-three/fiber";
import { useDebug } from "@/stores/socket";

export default function ShowWorldPosition({ target }) {
  const ref = React.useRef();
  const scene = useThree((state) => state.scene);
  const { piecesPos } = useDebug();

  useFrame(() => {
    if (target.current) {
      const position = target.current.getWorldPosition(new Vector3());
      if (ref.current) {
        ref.current.position.copy(position);
      }
    }
  });
  if (!piecesPos) {
    return null;
  }

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
