import React from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Preload } from "@react-three/drei";
import { XR, Controllers, Hands } from "@react-three/xr";
import CustomVRButton from "@/components/dom/VRButton";
import Debug from "./debug";

export default function Scene({ children, ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <Canvas
      {...props}
      onCreated={({ gl, xr, ...rest }) => {
        if (window.location.pathname === "/") {
          document.body.appendChild(CustomVRButton.createButton(gl));
          // if (gl?.xr?.setAnimationLoop) {
          //   console.log('setting setAnimationLoop')
          //   gl.xr.setAnimationLoop((time, frame) => {
          //     console.log(time, frame)
          //   })
          // }
          // https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/core/index.tsx#L231
        }
      }}
    >
      <XR
        // foveation={1}
        referenceSpace="local"
        // referenceSpace="viewer"
        // referenceSpace="unbounded"
      >
        <PerspectiveCamera makeDefault position-z={1} />
        <Controllers />
        <Hands />
        <directionalLight intensity={0.3} />
        <ambientLight intensity={0.4} />
        {children}
        <Preload all />
      </XR>
      <Debug />
    </Canvas>
  );
}
