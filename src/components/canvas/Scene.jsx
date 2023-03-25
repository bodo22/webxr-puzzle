import React from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Preload, Sky, Stage } from "@react-three/drei";
import { XR, Controllers, Hands, VRButton } from "@react-three/xr";
import {
  Selection,
  EffectComposer,
  Outline,
} from "@react-three/postprocessing";

// import CustomVRButton from "@/components/dom/VRButton";
import Debug from "./debug";

export default function Scene({ children, ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <>
      <VRButton />
      <Canvas {...props} shadows onCreated={({ gl, xr, ...rest }) => {}}>
        <Selection>
          <Stage
            adjustCamera={false}
            intensity={0.3}
            // shadows="contact"
            shadows="accumulative"
            environment="city"
          >
            <XR
              // foveation={1}
              referenceSpace="local"
              // referenceSpace="viewer"
              // referenceSpace="unbounded"
            >
              {/* camera position is managed by moving the xr player, see index.jsx */}
              <PerspectiveCamera makeDefault />
              <Controllers />
              <Hands />
              {children}
              <Preload all />
              <Debug />
              <Sky sunPosition={[1000, 10, 100]} distance={10} />
              <EffectComposer multisampling={8} autoClear={false}>
                <Outline
                  blur
                  visibleEdgeColor="white"
                  hiddenEdgeColor="yellow"
                  edgeStrength={5}
                  width={500}
                />
              </EffectComposer>
            </XR>
          </Stage>
        </Selection>
      </Canvas>
    </>
  );
}
