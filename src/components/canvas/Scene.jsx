import React from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Preload, Sky, Stage } from "@react-three/drei";
import { XR, Controllers, VRButton } from "@react-three/xr";
import { Selection } from "@react-three/postprocessing";

// import CustomVRButton from "@/components/dom/VRButton";
import Debug from "./debug";
import Effects from "./Effects";

export default function Scene({ children, ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped
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
              {/* camera position is managed by moving the xr player, see index.jsx */}
              <PerspectiveCamera makeDefault />
              <Controllers />
              {children}
              <Preload all />
              <Debug />
              <Sky sunPosition={[10, 10, -1000]} distance={10} />
              <Effects />
            </XR>
          </Stage>
        </Selection>
      </Canvas>
    </>
  );
}
