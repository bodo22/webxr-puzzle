import React from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrthographicCamera,
  PerspectiveCamera,
  Preload,
  Sky,
  Stage,
} from "@react-three/drei";
import { XR, Controllers, VRButton } from "@react-three/xr";
import { Selection } from "@react-three/postprocessing";
import useSocket, { useDebug } from "@/stores/socket";
import { DoubleSide, MathUtils, Vector3 } from "three";

import CustomVRButton from "@/components/dom/VRButton";
import Debug from "./debug";
// import Effects from "./Effects";
import DivisionPlane from "./DivisionPlane";
export default function Scene({ children, ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped
  const { pizzaRadius } = useDebug();
  const userId = useSocket((state) => state.userId);
  const cam = React.useRef();
  React.useEffect(() => {
    // cam?.current?.lookAt(0, 0, -pizzaRadius);
  }, [pizzaRadius]);

  return (
    <>
      <VRButton />
      <Canvas
        {...props}
        // dpr={userId === "spectator" ? 0.25 : 1}
        /* shadows */ onCreated={({ gl, xr, ...rest }) => {
          if (window.location.pathname === "/") {
            document.body.appendChild(CustomVRButton.createButton(gl));
          }
        }}
      >
        <Selection>
          {/* <Stage
            preset={{ main: [0, 50, 25], fill: [0, 50, 20] }}
            // preset="soft"
            // | 'rembrandt' // default
            // | 'portrait'
            // | 'upfront'
            // | 'soft'
            adjustCamera={false}
            intensity={0.3}
            // shadows="contact"
            // shadows="accumulative"
            // environment="city"
            environment={false}
            shadows={false}
            center={false}
          > */}
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
            <PerspectiveCamera
              makeDefault
              position={[0, 0.0, -pizzaRadius * 1.7]}
              ref={cam}
            />
            {/* <OrthographicCamera makeDefault position={[0, .8, 0]} ref={cam}
              zoom={1}
              top={.5}
              bottom={-.5}
              left={-.5}
              right={.5}
              near={.01}
              far={10}
      
            /> */}
            <Controllers />
            {children}
            <Preload all />
            {/* <Sky sunPosition={[10, 10, -1000]} distance={10} /> */}
            {/* <DivisionPlane /> */}
            {/* <Effects /> */}
            <Debug name="debug" />
          </XR>
          {/* </Stage> */}
        </Selection>
      </Canvas>
    </>
  );
}
