import React from "react";

import useSocket from "@/stores/socket";

import RemoteControllers from "./RemoteControllers";
import RemoteHands from "./RemoteHands";

export default function RemoteHandsAndControllers() {
  const controllers = useSocket((state) => state.controllers);

  return (
    <>
      {Object.entries(controllers).map(([userId, [left, right]]) => (
        <React.Fragment key={userId}>
          <primitive object={left} />
          <primitive object={right} />
        </React.Fragment>
      ))}
      <RemoteControllers controllers={controllers} />
      <RemoteHands controllers={controllers} />
    </>
  );
}
