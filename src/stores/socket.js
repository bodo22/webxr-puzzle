import create from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";
import socket from "./socketConnection";

import { fakeInputSourceFactory } from "@/utils";

import RemoteXRController from "@/components/canvas/remote/RemoteXRController";

const initialState = {
  ready: false,
  controllers: {},
  userId: undefined,
  users: [],
  handView: "Ego",
};

const mutations = (set, get) => {
  setInterval(() => {
    // TODO: removeable?
    const newControllers = Object.entries(get().controllers).reduce(
      (prev, [key, targets]) => {
        const keep = targets.every(
          (target) =>
            !target.lastXRUpdate || Date.now() - target.lastXRUpdate < 500
        );
        if (keep) {
          prev[key] = targets;
        }
        return prev;
      },
      {}
    );
    if (
      Object.keys(newControllers).length !==
      Object.keys(get().controllers).length
    ) {
      set({ controllers: newControllers });
    }
  }, 1000);
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
    .on("userUpdate", (users) => {
      set({ users });
    })
    .on("handViewChange", (event) => {
      set({ handView: event.type });
    })
    .on("handData", (data) => {
      // .on("recordedHandData", (data) => {
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
          controllers: {
            ...get().controllers,
            [data.userId]: newTargets,
          },
        });
      }
    });

  return {
    sendHandData(handData) {
      socket.emit("handData", { userId: get().userId, handData: handData });
    },
  };
};

const useSocket = create(
  subscribeWithSelector(combine(initialState, mutations))
);

export const useUsers = () => {
  const controllers = useSocket((state) => state.controllers);
  const users = useSocket((state) => state.users);

  return users.filter((user) => {
    return !!controllers[user.userId];
  }, []);
};

export default useSocket;
