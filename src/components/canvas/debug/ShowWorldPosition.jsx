import React from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { useThree, createPortal } from "@react-three/fiber";
import { useDebug } from "@/stores/socket";
import { Text } from "@react-three/drei";

export default function ShowWorldPosition({ target, text }) {
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
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.03]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      {text && (
        <Text
          color="white"
          // material-transparent={true}
          // material-opacity={0.6}
          // anchorX="center"
          // anchorY="middle"
          fontSize={0.05}
        >
          {text}
        </Text>
      )}
    </group>,
    scene
  );
}
