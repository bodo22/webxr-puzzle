import React from "react";
import { useXR } from "@react-three/xr";
import Logo from "@/components/canvas/Logo";
import { useThree } from "@react-three/fiber";
import RemoteControllers from "@/components/canvas/remote/RemoteHandsAndControllers";
import useSocket from "@/stores/socket";

// Dom components go here
export default function Page() {}

const RecordHandData = () => {
  const controllers = useXR((state) => state.controllers);
  const xr = useThree((state) => state.gl.xr);
  const sendHandData = useSocket(({ sendHandData }) => sendHandData);

  React.useEffect(() => {
    const handler = ({ data }) => {
      sendHandData(data);
    };
    xr.addEventListener("managedHandsJointData", handler);
    return () => {
      xr.removeEventListener("managedHandsJointData", handler);
    };
  }, [controllers, xr, sendHandData]);
};

Page.canvas = (props) => {
  return (
    <>
      <RemoteControllers />
      <RecordHandData />
      <Logo scale={0.5} route="/blob" position-z={-5} />
    </>
  );
};

export async function getStaticProps() {
  return { props: { title: "Puzzle" } };
}
