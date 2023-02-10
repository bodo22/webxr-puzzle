import React from "react";
import { MathUtils } from "three";
import { Vector3, DoubleSide } from "three";
import useSocket from "@/stores/socket";

export default function PizzaCircle({ setPizzaPositions }) {
  const radius = 1;
  const thetaStart = MathUtils.degToRad(90);
  const circleSegments = useSocket((state) => state.users.length);
  const circleMeshRef = React.useRef();

  React.useLayoutEffect(() => {
    if (circleMeshRef.current) {
      let gp = circleMeshRef.current.geometry.attributes.position;
      const positions = new Array(gp.count).fill().map((_, index) => {
        let p = new Vector3().fromBufferAttribute(gp, index);
        circleMeshRef.current.localToWorld(p);
        return p;
      });
      // first & last are "starting" points, in center of circle
      setPizzaPositions(positions);
    }
  }, [setPizzaPositions, circleSegments]);

  return (
    <mesh ref={circleMeshRef} position-z={-radius} rotation-x={thetaStart}>
      <circleGeometry args={[radius, circleSegments, thetaStart]} />
      <meshStandardMaterial
        side={DoubleSide}
        wireframe
        transparent
        opacity={1}
      />
    </mesh>
  );
}
