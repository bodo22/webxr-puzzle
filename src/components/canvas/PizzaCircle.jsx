import React from "react";
import { DoubleSide, MathUtils, Vector3 } from "three";
import { Text } from "@react-three/drei";
import useSocket, { arrayRotate, useUsers } from "@/stores/socket";
import { formatRgb } from "culori";

const radius = 1;

export default function PizzaCircle({ setPizzaPositions, pizzaPositions }) {
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const users = useUsers();
  const usersLength = users.length;
  const circleMeshRef = React.useRef();

  const circleSegments = usersLength < 3 ? 4 : usersLength;
  const thetaStart = MathUtils.degToRad(90);

  React.useLayoutEffect(() => {
    if (circleMeshRef.current) {
      let gp = circleMeshRef.current.geometry.attributes.position;
      const newPositions = new Array(gp.count).fill().map((_, index) => {
        let p = new Vector3().fromBufferAttribute(gp, index);
        circleMeshRef.current.localToWorld(p);
        return p;
      });
      // first & last are "starting" points, in center of circle
      // rotate array, to have "own" hands at array position 0
      setPizzaPositions(arrayRotate(newPositions.slice(1, -1), userIdIndex));
    }
  }, [setPizzaPositions, circleSegments, userIdIndex, usersLength]);

  return (
    <>
      <mesh ref={circleMeshRef} position-z={-radius} rotation-x={thetaStart}>
        <circleGeometry args={[radius, circleSegments, thetaStart]} />
        <meshStandardMaterial
          side={DoubleSide}
          wireframe
          transparent
          opacity={1}
        />
      </mesh>
      {pizzaPositions.map((position, index) => {
        const color = users[index]?.color;
        return (
          <group
            position={position}
            key={`${circleSegments}-index-position-for-${index}`}
          >
            <Text
              color={formatRgb(color)}
              anchorX="center"
              anchorY="middle"
              fontSize={0.5}
            >
              {index}
            </Text>
          </group>
        );
      })}
    </>
  );
}
