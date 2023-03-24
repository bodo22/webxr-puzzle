import React from "react";
import { create } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";

import { HandMotionController } from "@/utils/MotionController";

const initialState = {
  hands: {
    left: undefined,
    right: undefined,
  },
  pinchedObjects: {
    left: undefined,
    right: undefined,
  },
};

const mutations = (set, get) => {
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
    unpinchObject(name) {
      const { pinchedObjects } = get();

      const objectToUnpinch = Object.entries(pinchedObjects).find(
        ([_, po]) => po && po === name
      );
      if (objectToUnpinch) {
        set({
          pinchedObjects: {
            ...get().pinchedObjects,
            [objectToUnpinch[0]]: undefined,
          },
        });
      }
    },
  };
};

const useInteracting = create(
  subscribeWithSelector(combine(initialState, mutations))
);

export function useCallbackRef(fn) {
  const ref = React.useRef(fn);
  React.useEffect(() => {
    ref.current = fn;
  }, [fn]);
  return ref;
}

export function useHandEvent(type, callback) {
  const callbackRef = useCallbackRef(callback);
  const hands = useInteracting((store) => store.hands);

  React.useEffect(() => {
    const cleanups = Object.values(hands).map((hand) => {
      function eventHandler(event) {
        const handMotionController = event.target.children.find(
          (child) => child.constructor.name === "OculusHandModel"
        ).motionController;
        const pinchingController = new HandMotionController(
          handMotionController
        );
        callbackRef.current({ pinchingController, ...event });
      }

      if (hand) {
        hand.addEventListener(type, eventHandler);
      }
      return () => {
        if (hand) {
          hand.removeEventListener(type, eventHandler);
        }
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [type, hands, callbackRef]);
}

export function useIsObjectPinched(name) {
  const pinchedObjects = useInteracting((store) => store.pinchedObjects);
  return Object.values(pinchedObjects).some((po) => po && po === name);
}

export default useInteracting;
