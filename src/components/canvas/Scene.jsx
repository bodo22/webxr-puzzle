import React from "react";
import { Color } from "three";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Preload } from "@react-three/drei";
import { XR, Controllers, Hands, VRButton } from "@react-three/xr";
// import CustomVRButton from "@/components/dom/VRButton";
import Debug from "./debug";

export default function Scene({ children, ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <>
      <VRButton />
      <Canvas
        {...props}
        onCreated={({ gl, xr, ...rest }) => {
          if (window.location.pathname === "/") {
            // document.body.appendChild(CustomVRButton.createButton(gl));
            rest.scene.background = new Color(0x555555);

            // if (gl?.xr?.setAnimationLoop) {
            //   console.log('setting setAnimationLoop')
            //   gl.xr.setAnimationLoop((time, frame) => {
            //     console.log(time, frame)
            //   })
            // }
            // https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/core/index.tsx#L250
          }
        }}
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
          <directionalLight intensity={0.3} />
          <ambientLight intensity={0.4} />
          {children}
          <Preload all />
          <Debug />
        </XR>
      </Canvas>
    </>
  );
}
