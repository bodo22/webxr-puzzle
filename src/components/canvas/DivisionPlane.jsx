import React from "react";
import { DoubleSide, MathUtils, Vector3 } from "three";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Circle, Plane } from "@react-three/drei";

import useInteracting from "@/stores/interacting";
import useSocket from "@/stores/socket";

export default function DivisionPlane() {
  const scene = useThree((state) => state.scene);
  const circleWrapperRef = React.useRef();
  const hands = useInteracting((state) => state.hands);
  const userIdSelf = useSocket((state) => state.userId);

  console.log(hands);

  const bounds = {
    AR: -0.15,
    VR: 0.15,
    VR2: -0.15,
    VR1: 0.15,
  };

  useFrame(({ clock }) => {
    const nearestZDistance = Object.values(hands).reduce((acc, hand) => {
      const motionController = hand?.children?.find(
        (child) => child.constructor.name === "OculusHandModel"
      )?.motionController;
      if (!motionController?.bones?.length) {
        return acc;
      }
      const indexFingerTip = motionController.bones.find(
        (bone) => bone.jointName === "index-finger-tip"
      );
      const indexFingerTipZ = indexFingerTip.getWorldPosition(new Vector3()).z;
      if (indexFingerTipZ) {
        const dToBound =
          Math.abs(indexFingerTipZ) - Math.abs(bounds[userIdSelf]);
        return Math.min(dToBound, acc);
      }
      return acc;
    }, 10);
    if (circleWrapperRef.current) {
      // const newScale = Math.sin(clock.elapsedTime);
      const newScale = Math.max(Math.abs(nearestZDistance * 3), 0);
      circleWrapperRef.current.children.forEach((child, index) => {
        child.scale.set(newScale, newScale, newScale);
      });
    }
  });

  const size = 0.1;
  const offset = 0.2;
  const sideLength = 10;

  return createPortal(
    <>
      {/* <Plane args={[100, 100]}>
        <meshBasicMaterial
          color="black"
          transparent
          opacity={0.3}
          side={DoubleSide}
        />
      </Plane> */}
      <group
        ref={circleWrapperRef}
        position={[
          -offset * ((sideLength - 1) / 2),
          -offset * ((sideLength - 1) / 2),
          //0,
          bounds[userIdSelf],
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
      </group>
    </>,
    scene
  );
}
