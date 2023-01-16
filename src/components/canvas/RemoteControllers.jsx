import React from "react";
import io from "socket.io-client";

import * as THREE from "three";
import { XRControllerModelFactory, OculusHandModel } from "three-stdlib";
import { useThree, extend, createPortal } from "@react-three/fiber";

import RemoteXRController from "@/components/canvas/RemoteXRController";

// const socket = io(`http://${window.location.hostname}:3003`)
// const socket = io(undefined, { path: '/willi' })
const socket = io();

const modelFactory = new XRControllerModelFactory();

class ControllerModel extends THREE.Group {
  constructor(target) {
    super();
    this.add(modelFactory.createControllerModel(target.controller));
  }
}

function handValues() {
  return [
    { jointName: "wrist" },
    { jointName: "thumb-metacarpal" },
    { jointName: "thumb-phalanx-proximal" },
    { jointName: "thumb-phalanx-distal" },
    { jointName: "thumb-tip" },
    { jointName: "index-finger-metacarpal" },
    { jointName: "index-finger-phalanx-proximal" },
    { jointName: "index-finger-phalanx-intermediate" },
    { jointName: "index-finger-phalanx-distal" },
    { jointName: "index-finger-tip" },
    { jointName: "middle-finger-metacarpal" },
    { jointName: "middle-finger-phalanx-proximal" },
    { jointName: "middle-finger-phalanx-intermediate" },
    { jointName: "middle-finger-phalanx-distal" },
    { jointName: "middle-finger-tip" },
    { jointName: "ring-finger-metacarpal" },
    { jointName: "ring-finger-phalanx-proximal" },
    { jointName: "ring-finger-phalanx-intermediate" },
    { jointName: "ring-finger-phalanx-distal" },
    { jointName: "ring-finger-tip" },
    { jointName: "pinky-finger-metacarpal" },
    { jointName: "pinky-finger-phalanx-proximal" },
    { jointName: "pinky-finger-phalanx-intermediate" },
    { jointName: "pinky-finger-phalanx-distal" },
    { jointName: "pinky-finger-tip" },
  ];
}

class FakeInputSourceFactory {
  createFakeInputSource(handedness) {
    return {
      handedness,
      // gripSpace: {},
      hand: { size: 25, values: handValues },
      profiles: [
        "oculus-hand",
        "generic-hand",
        "generic-hand-select",
        "generic-trigger",
      ],
      targetRayMode: "tracked-pointer",
      targetRaySpace: {},
      gamepad: {
        axes: [],
        buttons: [{ pressed: true, touched: true, value: 0 }],
        connected: false,
        hapticActuators: [],
        id: "",
        index: -1,
        mapping: "xr-standard",
        timestamp: 9380.39999999851,
        vibrationActuator: null,
      },
    };
  }
}

const fakeInputSourceFactory = new FakeInputSourceFactory();

export function RemoteControllers({ controllers }) {
  React.useMemo(() => extend({ ControllerModel }), []);

  // Send fake connected event (no-op) so models start loading
  React.useLayoutEffect(() => {
    for (const target of controllers) {
      const fakeInputSource = fakeInputSourceFactory.createFakeInputSource(
        target.index ? "right" : "left"
      );
      target.controller.dispatchEvent({
        type: "connected",
        data: fakeInputSource,
        fake: true,
      });
    }
  }, [controllers]);

  return (
    <>
      {controllers.map((target, i) => (
        <React.Fragment key={i}>
          {createPortal(<controllerModel args={[target]} />, target.grip)}
        </React.Fragment>
      ))}
    </>
  );
}

export function RemoteHands({ controllers, modelLeft, modelRight }) {
  React.useMemo(() => extend({ OculusHandModel }), []);

  // Send fake connected event (no-op) so models start loading
  React.useLayoutEffect(() => {
    for (const target of controllers) {
      const fakeInputSource = fakeInputSourceFactory.createFakeInputSource(
        target.index ? "right" : "left"
      );
      target.hand.dispatchEvent({
        type: "connected",
        data: fakeInputSource,
        fake: true,
      });
    }
  }, [controllers, modelLeft, modelRight]);

  return (
    <>
      {controllers.map(({ hand }) =>
        createPortal(
          <oculusHandModel args={[hand, modelLeft, modelRight]} />,
          hand
        )
      )}
    </>
  );
}

export default function RemoteHandsAndController() {
  const gl = useThree((state) => state.gl);
  const [controllers, set] = React.useState([]);
  React.useLayoutEffect(() => {
    [0, 1].forEach((id) => {
      const target = new RemoteXRController(id, gl);
      const fakeInputSource = fakeInputSourceFactory.createFakeInputSource(
        target.index ? "right" : "left"
      );
      target.webXRController.connect(fakeInputSource);
      set((state) => [...state, target]);
    });
  }, [gl, set]);

  React.useEffect(() => {
    socket.on("connect", () => {
      console.log(true);
    });

    socket.on("disconnect", () => {
      console.log(false);
    });

    function handDataRecieved(data) {
      // console.log(Date.now() - data.time)
      controllers.forEach((target) => {
        const handedness = target.index ? "right" : "left";
        const fakeInputSource = fakeInputSourceFactory.createFakeInputSource();
        const fakeFrame = {
          session: { visibilityState: "visible" },
          getPose: () => null,
          getJointPose: (inputjoint) => {
            const jointPose = data[handedness][inputjoint.jointName];
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
    }

    socket.on("handData", handDataRecieved);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("handData", handDataRecieved);
    };
  }, [controllers]);

  return (
    <>
      {controllers.map((controller) => (
        <primitive key={controller.index} object={controller} />
      ))}
      <RemoteControllers controllers={controllers} />
      <RemoteHands controllers={controllers} />
    </>
  );
}
