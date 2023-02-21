import React from "react";
import { OculusHandModel } from "three-stdlib";
import { extend, createPortal } from "@react-three/fiber";

import { fakeInputSourceFactory } from "@/utils";
import useSocket, { useUsers } from "@/stores/socket";
// import useInteracting from "@/stores/interacting";

// import Axes from "@/components/canvas/debug/Axes";

function RemoteHand({ hand, color, modelLeft, modelRight, index, handedness }) {
  const handModelRef = React.useRef();
  const handMeshModelRef = React.useRef();
  // const setHand = useInteracting((store) => store.setHand);
  const { r, g, b } = color;

  React.useLayoutEffect(() => {
    function setColor() {
      if (handMeshModelRef.current) {
        handMeshModelRef.current.material.metalness = 0.3;
        handMeshModelRef.current.material.color.setRGB(r, g, b);
      }
    }
    const handModel = handModelRef.current;
    if (handModel) {
      function childAdded(event) {
        const mesh = event.child.getObjectByProperty("type", "SkinnedMesh");
        handMeshModelRef.current = mesh;
        setColor();
      }
      handModel.addEventListener("childadded", childAdded);
      return () => {
        handModel.removeEventListener("childadded", childAdded);
      };
    }
  }, [r, g, b]);

  // React.useEffect(() => {
  //   // TODO: remove this if statement away & make it work agnostically for remote hands & own hands
  //   if (index === 0) {
  //     setHand(handedness, hand);
  //   }
  //   return () => {
  //     if (index === 0) {
  //       setHand(handedness, undefined);
  //     }
  //   };
  // }, [setHand, hand, index, handedness]);

  return (
    <>
      {createPortal(
        <oculusHandModel
          ref={handModelRef}
          args={[hand, modelLeft, modelRight]}
        />,
        hand
      )}
      {/* <Axes model={handModelRef.current?.motionController} /> */}
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
            key={`${userId}-${target.handedness}-hand`}
            color={color}
            hand={target.hand}
            handedness={target.handedness}
          />
        );
      });
    })
    .flat();
  // when changing seat positiosn via admin interface with this flat()
  // the hands are disposed for some reason. maybe a r3f bug
  // TODO: investigate further (but just for fun)
}
