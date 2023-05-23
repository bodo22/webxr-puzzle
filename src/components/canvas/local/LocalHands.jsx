import React from "react";
import { useXR } from "@react-three/xr";

import useSocket, { useUser } from "@/stores/socket";
import Hand from "../Hand";

export default function LocalHands() {
  const userId = useSocket((state) => state.userId);
  const { color } = useUser();
  const controllers = useXR((state) => state.controllers);

  React.useLayoutEffect(() => {
    for (const target of controllers) {
      target.hand.dispatchEvent({
        type: "connected",
        data: target.inputSource,
        fake: true,
      });
    }
  }, [controllers]);

  return controllers.map((target) => {
    return (
      <Hand
        localHand={true}
        userId={userId}
        key={`${userId}-${target.index}-hand`}
        color={color}
        target={target}
        handedness={target.inputSource.handedness}
      />
    );
  });
}
