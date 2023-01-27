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
        timestamp: 1000,
        vibrationActuator: null,
      },
    };
  }
}

const factory = new FakeInputSourceFactory();

export default factory;
