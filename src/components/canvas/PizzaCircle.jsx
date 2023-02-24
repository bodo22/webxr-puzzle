import React from "react";
import { DoubleSide, MathUtils, Vector3 } from "three";
import { Text } from "@react-three/drei";
import useSocket, { useUsers } from "@/stores/socket";
import { formatRgb } from "culori";
import { OrbitControls } from "@react-three/drei";

const radius = 0.5;

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
      setPizzaPositions(newPositions.slice(1, -1));
    }
  }, [setPizzaPositions, circleSegments, userIdIndex]);

  return (
    <>
      {/* rotation-x = thetaState, because circleGeos are vertical to begin with */}
      <mesh ref={circleMeshRef} position-z={-radius} rotation-x={thetaStart}>
        {/* args[2] = thetaState, because circleGeos have their first segment at 3 O'Clock, but we want it at 6 */}
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
      <OrbitControls target={[0, 0, -radius]} />
    </>
  );
}
