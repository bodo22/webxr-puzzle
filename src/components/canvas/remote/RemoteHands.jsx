import React from "react";
import { OculusHandModel } from "three-stdlib";
import { extend, createPortal } from "@react-three/fiber";

import { fakeInputSourceFactory } from "@/utils";
import { useUsers } from "@/stores/socket";

function RemoteHand({ hand, color, modelLeft, modelRight }) {
  const handModelRef = React.useRef();
  const meshRef = React.useRef();
  const { r, g, b } = color;
  React.useLayoutEffect(() => {
    function setColor() {
      if (meshRef.current) {
        meshRef.current.material.metalness = 0.3;
        meshRef.current.material.color.setRGB(r, g, b);
      }
    }
    const handModel = handModelRef.current;
    if (handModel) {
      function childAdded(event) {
        const mesh = event.child.getObjectByProperty("type", "SkinnedMesh");
        meshRef.current = mesh;
        setColor();
      }
      handModel.addEventListener("childadded", childAdded);
      return () => {
        handModel.removeEventListener("childadded", childAdded);
      };
    }
  }, [r, g, b]);

  return createPortal(
    <oculusHandModel ref={handModelRef} args={[hand, modelLeft, modelRight]} />,
    hand
  );
}

export default function RemoteHands({ controllers }) {
  React.useMemo(() => extend({ OculusHandModel }), []);
  const users = useUsers();

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
  }, [controllers]);

  return users.map(({ userId, color }, index) => {
    const targets = controllers[userId];
    if (!targets) {
      return null;
    }
    return targets.map((target) => {
      return (
        <RemoteHand
          userId={userId}
          key={`${userId}-${target.handedness}-hand-${index}`}
          color={color}
          hand={target.hand}
        />
      );
    });
  });
}
