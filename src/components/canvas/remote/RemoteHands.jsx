import React from "react";
import { OculusHandModel } from "three-stdlib";
import { extend, createPortal } from "@react-three/fiber";

import { fakeInputSourceFactory } from "@/utils";
import useSocket, { useUsers, useDebug } from "@/stores/socket";
import useInteracting from "@/stores/interacting";

import Axes from "@/components/canvas/debug/Axes";

function RemoteHand({ hand, color, handedness, index, userId }) {
  const handModelRef = React.useRef();
  const handMeshModelRef = React.useRef();
  const { hands } = useDebug();
  const socket = useSocket((state) => state.socket);
  const { r, g, b } = color;

  const setColor = React.useCallback(
    (color) => {
      if (!handMeshModelRef.current) {
        return;
      }
      handMeshModelRef.current.material.metalness = 0.3;
      if (!color) {
        handMeshModelRef.current.material.color.setRGB(r, g, b);
      } else {
        handMeshModelRef.current.material.color.set(color);
      }
    },
    [r, g, b]
  );

  React.useLayoutEffect(() => {
    const handModel = handModelRef.current;
    if (handModel) {
      function childAdded(event) {
        const mesh = event.child.getObjectByProperty("type", "SkinnedMesh");
        handMeshModelRef.current = mesh;
        setColor();
      }
      handModel.addEventListener("childadded", childAdded);
      setColor();
      return () => {
        handModel.removeEventListener("childadded", childAdded);
      };
    }
  }, [setColor]);

  React.useEffect(() => {
    socket.on("handData", (data) => {
      if (data.userId !== userId) {
        return;
      }
      switch (data.gestures[handedness]) {
        case "pinch":
          setColor("green");
          break;
        case "fist":
          setColor("red");
          break;
        case "point":
          setColor("pink");
          break;
        default:
          setColor();
          break;
      }
    });
  }, [socket, handedness, setColor, userId]);

  // only needed for devving:
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const users = useUsers();
  const noXRUsers = users.every(
    ({ isSessionSupported }) => !isSessionSupported
  );
  const setHand = useInteracting((state) => state.setHand);
  // const noXRUserAndFirst = userIdIndex === 0 && index === 0 && noXRUsers;
  const noXRUserAndFirst = userIdIndex === index;
  React.useEffect(() => {
    // TODO: remove this if statement away & make it work agnostically for remote hands & own hands
    if (noXRUserAndFirst) {
      setHand(handedness, hand);
    }
    return () => {
      if (noXRUserAndFirst) {
        setHand(handedness, undefined);
      }
    };
  }, [setHand, hand, handedness, noXRUserAndFirst]);

  return (
    <>
      {createPortal(<oculusHandModel ref={handModelRef} args={[hand]} />, hand)}
      {hands && <Axes model={handModelRef.current?.motionController} />}
    </>
  );
}

export default function RemoteHands() {
  React.useMemo(() => extend({ OculusHandModel }), []);
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
          <RemoteHand
            index={index}
            userId={userId}
            key={`${userId}-${target.handedness}-hand`}
            color={color}
            hand={target.hand}
            handedness={target.handedness}
          />
        );
      });
    })
    .flat();
  // when changing seat positions via admin interface with this flat()
  // the hands are disposed for some reason. maybe a r3f bug
  // TODO: investigate further (but just for fun)
}
