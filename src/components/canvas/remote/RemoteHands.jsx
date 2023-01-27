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

  return (
    <>
      {Object.entries(controllers).map(([userId, [left, right]]) => (
        <React.Fragment key={`${userId}-hands`}>
          {createPortal(
            <oculusHandModel args={[left.hand, modelLeft, modelRight]} />,
            left.hand
          )}
          {createPortal(
            <oculusHandModel args={[right.hand, modelLeft, modelRight]} />,
            right.hand
          )}
        </React.Fragment>
      ))}
    </>
  );
}
