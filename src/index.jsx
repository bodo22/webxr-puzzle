import React from "react";
import { useXR } from "@react-three/xr";
import Logo from "@/components/canvas/Logo";
import { useThree } from "@react-three/fiber";
import RemoteHandsAndControllers from "@/components/canvas/remote/RemoteHandsAndControllers";
import PizzaCircle from "@/components/canvas/PizzaCircle";
import useSocket from "@/stores/socket";
import Crate from "@/components/canvas/Crate";

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

  React.useEffect(() => {
    const handler = ({ data }) => {
      sendHandData(data);
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

const IndexCanvas = (props) => {
  const [pizzaPositions, setPizzaPositions] = React.useState([]);

  return (
    <>
      <RecordHandData />
      <RemoteHandsAndControllers pizzaPositions={pizzaPositions} />
      <PizzaCircle
        setPizzaPositions={setPizzaPositions}
        pizzaPositions={pizzaPositions}
      />
      <Logo scale={0.5} position-z={-5} />
      <Crate name="my-fun-test-crate" scale={0.2} position={[-0.15, -0.2, -0.3]} />
    </>
  );
};

index.canvas = IndexCanvas;

export async function getStaticProps() {
  return { props: { title: "Puzzle" } };
}
