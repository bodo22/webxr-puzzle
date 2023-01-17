import React from "react";
import { OculusHandModel } from "three-stdlib";
import { extend, createPortal } from "@react-three/fiber";

import { FakeInputSourceFactory } from "@/utils";

const fakeInputSourceFactory = new FakeInputSourceFactory();

export default function RemoteHands({ controllers, modelLeft, modelRight }) {
  React.useMemo(() => extend({ OculusHandModel }), []);

  // Send fake connected event (no-op) so models start loading
  React.useLayoutEffect(() => {
    for (const target of controllers) {
      const fakeInputSource = fakeInputSourceFactory.createFakeInputSource(
        target.index ? "right" : "left"
      );
      target.hand.dispatchEvent({
        type: "connected",
        data: fakeInputSource,
        fake: true,
      });
    }
  }, [controllers, modelLeft, modelRight]);

  return (
    <>
      {controllers.map(({ hand }) =>
        createPortal(
          <oculusHandModel args={[hand, modelLeft, modelRight]} />,
          hand
        )
      )}
    </>
  );
}
