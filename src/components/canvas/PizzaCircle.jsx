import React from "react";
import { Vector3, DoubleSide } from "three";

export default function PizzaCircle({ setPizzaPositions }) {
  const radius = 1;
  const segments = 11;
  const thetaStart = 90 * (Math.PI / 180);

  const measureCircle = React.useCallback(
    (circle) => {
      if (circle) {
        let gp = circle.geometry.attributes.position;
        const positions = new Array(gp.count).fill().map((_, index) => {
          let p = new Vector3().fromBufferAttribute(gp, index);
          circle.localToWorld(p);
          return p;
        });
        // first & last are "starting" points, in center of circle
        setPizzaPositions(positions);
      }
    },
    [setPizzaPositions]
  );

  return (
    <mesh
      ref={measureCircle}
      position-z={-radius}
      rotation-x={90 * (Math.PI / 180)}
    >
      <circleGeometry args={[radius, segments, thetaStart]} />
      <meshStandardMaterial
        side={DoubleSide}
        wireframe
        transparent
        opacity={1}
      />
    </mesh>
  );
}
