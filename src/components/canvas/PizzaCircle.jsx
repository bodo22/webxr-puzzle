import React from "react";
import { DoubleSide, MathUtils, Vector3 } from "three";
import { Text } from "@react-three/drei";
import { formatRgb } from "culori";

import useSocket, { useUsers, useDebug } from "@/stores/socket";

export default function PizzaCircle() {
  const pizzaPositions = useSocket((state) => state.pizzaPositions);
  const set = useSocket((state) => state.set);
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const studyMode = useSocket((state) => state.level.studyMode);
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
      set({ pizzaPositions: points });
    }
  }, [set, circleSegments, userIdIndex, usersLength, pizzaRadius, studyMode]);

  return (
    <>
      {/* rotation-x = thetaState, because circleGeos are vertical to begin with */}
      <mesh
        ref={circleMeshRef}
        // position-z={-pizzaRadius}
        rotation-x={thetaStart}
        name="pizzaCircle"
      >
        {/* args[2] = thetaState, because circleGeos have their first segment at 3 O'Clock, but we want it at 6 */}
        <circleGeometry args={[pizzaRadius, circleSegments, thetaStart]} />
        <meshStandardMaterial
          side={DoubleSide}
          wireframe
          colorWrite={pizzaGeo}
          depthWrite={pizzaGeo}
          depthTest={pizzaGeo}
          color="red"
        />
      </mesh>
      {pizzaPositions.map((position, index) => {
        const color = users[index]?.color;
        const key = `${circleSegments}-index-position-for-${index}`;
        return (
          <React.Fragment key={key}>
            <group
              position={position}
              rotation-y={MathUtils.degToRad(
                userIdIndex * -(360 / users.length)
              )}
              name={key}
            >
              {pizzaNums && (
                <Text
                  color={formatRgb(color)}
                  material-transparent={true}
                  material-opacity={0.6}
                  anchorX="center"
                  anchorY="middle"
                  fontSize={0.2}
                >
                  {index}
                </Text>
              )}
            </group>
          </React.Fragment>
        );
      })}
    </>
  );
}
