import React from "react";
import { DoubleSide, MathUtils, Vector3 } from "three";
import { OrbitControls, Text } from "@react-three/drei";
import { formatRgb } from "culori";

import useSocket, { useUsers, useDebug } from "@/stores/socket";

export default function PizzaCircle({ setPizzaPositions, pizzaPositions }) {
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const { studyMode } = useSocket((state) => state.level);
  const users = useUsers();
  const usersLength = users.length;
  const circleMeshRef = React.useRef();
  const { pizzaGeo, pizzaNums, pizzaRadius } = useDebug();

  const circleSegments = studyMode || usersLength < 3 ? 4 : usersLength;
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
      const points = newPositions.slice(1, -1);
      if (studyMode || usersLength === 2) {
        points.splice(1, 1);
      }
      setPizzaPositions(points);
    }
  }, [
    setPizzaPositions,
    circleSegments,
    userIdIndex,
    usersLength,
    pizzaRadius,
    studyMode,
  ]);

  return (
    <>
      {/* rotation-x = thetaState, because circleGeos are vertical to begin with */}
      <mesh
        ref={circleMeshRef}
        // position-z={-pizzaRadius}
        rotation-x={thetaStart}
      >
        {/* args[2] = thetaState, because circleGeos have their first segment at 3 O'Clock, but we want it at 6 */}
        <circleGeometry args={[pizzaRadius, circleSegments, thetaStart]} />
        <meshStandardMaterial
          side={DoubleSide}
          wireframe
          transparent
          visible={pizzaGeo}
        />
      </mesh>
      {pizzaNums &&
        pizzaPositions.map((position, index) => {
          const color = users[index]?.color;
          return (
            <group
              position={position}
              rotation-y={MathUtils.degToRad(
                userIdIndex * -(360 / users.length)
              )}
              key={`${circleSegments}-index-position-for-${index}`}
            >
              <Text
                color={formatRgb(color)}
                material-transparent={true}
                material-opacity={0.6}
                anchorX="center"
                anchorY="middle"
                fontSize={0.25}
              >
                {index}
              </Text>
            </group>
          );
        })}
      <OrbitControls />
    </>
  );
}
