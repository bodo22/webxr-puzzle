import React from "react";
import { create } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";

import {
  HandMotionController,
  TriggerMotionController,
} from "@/utils/MotionController";
import useSocket from "@/stores/socket";
import { getServerDateNow } from "@/components/canvas/hooks/useGetServerDate";

const initialGesture = "default";

const initialState = {
  hands: {
    left: undefined,
    right: undefined,
  },
  motionControllers: {
    left: undefined,
    right: undefined,
  },
  // TODO: remove?
  skinnedMeshes: {
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
  bvhColliding: {
    left: false,
    right: false,
  },
  lastRemotePinchOverride: {
    left: 0,
    right: 0,
  },
};

const mutations = (set, get) => {
  const { socket, log } = useSocket.getState();

  socket.on("reset", () => {
    set({
      pinchedObjects: {
        left: undefined,
        right: undefined,
      },
    });
  });

  return {
    setSkinnedMesh(handedness, skinnedMesh) {
      set({
        skinnedMeshes: {
          ...get().skinnedMeshes,
          [handedness]: skinnedMesh,
        },
      });
    },
    setHand(handedness, hand) {
      const motionController =
        hand &&
        hand.children.find(
          (child) => child.constructor.name === "OculusHandModel"
        )?.motionController;
      set({
        hands: {
          ...get().hands,
          [handedness]: hand,
        },
        motionControllers: {
          ...get().motionControllers,
          [handedness]: motionController,
        },
      });
    },
    setPinchedObject(handedness, pinchedObject) {
      const otherHandName = handedness === "left" ? "right" : "left";
      console.log("setting pinched object", handedness, pinchedObject);
      const newPinchedObjects = {
        ...get().pinchedObjects,
        [handedness]: pinchedObject,
      };
      if (
        pinchedObject &&
        get().pinchedObjects[otherHandName] === pinchedObject
      ) {
        newPinchedObjects[otherHandName] = undefined;
      }
      set({ pinchedObjects: newPinchedObjects });
    },
    setGesture(handedness, gesture) {
      log({
        type: "setGesture",
        handedness,
        name: gesture,
      });
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
    setBvhColliding(handedness, bvhColliding) {
      set({
        bvhColliding: {
          ...get().bvhColliding,
          [handedness]: bvhColliding,
        },
      });
    },
    setLastRemotePinchOverride(handedness) {
      set({
        lastRemotePinchOverride: {
          ...get().lastRemotePinchOverride,
          [handedness]: getServerDateNow(),
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
        let pinchingController;
        if (event.target?.parent?.currentFidelity?.level === "blob") {
          pinchingController = new TriggerMotionController(
            event.target.parent.blobGroup
          );
        } else {
          pinchingController = new HandMotionController(handMotionController);
        }
        callback({ pinchingController, ...event });
      }
      // TODO trigger pinchstart & pinchstop with RemoteHandMotionController

      hand?.addEventListener(type, eventHandler);
      return () => {
        hand?.removeEventListener(type, eventHandler);
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [type, hands, callback]);
}

// if byHand is not set, it will return true if any hand is pinching the object
// if byHand is set, it will return true only if the specified hand is pinching the object
export function useIsObjectPinched(name, byHand) {
  const pinchedObjects = useInteracting((state) => state.pinchedObjects);
  return Object.entries(pinchedObjects).find(
    ([handedness, po]) =>
      po && po === name && (!byHand || handedness === byHand)
  );
}

export default useInteracting;
