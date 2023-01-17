import React from "react";
import * as THREE from "three";
import { XRControllerModelFactory } from "three-stdlib";
import { extend, createPortal } from "@react-three/fiber";

import { FakeInputSourceFactory } from "@/utils";

const modelFactory = new XRControllerModelFactory();
const fakeInputSourceFactory = new FakeInputSourceFactory();

class ControllerModel extends THREE.Group {
  constructor(target) {
    super();
    this.add(modelFactory.createControllerModel(target.controller));
  }
}

export default function RemoteControllers({ controllers }) {
  React.useMemo(() => extend({ ControllerModel }), []);

  // Send fake connected event (no-op) so models start loading
  React.useLayoutEffect(() => {
    for (const target of controllers) {
      const fakeInputSource = fakeInputSourceFactory.createFakeInputSource(
        target.index ? "right" : "left"
      );
      target.controller.dispatchEvent({
        type: "connected",
        data: fakeInputSource,
        fake: true,
      });
    }
  }, [controllers]);

  return (
    <>
      {controllers.map((target, i) => (
        <React.Fragment key={i}>
          {createPortal(<controllerModel args={[target]} />, target.grip)}
        </React.Fragment>
      ))}
    </>
  );
}
