import React from "react";
import { fakeInputSourceFactory } from "@/utils";
import useSocket, { useUsers } from "@/stores/socket";
import Hand from "../Hand";
import { useFrame } from "@react-three/fiber";

function HandPair({ targets, index, userId, color, visible = true }) {
  useFrame(() => {
    targets.forEach((t) => {
      t.hand.visible = visible;
    });
  });

  return (
    <group>
      {targets.map((target) => {
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
      })}
    </group>
  );
}

export default function RemoteHands(props) {
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
      return (
        <HandPair
          {...props}
          targets={targets}
          userId={userId}
          color={color}
          index={index}
          key={`${userId}-hand-pair`}
        />
      );
    })
    .flat();
  // when changing seat positions via admin interface with this flat()
  // the hands are disposed for some reason. maybe a r3f bug
  // TODO: investigate further (not mission critical, for fun)
}
