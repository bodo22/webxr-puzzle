import React from "react";

import useSocket from "@/stores/socket";

import RemoteControllers from "./RemoteControllers";
import RemoteHands from "./RemoteHands";

export default function RemoteHandsAndControllers() {
  const controllers = useSocket((state) => state.controllers);

  return (
    <>
      {Object.entries(controllers).map(([userId, targets]) =>
        targets.map((target) => {
          return (
            <primitive key={`${userId}-${target.handedness}`} object={target} />
          );
        })
      )}
      <RemoteControllers controllers={controllers} />
      <RemoteHands controllers={controllers} />
    </>
  );
}
