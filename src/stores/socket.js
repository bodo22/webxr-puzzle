import { create } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";
import throttle from "lodash.throttle";

import socket from "./socketConnection";
import { fakeInputSourceFactory } from "@/utils";

import RemoteXRController from "@/components/canvas/remote/RemoteXRController";

const initialState = {
  socket,
  ready: false,
  controllers: {},
  userId: undefined,
  userIdIndex: 0,
  users: [],
  handView: "Ego",
};

const mutations = (set, get) => {
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
    .on("userUpdate", (newUsers) => {
      const userId = get().userId;
      const userIdIndex = newUsers.findIndex((user) => userId === user.userId);
      if (userIdIndex === -1) {
        throw new Error(`userIdIndex not found, maybe not set?`);
      }
      set({ users: newUsers, userIdIndex });
    })
    .on("handViewChange", (event) => {
      set({ handView: event.type });
    })
    .on("handData", (data) => {
      const oldTargets = get().controllers?.[data.userId] || [];
      const newTargets = oldTargets.reduce((prev, target) => {
        if (data.handData[target.handedness]) {
          prev.push(target);
        }
        return prev;
      }, []);
      Object.entries(data.handData).forEach(([handedness, handData]) => {
        let target = newTargets.find(
          ({ handedness: targetHandedness }) => handedness === targetHandedness
        );
        const fakeInputSource =
          fakeInputSourceFactory.createFakeInputSource(handedness);
        if (!target) {
          target = new RemoteXRController(data, handedness);
          target.webXRController.connect(fakeInputSource);
          newTargets.push(target);
        }
        const fakeFrame = {
          session: { visibilityState: "visible" },
          getPose: () => null,
          getJointPose: (inputjoint) => {
            const jointPose = handData?.[inputjoint?.jointName];
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
        target.lastXRUpdate = Date.now();
        target.webXRController.update(
          fakeInputSource,
          fakeFrame,
          fakeReferenceSpace
        );
      });
      const symDiff = newTargets
        .filter((x) => !oldTargets.includes(x))
        .concat(oldTargets.filter((x) => !newTargets.includes(x)));
      if (symDiff.length) {
        set({
          ...get(),
          controllers: {
            ...get().controllers,
            [data.userId]: newTargets,
          },
        });
      }
    });

  function emitHandData(handData) {
    socket.emit("handData", { userId: get().userId, handData: handData });
  }
  function emitPinchData(pinchData) {
    socket.emit("pinchData", { userId: get().userId, ...pinchData });
  }

  const fps = 30;
  const wait = 1000 / fps;

  return {
    sendHandData: throttle(emitHandData, wait),
    sendPinchData: throttle(emitPinchData, wait),
  };
};

const useSocket = create(
  subscribeWithSelector(combine(initialState, mutations))
);

export const useUsers = () => {
  const users = useSocket((state) => state.users);

  return users
};

export default useSocket;
