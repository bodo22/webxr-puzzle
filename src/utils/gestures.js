import useInteracting from "@/stores/interacting";
import { MathUtils, Vector3 } from "three";

const stretchFingers = 145;
const bentFingers = 80;

const anglesToMeasure = {
  thumb: {
    jointNames: [
      0, 2, 4,
      // 2, 3, 4,
      // "thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip"
    ],
    stretchedAbove: 140,
    bentBelow: 139,
  },
  index: {
    jointNames: [
      6, 7, 9,
      // "index-finger-phalanx-proximal",
      // "index-finger-phalanx-intermediate",
      // "index-finger-tip",
    ],
    stretchedAbove: stretchFingers,
    bentBelow: bentFingers,
  },
  middle: {
    jointNames: [
      11, 12, 14,
      // "middle-finger-phalanx-proximal",
      // "middle-finger-phalanx-intermediate",
      // "middle-finger-tip",
    ],
    stretchedAbove: stretchFingers,
    bentBelow: bentFingers,
  },
  ring: {
    jointNames: [
      16, 17, 19,
      // "ring-finger-phalanx-proximal",
      // "ring-finger-phalanx-intermediate",
      // "ring-finger-tip",
    ],
    stretchedAbove: stretchFingers,
    bentBelow: bentFingers,
  },
  pinky: {
    jointNames: [
      21, 22, 24,
      // "pinky-finger-phalanx-proximal",
      // "pinky-finger-phalanx-intermediate",
      // "pinky-finger-tip",
    ],
    stretchedAbove: stretchFingers,
    bentBelow: bentFingers,
  },
};

// first wins
const gestures = {
  // TODO: decide whether to use this pinch, or device pinch (selectstart etc.)
  // pinch: {
  //   thumb: "stretched",
  //   index: "stretched",
  //   middle: "bent",
  //   ring: "bent",
  //   pinky: "bent",
  // },
  // fist: {
  //   thumb: "bent",
  //   index: "bent",
  //   middle: "bent",
  //   ring: "bent",
  //   pinky: "bent",
  // },
  point: {
    // thumb: "bent",
    index: "stretched",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
  },
};

function getGesture(fingerGestures) {
  return (
    Object.entries(gestures).find(([gestureName, neededFingerGestures]) => {
      return Object.entries(neededFingerGestures).every(
        ([fingerName, neededFingerGesture]) => {
          return fingerGestures[fingerName][neededFingerGesture] === true;
        }
      );
    })?.[0] ?? "default"
  );
}

function getFingerGestures(handModel) {
  const bones = handModel.motionController.bones;
  const angles = Object.entries(anglesToMeasure).reduce(
    (curr, [fingerName, finger]) => {
      const bonesToMeasure = finger.jointNames.map(
        (jointName) => bones[jointName].position
      );
      // https://stackoverflow.com/a/1211226
      const p1 = new Vector3().subVectors(bonesToMeasure[1], bonesToMeasure[0]);
      const p2 = new Vector3().subVectors(bonesToMeasure[1], bonesToMeasure[2]);

      const deg = MathUtils.radToDeg(p1.angleTo(p2));
      curr[fingerName] = {
        deg,
        stretched: deg >= finger.stretchedAbove,
        bent: deg <= finger.bentBelow,
      };
      return curr;
    },
    {}
  );
  return angles;
}

export function updateGestures() {
  const { gestures, hands, setGesture, pinching } = useInteracting.getState();
  Object.entries(hands).forEach(([handedness, hand]) => {
    let newGesture = undefined;
    const handModel = hand?.children?.find(
      (child) => child.constructor.name === "OculusHandModel"
    );
    if (handModel?.motionController?.bones?.length > 0) {
      const fingerGestures = getFingerGestures(handModel);
      // opinionated: pinch always overrides other gestures
      newGesture = pinching[handedness] ? "pinch" : getGesture(fingerGestures);
      if (newGesture !== gestures[handedness]) {
        setGesture(handedness, newGesture);
      }
    }
  });
}
