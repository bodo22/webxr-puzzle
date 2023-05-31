import React from "react";
import { useXR } from "@react-three/xr";
import { createPortal, useThree } from "@react-three/fiber";
import RemoteHandsAndControllers from "@/components/canvas/remote/RemoteHandsAndControllers";
import PizzaCircle from "@/components/canvas/PizzaCircle";
import useSocket, { useDebug, useUser } from "@/stores/socket";
import useInteracting from "@/stores/interacting";
import { BoxHelper, Vector3 } from "three";
import LocalHands from "./components/canvas/local/LocalHands";
import { updateGestures } from "./utils/gestures";
import { useHelper, Box, OrbitControls } from "@react-three/drei";
import {
  useBoundingBoxProps,
  useBox,
} from "./components/canvas/hooks/useBoundInteraction";
import { formatRgb } from "culori";
import usePlayerTransform from "./components/canvas/hooks/usePlayerTransform";

// Dom components go here
function keepJoint(joints, jointName) {
  if (!joints) {
    return joints;
  }
  return Object.entries(joints).reduce((acc, [handedness, joints]) => {
    acc[handedness] = joints;
    const joint = joints?.[jointName];
    if (joint) {
      acc[handedness] = {
        [jointName]: joint,
      };
    }
    return acc;
  }, {});
}
export default function index() {
  return (
    <>
      {/* <div id="xr-overlay">
      <h1 className="text-gray-50">DOM Overlay TEST!</h1>
    </div> */}
    </>
  );
}

function useRecordHandData() {
  const controllers = useXR((state) => state.controllers);
  const xr = useThree((state) => state.gl.xr);
  const sendHandData = useSocket((state) => state.sendHandData);
  const fidelity = useSocket((state) => state.fidelity);
  // const recordedHandData = React.useRef([]);

  React.useEffect(() => {
    const handler = ({ data: joints }) => {
      updateGestures();
      const { pinchedObjects, gestures } = useInteracting.getState();
      switch (fidelity?.level) {
        case "blob": {
          joints = keepJoint(joints, fidelity.blobJoint);
          break;
        }
        case "gesture": {
          joints = keepJoint(joints, "wrist");
          break;
        }
        default: {
          break;
        }
      }
      const handData = {
        joints,
        gestures,
        fidelity,
        pinchedObjects,
      };
      // recordedHandData.current.push(handData);
      // console.log(recordedHandData.current);
      sendHandData(handData);
    };
    if (controllers.length === 0) {
      // this removes remote hands instantly
      sendHandData({});
    }
    xr.addEventListener("managedHandsJointData", handler);
    return () => {
      xr.removeEventListener("managedHandsJointData", handler);
    };
  }, [controllers, xr, sendHandData, fidelity]);
}

function useMoveCamera(pizzaPositions) {
  const player = useXR((state) => state.player);
  const isPresenting = useXR((state) => state.isPresenting);
  const { position, "rotation-y": rotationY } = usePlayerTransform({
    pizzaPositions,
  });

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

function BoundingBox({ pizzaPositions }) {
  const boxProps = useBoundingBoxProps(pizzaPositions);
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
  const [pizzaPositions, setPizzaPositions] = React.useState([]);
  useRecordHandData();
  useMoveCamera(pizzaPositions);
  const scene = useThree((state) => state.scene);

  return (
    <>
      {createPortal(
        <>
          <RemoteHandsAndControllers pizzaPositions={pizzaPositions} />
          <LocalHands />
          <PizzaCircle
            setPizzaPositions={setPizzaPositions}
            pizzaPositions={pizzaPositions}
          />
          <BoundingBox pizzaPositions={pizzaPositions} />
          <ambientLight intensity={0.2} />
          <spotLight intensity={0.2} position={[-1, 1, 0]} />
          <directionalLight intensity={0.4} position={[1, 1, 0]} />
        </>,
        scene
      )}
      <OrbitControls />
    </>
  );
}

const IndexCanvas = () => {
  return <ChildrenWrapper />;
};

index.canvas = IndexCanvas;

export async function getStaticProps() {
  return { props: { title: "Puzzle" } };
}
