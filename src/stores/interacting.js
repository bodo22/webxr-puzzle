import React from "react";
import { create } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";

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
        const motionController = event.target.children.find(
          (child) => child.constructor.name === "OculusHandModel"
        )?.motionController;
        callbackRef.current({ motionController, ...event });
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

export default useInteracting;
