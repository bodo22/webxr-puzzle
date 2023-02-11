import React from "react";
import { Canvas } from "@react-three/fiber";
import {
  PerspectiveCamera,
  OrbitControls,
  Preload,
  Stats,
  GizmoHelper,
  GizmoViewport,
  Grid,
} from "@react-three/drei";
import { XR, Controllers, Hands } from "@react-three/xr";
import CustomVRButton from "@/components/dom/VRButton";

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
        <OrbitControls target={[0, 0, -1]} />
      </XR>
      <Stats showPanel={0} className="stats" {...props} />
      {/* helpers: */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={["red", "green", "blue"]}
          labelColor="black"
        />
      </GizmoHelper>
      <Grid
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={"yellow"}
        sectionSize={1}
        sectionThickness={1}
        sectionColor={"#2080ff"}
        followCamera={true}
        infiniteGrid={true}
        fadeDistance={100}
        fadeStrength={1}
      />
      <mesh {...props}>
        <sphereGeometry args={[0.03, 64, 64]} />
        <meshStandardMaterial color={"hotpink"} />
      </mesh>
    </Canvas>
  );
}
