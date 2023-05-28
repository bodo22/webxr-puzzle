import React from "react";
import { useXR } from "@react-three/xr";
import { useThree } from "@react-three/fiber";
import RemoteHandsAndControllers from "@/components/canvas/remote/RemoteHandsAndControllers";
import PizzaCircle from "@/components/canvas/PizzaCircle";
import useSocket, { useDebug, useUser } from "@/stores/socket";
import useInteracting from "@/stores/interacting";
import { BoxHelper, Vector3 } from "three";
import LocalHands from "./components/canvas/local/LocalHands";
import { updateGestures } from "./utils/gestures";
import { useHelper, Box } from "@react-three/drei";
import {
  useBoundingBoxProps,
  useBox,
} from "./components/canvas/hooks/useBoundInteraction";
import { formatRgb } from "culori";
import usePlayerTransform from "./components/canvas/hooks/usePlayerTransform";

// Dom components go here
export default function index() {
  return (
    <>
      {/* <div id="xr-overlay">
      <h1 className="text-gray-50">DOM Overlay TEST!</h1>
    </div> */}
    </>
  );
}

const RecordHandData = () => {
  const controllers = useXR((state) => state.controllers);
  const xr = useThree((state) => state.gl.xr);
  const sendHandData = useSocket((state) => state.sendHandData);
  // const recordedHandData = React.useRef([]);

  React.useEffect(() => {
    const handler = ({ data }) => {
      updateGestures();
      const { pinchedObjects, gestures } = useInteracting.getState();
      const handData = {
        joints: data,
        gestures,
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
  }, [controllers, xr, sendHandData]);
};

function MoveCamera({ pizzaPositions }) {
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

const IndexCanvas = () => {
  const [pizzaPositions, setPizzaPositions] = React.useState([]);

  return (
    <>
      <RecordHandData />
      <MoveCamera pizzaPositions={pizzaPositions} />
      <RemoteHandsAndControllers pizzaPositions={pizzaPositions} />
      <LocalHands />
      <PizzaCircle
        setPizzaPositions={setPizzaPositions}
        pizzaPositions={pizzaPositions}
      />
      <BoundingBox pizzaPositions={pizzaPositions} />
    </>
  );
};

index.canvas = IndexCanvas;

export async function getStaticProps() {
  return { props: { title: "Puzzle" } };
}
