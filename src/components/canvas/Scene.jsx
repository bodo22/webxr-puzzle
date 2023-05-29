import React from "react";
import { Canvas } from "@react-three/fiber";
import {
  PerspectiveCamera,
  Preload,
  Plane,
  Sky,
  Stage,
} from "@react-three/drei";
import { XR, Controllers, VRButton } from "@react-three/xr";
import { Selection } from "@react-three/postprocessing";
import { useDebug } from "@/stores/socket";

// import CustomVRButton from "@/components/dom/VRButton";
import Debug from "./debug";
import { DoubleSide } from "three";
// import Effects from "./Effects";

export default function Scene({ children, ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped
  const { pizzaRadius } = useDebug();
  return (
    <>
      <VRButton />
      <Canvas {...props} /* shadows */ onCreated={({ gl, xr, ...rest }) => {}}>
        <Selection>
          <Stage
            adjustCamera={false}
            intensity={0.3}
            // shadows="contact"
            shadows="accumulative"
            // environment="city"
            environment={false}
          >
            <XR
              // foveation={1}
              referenceSpace="local"
              // referenceSpace="viewer"
              // referenceSpace="unbounded"
              sessionInit={{
                optionalFeatures: [
                  "local-floor",
                  "bounded-floor",
                  "hand-tracking" /* , 'layers' */,
                ],
              }}
            >
              {/* camera position in XR mode is managed by moving the xr player, this is just for inline mode, see index.jsx */}
              <PerspectiveCamera makeDefault position={[0, 1, pizzaRadius]} />
              <Controllers />
              {children}
              <Preload all />
              <Debug />
              <Sky sunPosition={[10, 10, -1000]} distance={10} />
              <Plane args={[100, 100]}>
                <meshBasicMaterial
                  color="black"
                  transparent
                  opacity={0.3}
                  side={DoubleSide}
                />
              </Plane>
              {/* <Effects /> */}
            </XR>
          </Stage>
        </Selection>
      </Canvas>
    </>
  );
}
