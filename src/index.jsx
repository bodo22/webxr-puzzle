import React from "react";
import { useXR } from "@react-three/xr";
import Logo from "@/components/canvas/Logo";
import { useThree } from "@react-three/fiber";
import RemoteControllers from "@/components/canvas/remote/RemoteHandsAndControllers";
import useSocket from "@/stores/socket";

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
  const sendHandData = useSocket(({ sendHandData }) => sendHandData);

  React.useEffect(() => {
    const handler = ({ data }) => {
      sendHandData(data);
    };
    if (controllers.length === 0) {
      // this removes remote hands instantly, instead of relying on the interval
      sendHandData({});
    }
    xr.addEventListener("managedHandsJointData", handler);
    return () => {
      xr.removeEventListener("managedHandsJointData", handler);
    };
  }, [controllers, xr, sendHandData]);
};

index.canvas = (props) => {
  return (
    <>
      <RemoteControllers />
      <RecordHandData />
      <Logo scale={0.5} position-z={-5} />
    </>
  );
};

export async function getStaticProps() {
  return { props: { title: "Puzzle" } };
}
