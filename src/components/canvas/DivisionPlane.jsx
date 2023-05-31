import { createPortal, useFrame, useThree } from "@react-three/fiber";
import React from "react";
import { Circle, Plane } from "@react-three/drei";

import { DoubleSide, MathUtils } from "three";

export default function DivisionPlane() {
  const scene = useThree((state) => state.scene);
  // const circleWrapperRef = React.useRef();

  // useFrame(({ clock }) => {
  //   if (circleWrapperRef.current) {
  //     const newScale = Math.sin(clock.elapsedTime);
  //     circleWrapperRef.current.children.forEach((child, index) => {
  //       child.scale.set(newScale, newScale, newScale);
  //     });
  //   }
  // });

  // const size = 0.1;
  // const offset = 0.2;
  // const sideLength = 10;

  return createPortal(
    <>
      <Plane args={[100, 100]}>
        <meshBasicMaterial
          color="black"
          transparent
          opacity={0.3}
          side={DoubleSide}
        />
      </Plane>
      {/* <group
        ref={circleWrapperRef}
        position={[
          -offset * ((sideLength - 1) / 2),
          -offset * ((sideLength - 1) / 2),
          0,
        ]}
      >
        {[...Array(sideLength).keys()]
          .map((i) => {
            return [...Array(sideLength).keys()].map((j) => {
              const key = `bounding-circle-for-${i}-${j}`;
              return (
                <Circle
                  key={key}
                  position={[i * offset, j * offset, 0]}
                  args={[size, 4]}
                  material-color="blue"
                  material-wireframe={true}
                  side={DoubleSide}
                />
              );
            });
          })
          .flat()}
      </group> */}
    </>,
    scene
  );
}
