import create from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";
import io from "socket.io-client";

import { FakeInputSourceFactory } from "@/utils";
const fakeInputSourceFactory = new FakeInputSourceFactory();

const initialState = {
  ready: false,
  controllers: [],
};

const mutations = (set, get) => {
  const socket = io();

  socket
    .on("connect", () => {
      set({ ready: true });
    })
    .on("disconnect", () => {
      set({ ready: false });
    })
    .on("handData", (handData) => {
      // .on("recordedHandData", (handData) => {
      get().controllers.forEach((target) => {
        const handedness = target.index ? "right" : "left";
        const fakeInputSource = fakeInputSourceFactory.createFakeInputSource();
        const fakeFrame = {
          session: { visibilityState: "visible" },
          getPose: () => null,
          getJointPose: (inputjoint) => {
            const jointPose = handData?.[handedness]?.[inputjoint?.jointName];
            if (!jointPose) {
              return null;
            }
            return {
              transform: { matrix: jointPose.transformMatrix },
              radius: jointPose.radius,
            };
          },
        };
        const fakeReferenceSpace = "local-floor";
        target.webXRController.update(
          fakeInputSource,
          fakeFrame,
          fakeReferenceSpace
        );
      });
    });

  return {
    sendHandData(handData) {
      socket.emit("handData", handData);
    },
    setController(controller) {
      set({ controllers: [...get().controllers, controller] });
    },
  };
};

const useSocket = create(
  subscribeWithSelector(combine(initialState, mutations))
);

export default useSocket;
