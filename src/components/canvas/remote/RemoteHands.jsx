import React from "react";
import { OculusHandModel } from "three-stdlib";
import { extend, createPortal } from "@react-three/fiber";

import { fakeInputSourceFactory } from "@/utils";

export default function RemoteHands({ controllers, modelLeft, modelRight }) {
  React.useMemo(() => extend({ OculusHandModel }), []);

  // Send fake connected event (no-op) so models start loading
  React.useLayoutEffect(() => {
    for (const userId in controllers) {
      for (const target of controllers[userId]) {
        const fakeInputSource = fakeInputSourceFactory.createFakeInputSource(
          target.handedness
        );
        target.hand.dispatchEvent({
          type: "connected",
          data: fakeInputSource,
          fake: true,
        });
      }
    }
  }, [controllers, modelLeft, modelRight]);

  const oculusHandModelRef = React.useCallback((handModel) => {
    if (handModel && !handModel?._listeners?.childadded?.length) {
      function childAdded(event) {
        const mesh = event?.child?.getObjectByProperty("type", "SkinnedMesh");
        const color = event?.target?.parent?.parent?.data?.color;
        if (mesh && color) {
          mesh.material.color.setRGB(color.r, color.g, color.b);
        }
      }
      handModel.addEventListener("childadded", childAdded);
    }
  }, []);

  return Object.values(controllers).map((targets) =>
    targets.map((target) => {
      return createPortal(
        <oculusHandModel
          ref={oculusHandModelRef}
          args={[target.hand, modelLeft, modelRight]}
        />,
        target.hand
      );
    })
  );
}
