export const jointNames = [
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

export const fingerJointsToBoneMap = {
  thumb: {
    distal: {
      from: "thumb-phalanx-distal",
      to: "thumb-tip",
    },
    // proximal: {
    //   from: "thumb-phalanx-proximal",
    //   to: "thumb-phalanx-distal",
    // },
    metacarpal: {
      from: "thumb-metacarpal",
      to: "thumb-phalanx-proximal",
    },
  },
  index: {
    distal: {
      from: "index-finger-phalanx-distal",
      to: "index-finger-tip",
    },
    // intermediate: {
    //   from: "index-finger-phalanx-intermediate",
    //   to: "index-finger-phalanx-distal",
    // },
    // proximal: {
    //   from: "index-finger-phalanx-proximal",
    //   to: "index-finger-phalanx-intermediate",
    // },
    metacarpal: {
      from: "index-finger-metacarpal",
      to: "index-finger-phalanx-proximal"
    },
  },
  middle: {
    distal: {
      from: "middle-finger-phalanx-distal",
      to: "middle-finger-tip",
    },
    // intermediate: {
    //   from: "middle-finger-phalanx-intermediate",
    //   to: "middle-finger-phalanx-distal",
    // },
    // proximal: {
    //   from: "middle-finger-phalanx-proximal",
    //   to: "middle-finger-phalanx-intermediate",
    // },
    metacarpal: {
      from: "middle-finger-metacarpal",
      to: "middle-finger-phalanx-proximal"
    },
  },
  ring: {
    distal: {
      from: "ring-finger-phalanx-distal",
      to: "ring-finger-tip",
    },
    // intermediate: {
    //   from: "ring-finger-phalanx-intermediate",
    //   to: "ring-finger-phalanx-distal",
    // },
    // proximal: {
    //   from: "ring-finger-phalanx-proximal",
    //   to: "ring-finger-phalanx-intermediate",
    // },
    metacarpal: {
      from: "ring-finger-metacarpal",
      to: "ring-finger-phalanx-proximal"
    },
  },
  pinky: {
    distal: {
      from: "pinky-finger-phalanx-distal",
      to: "pinky-finger-tip",
    },
    // intermediate: {
    //   from: "pinky-finger-phalanx-intermediate",
    //   to: "pinky-finger-phalanx-distal",
    // },
    // proximal: {
    //   from: "pinky-finger-phalanx-proximal",
    //   to: "pinky-finger-phalanx-intermediate",
    // },
    metacarpal: {
      from: "pinky-finger-metacarpal",
      to: "pinky-finger-phalanx-proximal"
    },
  },
};

function values() {
  return [...new Array(25).keys()];
  // return jointNames;
}

function get(jointName) {
  return { jointName };
}

class FakeInputSourceFactory {
  createFakeInputSource(handedness) {
    return {
      handedness,
      // gripSpace: {},
      hand: { size: 25, values, get },
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
