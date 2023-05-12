import React from "react";
import { useXR } from "@react-three/xr";
// import Logo from "@/components/canvas/Logo";
import { useThree } from "@react-three/fiber";
import RemoteHandsAndControllers from "@/components/canvas/remote/RemoteHandsAndControllers";
import PizzaCircle from "@/components/canvas/PizzaCircle";
import useSocket, { useUsers } from "@/stores/socket";
import useInteracting from "@/stores/interacting";
import { MathUtils, Vector3 } from "three";

const stretchFingers = 145;
const bentFingers = 110;

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

const gestures = {
  fist: {
    thumb: "bent",
    index: "bent",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
  },
  point: {
    // thumb: "bent",
    index: "stretched",
    middle: "bent",
    ring: "bent",
    pinky: "bent",
  },
};

// Dom components go here
export default function index() {
  return (
    <>
      {/* <div id="xr-overlay">
      <h1 className="text-gray-50">DOM Overlay TEST!</h1>
    </div> */}
    </>
  );
}

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

const RecordHandData = () => {
  const controllers = useXR((state) => state.controllers);
  const xr = useThree((state) => state.gl.xr);
  const sendHandData = useSocket((state) => state.sendHandData);
  const setHand = useInteracting((state) => state.setHand);
  // const recordedHandData = React.useRef([])

  React.useEffect(() => {
    const handler = ({ data }) => {
      const { gestures, pinchedObjects, hands } = useInteracting.getState();
      const newGestures = Object.entries(hands).reduce(
        (curr, [handedness, hand]) => {
          let newGesture = undefined;
          const handModel = hand?.children?.find(
            (child) => child.constructor.name === "OculusHandModel"
          );
          if (handModel?.motionController?.bones?.length > 0) {
            const fingerGestures = getFingerGestures(handModel);
            newGesture = getGesture(fingerGestures);
          } else {
            console.log(handModel);
          }
          curr[handedness] = newGesture;
          return curr;
        },
        {}
      );
      console.log(newGestures);
      const handData = {
        joints: data,
        gestures,
        pinchedObjects,
      };
      sendHandData(handData);
    };
    if (controllers.length === 0) {
      // this removes remote hands instantly
      sendHandData({});
    }
    xr.addEventListener("managedHandsJointData", handler);
    return () => {
      xr.removeEventListener("managedHandsJointData", handler);
    };
  }, [controllers, xr, sendHandData]);

  React.useEffect(() => {
    const cleanups = controllers.map((target, index) => {
      const onConnected = () => {
        setHand(target.inputSource.handedness, target.hand);
      };
      const onDisconnected = () => {
        setHand(target.inputSource.handedness, undefined);
      };
      target.addEventListener("connected", onConnected);
      target.addEventListener("disconnected", onDisconnected);

      return () => {
        target.removeEventListener("connected", onConnected);
        target.removeEventListener("disconnected", onDisconnected);
      };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [controllers, setHand]);
};

function MoveCamera({ pizzaPositions }) {
  const handView = useSocket((state) => state.handView);
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const users = useUsers();

  const player = useXR((state) => state.player);
  let rotationY = 0;
  let position = new Vector3();
  if (handView === "Pizza" && pizzaPositions[userIdIndex]) {
    position = pizzaPositions[userIdIndex];
    // to not have the 2 users be opposite of each other when there are only 2
    // put them 90° next to each other (as if there were 4)
    const rotateSegments = users.length === 2 ? 4 : users.length;
    // absolute index of userId of hands in users array
    const rotationDeg = userIdIndex * -(360 / rotateSegments);
    rotationY = MathUtils.degToRad(rotationDeg);
  }

  React.useEffect(() => {
    const object = player;
    object.position.copy(new Vector3(position.x, position.y, position.z));
    object.rotation.y = rotationY;
  }, [player, rotationY, position.x, position.y, position.z]);
}

const IndexCanvas = () => {
  const [pizzaPositions, setPizzaPositions] = React.useState([]);

  return (
    <>
      <RecordHandData />
      <MoveCamera pizzaPositions={pizzaPositions} />
      <RemoteHandsAndControllers pizzaPositions={pizzaPositions} />
      <PizzaCircle
        setPizzaPositions={setPizzaPositions}
        pizzaPositions={pizzaPositions}
      />
      {/* <Logo scale={0.5} position-z={-5} /> */}
    </>
  );
};

index.canvas = IndexCanvas;

export async function getStaticProps() {
  return { props: { title: "Puzzle" } };
}
