import React from "react";
import { fakeInputSourceFactory } from "@/utils";
import useSocket, { useUsers } from "@/stores/socket";
import Hand from "../Hand";
export default function RemoteHands() {
  const users = useUsers();
  const controllers = useSocket((state) => state.controllers);

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

  return users
    .map(({ userId, color }, index) => {
      const targets = controllers[userId];
      if (!targets) {
        return null;
      }
      return targets.map((target) => {
        return (
          <Hand
            index={index}
            userId={userId}
            key={`${userId}-${target.handedness}-hand`}
            color={color}
            target={target}
            handedness={target.handedness}
            // local
          />
        );
      });
    })
    .flat();
  // when changing seat positions via admin interface with this flat()
  // the hands are disposed for some reason. maybe a r3f bug
  // TODO: investigate further (but just for fun)
}
