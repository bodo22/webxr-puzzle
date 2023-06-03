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
  debug: {
    pizzaRadius: 0.5,
  },
  level: {},
  fidelity: {},
};

const adminStateEvents = [
  "userId",
  "handView",
  "pieces",
  "debug",
  "level",
  "fidelity",
];

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
          target.update(
            joints,
            fakeInputSource,
            data.fidelity,
            data.gestures[handedness]
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
    socket.emit("handData", { userId: get().userId, ...handData });
  }
  function emitPinchData(pinchData) {
    socket.emit("pinchData", { userId: get().userId, ...pinchData });
  }

  setInterval(() => {
    if (get().userId !== "spectator") {
      get().pieces.forEach((piece) => {
        const pinchData = {
          name: piece.name,
        };
        if (typeof piece.pinchStart !== "undefined") {
          pinchData.pinchStart = piece.pinchStart;
        }
        if (typeof piece.trashed !== "undefined") {
          pinchData.trashed = piece.trashed;
        }
        if (typeof piece.success !== "undefined") {
          pinchData.success = piece.success;
        }
        if (Object.keys(pinchData).length > 2) {
          socket.emit("pieceStateData", pinchData);
        }
      });
    }
  }, 500);

  const fps = 30;
  const wait = 1000 / fps;

  return {
    sendHandData: throttle(emitHandData, wait),
    sendPinchData: throttle(emitPinchData, wait),
    updatePiece(name, key, value) {
      const pieces = [...get().pieces].map((piece) => {
        if (piece.name === name) {
          piece[key] = value;
        }
        return piece;
      });
      set({ pieces });
    },
    log(log) {
      socket.emit("log", { ...log, timestamp: Date.now() });
    },
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

const params = new URL(document.location).searchParams;
const overrideDebug = params.get("overrideDebug") === "all";

export function useDebug() {
  const debug = useSocket((state) => state.debug);
  if (overrideDebug) {
    return Object.entries(debug).reduce((acc, [key, value]) => {
      acc[key] = value === false ? true : value;
      return acc;
    }, {});
  }
  return debug;
}

export function useLog() {
  return useSocket((state) => state.log);
}

export default useSocket;
