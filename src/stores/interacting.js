import React from "react";
import { create } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";

import { HandMotionController } from "@/utils/MotionController";
import useSocket from "@/stores/socket";

const initialGesture = "default";

const initialState = {
  hands: {
    left: undefined,
    right: undefined,
  },
  pinching: {
    left: false,
    right: false,
  },
  pinchedObjects: {
    left: undefined,
    right: undefined,
  },
  gestures: {
    left: initialGesture,
    right: initialGesture,
  },
};

const mutations = (set, get) => {
  const { socket } = useSocket.getState();

  socket.on("reset", () => {
    set({
      pinchedObjects: {
        left: undefined,
        right: undefined,
      },
    });
  });

  return {
    setHand(handedness, hand) {
      set({ hands: { ...get().hands, [handedness]: hand } });
    },
    setPinchedObject(handedness, pinchedObject) {
      set({
        pinchedObjects: {
          ...get().pinchedObjects,
          [handedness]: pinchedObject,
        },
      });
    },
    setGesture(handedness, gesture) {
      set({
        gestures: {
          ...get().gestures,
          [handedness]: gesture,
        },
      });
    },
    setPinching(handedness, pinching) {
      set({
        pinching: {
          ...get().pinching,
          [handedness]: pinching,
        },
      });
    },
  };
};

const useInteracting = create(
  subscribeWithSelector(combine(initialState, mutations))
);

export function useHandEvent(type, callback) {
  const hands = useInteracting((state) => state.hands);

  React.useEffect(() => {
    const cleanups = Object.values(hands).map((hand) => {
      function eventHandler(event) {
        const handMotionController = event.target.children.find(
          (child) => child.constructor.name === "OculusHandModel"
        ).motionController;
        const pinchingController = new HandMotionController(
          handMotionController
        );
        callback({ pinchingController, ...event });
      }

      hand && hand.addEventListener(type, eventHandler);
      return () => {
        hand && hand.removeEventListener(type, eventHandler);
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [type, hands, callback]);
}

export function useIsObjectPinched(name) {
  const pinchedObjects = useInteracting((state) => state.pinchedObjects);
  return Object.entries(pinchedObjects).find(
    ([handedness, po]) => po && po === name
  );
}

export default useInteracting;
