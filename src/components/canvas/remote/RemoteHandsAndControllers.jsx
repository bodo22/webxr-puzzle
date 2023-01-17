import React from "react";
import { useThree } from "@react-three/fiber";

import { FakeInputSourceFactory } from "@/utils";
import useSocket from "@/stores/socket";

import RemoteXRController from "./RemoteXRController";
import RemoteControllers from "./RemoteControllers";
import RemoteHands from "./RemoteHands";

const fakeInputSourceFactory = new FakeInputSourceFactory();

export default function RemoteHandsAndControllers() {
  const gl = useThree((state) => state.gl);
  const controllers = useSocket((state) => state.controllers);
  const setController = useSocket((state) => state.setController);

  React.useLayoutEffect(() => {
    [0, 1].forEach((id) => {
      const target = new RemoteXRController(id, gl);
      const fakeInputSource = fakeInputSourceFactory.createFakeInputSource(
        target.index ? "right" : "left"
      );
      target.webXRController.connect(fakeInputSource);
      setController(target);
    });
  }, [gl, setController]);

  return (
    <>
      {controllers.map((controller) => (
        <primitive key={controller.index} object={controller} />
      ))}
      <RemoteControllers controllers={controllers} />
      <RemoteHands controllers={controllers} />
    </>
  );
}
