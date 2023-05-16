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
  pieces: [],
  debug: {},
};

const adminStateEvents = ["userId", "handView", "pieces", "debug"];

const mutations = (set, get) => {
  adminStateEvents.forEach((eventName) => {
    socket.on(eventName, (object) => {
      set({ [eventName]: object });
    });
  });

  socket
    .on("connect", () => {
      set({ ready: true });
    })
    .on("disconnect", () => {
      set({ ready: false });
    })
    .on("userUpdate", (newUsers) => {
      const userId = get().userId;
      const userIdIndex = newUsers.findIndex((user) => userId === user.userId);
      if (userIdIndex === -1) {
        throw new Error(`userIdIndex not found, maybe not set?`);
      }
      set({ users: newUsers, userIdIndex });
    })
    .on("handData", (data) => {
      const oldTargets = get().controllers?.[data.userId] || [];
      const newTargets = oldTargets.reduce((prev, target) => {
        if (data.joints?.[target.handedness]) {
          prev.push(target);
        }
        return prev;
      }, []);
      // left & right
      data.joints &&
        Object.entries(data.joints).forEach(([handedness, joints]) => {
          let target = newTargets.find(
            ({ handedness: targetHandedness }) =>
              handedness === targetHandedness
          );
          const fakeInputSource =
            fakeInputSourceFactory.createFakeInputSource(handedness);
          if (!target) {
            target = new RemoteXRController(data, handedness);
            target.webXRController.connect(fakeInputSource);
            newTargets.push(target);
          }
          target.update(joints, fakeInputSource, data.fidelity);
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
    socket.emit("handData", { userId: get().userId, ...handData });
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
  return useSocket((state) => state.users);
};

export const useUser = (indexOrUserId) => {
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const users = useUsers();
  const useIndex =
    typeof indexOrUserId === "number" ? indexOrUserId : userIdIndex;
  if (typeof indexOrUserId === "string") {
    return users.find(({ userId }) => userId === indexOrUserId) ?? {};
  }
  return users?.[useIndex] ?? {};
};

export function useDebug() {
  return useSocket((state) => state.debug);
}

export default useSocket;
