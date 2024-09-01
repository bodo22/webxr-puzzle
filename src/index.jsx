import React from "react";
import { useXR } from "@react-three/xr";
import { createPortal, extend, useThree } from "@react-three/fiber";
import RemoteHandsAndControllers from "@/components/canvas/remote/RemoteHandsAndControllers";
import PizzaCircle from "@/components/canvas/PizzaCircle";
import useSocket, { useDebug, useUser } from "@/stores/socket";
import { BoxHelper, Quaternion, Vector3 } from "three";
import LocalHands from "./components/canvas/local/LocalHands";
import {
  useHelper,
  Box,
  OrbitControls,
} from "@react-three/drei";
import {
  useBoundingBoxProps,
  useBox,
} from "./components/canvas/hooks/useBoundInteraction";
import { formatRgb } from "culori";
import usePlayerTransform from "./components/canvas/hooks/usePlayerTransform";
// import CannonExperiment from "./components/canvas/CannonExperiment";
import XRPlanes from "@/utils/XRPlanes";
import Furniture from "./components/canvas/Furniture";

extend({ XRPlanes });

export default function index() {
  return (
    <>
      {/* <div id="xr-overlay">
      <h1 className="text-gray-50">DOM Overlay TEST!</h1>
    </div> */}
    </>
  );
}

function useMoveCamera() {
  const player = useXR((state) => state.player);
  const isPresenting = useXR((state) => state.isPresenting);
  const { position, "rotation-y": rotationY } = usePlayerTransform();
  const socket = useSocket((state) => state.socket);
  const xrManager = useThree((state) => state.gl.xr);
  const userIdSelf = useSocket((state) => state.userId);
  React.useEffect(() => {
    // handle reset event with cleanup
    function handleReset(userId) {
      if (userId !== userIdSelf) {
        return;
      }
      const quat = new Quaternion();
      quat
        .setFromAxisAngle(
          new Vector3(0, 1, 0),
          player?.children[0]?.rotation?.y
        )
        .normalize();
      const referenceSpace = xrManager.getReferenceSpace();
      // eslint-disable-next-line no-undef
      const playerRigidTransform = new XRRigidTransform(
        player?.children[0]?.position,
        quat
      );
      const newRefSpace =
        referenceSpace.getOffsetReferenceSpace(playerRigidTransform);
      xrManager.setReferenceSpace(newRefSpace);
    }
    socket.on("recenter", handleReset);
    return () => {
      socket.off("recenter", handleReset);
    };
  }, [player?.children, socket, xrManager, userIdSelf]);

  React.useEffect(() => {
    let pos = new Vector3();
    if (isPresenting) {
      pos = new Vector3(position.x, position.y, position.z);
    }
    player.name = "myplayer";
    player.position.copy(pos);
    player.rotation.y = rotationY;
  }, [player, rotationY, position.x, position.y, position.z, isPresenting]);
}

function BoundingBox() {
  const boxProps = useBoundingBoxProps();
  const ref = React.useRef();
  const { boundBoxes } = useDebug();
  const { color } = useUser();
  const setBoxRef = useBox((state) => state.setBoxRef);

  React.useEffect(() => {
    setBoxRef(ref);
  }, [setBoxRef]);

  useHelper(boundBoxes && ref, BoxHelper, formatRgb(color));

  return <Box {...boxProps} ref={ref} />;
}

function ChildrenWrapper() {
  const playerTransform = usePlayerTransform();
  useMoveCamera();
  const scene = useThree((state) => state.scene);
  const renderer = useThree((state) => state.gl);
  const ref = React.useRef();

  // React.useEffect(() => {
  //   const xrPlanes = ref.current;
  //   function planesChanged() {
  //     console.log("planes changed", xrPlanes);
  //   }
  //   xrPlanes.addEventListener("planeschanged", planesChanged);
  //   return () => {
  //     xrPlanes.removeEventListener("planeschanged", planesChanged);
  //   };
  // }, []);
  return (
    <>
      {createPortal(
        <>
          <group {...playerTransform}>
            {/* <xRPlanes args={[renderer]} ref={ref} /> */}
          </group>
          <RemoteHandsAndControllers />
          <PizzaCircle />
          <BoundingBox />
          {/* <ambientLight intensity={.3} />
          <spotLight intensity={2} position={[-1, 1, 0]} />
          <directionalLight intensity={1} position={[1, 1, 0]} /> */}
          <ambientLight intensity={0.2} />
          <spotLight intensity={0.2} position={[-1, 1, 0]} />
          <directionalLight intensity={0.4} position={[1, 1, 0]} />
          {/* <CannonExperiment /> */}
          {/* <axesHelper /> */}

          <group name="handOrientObj">
            {/* <mesh>
              <sphereBufferGeometry args={[0.01]} />
              <meshBasicMaterial color="yellow" />
              <axesHelper args={[1]} />
            </mesh> */}
          </group>
          <group name="tmpPinchObj">
            {/* <mesh>
              <sphereBufferGeometry args={[0.01]} />
              <meshBasicMaterial color="red" />
              <axesHelper args={[200]} />
            </mesh> */}
          </group>
          <Furniture />
        </>,
        scene
      )}
      {/* <OrbitControls /> */}
      <OrbitControls
        //CameraControls
        target={[0, -0.001, 0]}
        makeDefault
        // onChange={(e) => {
        //   console.log(e.target, e.target.object.position);
        // }}
      />
    </>
  );
}

const IndexCanvas = () => {
  return (
    <>
      <ChildrenWrapper />
      <LocalHands />
    </>
  );
};

index.canvas = IndexCanvas;

export async function getStaticProps() {
  return { props: { title: "Puzzle" } };
}
