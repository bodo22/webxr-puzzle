import React from "react";
import * as THREE from "three";
import { XRControllerModelFactory } from "three-stdlib";
import { extend, createPortal } from "@react-three/fiber";

import { fakeInputSourceFactory } from "@/utils";

const modelFactory = new XRControllerModelFactory();
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
    for (const userId in controllers) {
      for (const target of controllers[userId]) {
        const fakeInputSource = fakeInputSourceFactory.createFakeInputSource(
          target.handedness
        );
        target.controller.dispatchEvent({
          type: "connected",
          data: fakeInputSource,
          fake: true,
        });
      }
    }
  }, [controllers]);

  return Object.values(controllers).map((targets) =>
    targets.map((target) => {
      return createPortal(<controllerModel args={[target]} />, target.grip);
    })
  );
}
