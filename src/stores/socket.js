import create from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";
import io from "socket.io-client";

import { fakeInputSourceFactory } from "@/utils";

import RemoteXRController from "@/components/canvas/remote/RemoteXRController";

const initialState = {
  ready: false,
  controllers: {},
  userId: undefined,
};

const mutations = async (set, get) => {
  let supported = false;
  try {
    supported = await navigator.xr.isSessionSupported("immersive-vr");
  } catch (err) {}
  const socket = io(undefined, {
    query: `isSessionSupported=${supported}`,
  });

  socket
    .on("connect", () => {
      set({ ready: true });
    })
    .on("disconnect", () => {
      set({ ready: false });
    })
    .on("userId", (userId) => {
      set({ userId });
    })
    .on("handData", (data) => {
      // .on("recordedHandData", (data) => {
      let targets = get().controllers?.[data.userId];
      if (!targets) {
        targets = ["left", "right"].map((handedness) => {
          const target = new RemoteXRController(data.userId, handedness);
          const fakeInputSource = fakeInputSourceFactory.createFakeInputSource(
            target.handedness
          );
          target.webXRController.connect(fakeInputSource);
          return target;
        });
        set({
          controllers: {
            ...get().controllers,
            [data.userId]: targets,
          },
        });
        console.log(`added controllers for ${data.userId}.`);
      }
      targets.forEach((target) => {
        const fakeInputSource = fakeInputSourceFactory.createFakeInputSource(
          target.handedness
        );
        const fakeFrame = {
          session: { visibilityState: "visible" },
          getPose: () => null,
          getJointPose: (inputjoint) => {
            const jointPose =
              data.handData?.[target.handedness]?.[inputjoint?.jointName];
            if (!jointPose) {
              return null;
            }
            return {
              transform: { matrix: jointPose.transformMatrix },
              radius: jointPose.radius,
            };
          },
        };
        const fakeReferenceSpace = "local";
        target.webXRController.update(
          fakeInputSource,
          fakeFrame,
          fakeReferenceSpace
        );
      });
    });

  return {
    sendHandData(handData) {
      socket.emit("handData", { userId: get().userId, handData: handData });
    },
    setControllers(userId, controllers) {
      set({
        controllers: {
          ...get().controllers,
          [userId]: controllers,
        },
      });
    },
  };
};

const useSocket = create(
  subscribeWithSelector(combine(initialState, mutations))
);

export default useSocket;
