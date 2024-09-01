import React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import useInteracting from "@/stores/interacting";
import useSocket from "@/stores/socket";
import { getFingerGestures } from "@/utils/gestures";
import { getServerDateNow } from "../useGetServerDate";

export default function useListenForBvhCollision({
  handedness,
  lockObjectToHand,
  releaseObjectFromHand,
}) {
  const scene = useThree((state) => state.scene);
  const isPinchingObject = useInteracting(
    (state) => state.pinchedObjects[handedness]
  );
  const bvhColliding = useInteracting(
    (state) => state.bvhColliding[handedness]
  );
  const prevPinchCollision = React.useRef(false);
  const prevGrabCollision = React.useRef(false);

  const setBvhColliding = useInteracting((state) => state.setBvhColliding);
  const { selectOnCollision } = useSocket((state) => state.level);
  const lastRemotePinchOverride = useInteracting(
    (state) => state.lastRemotePinchOverride[handedness]
  );
  const motionController = useInteracting(
    (state) => state.motionControllers[handedness]
  );
  const handCollisionBodies = scene.getObjectByName(
    `hand-collision-body-${handedness}`
  );
  useFrame((_, __, frame) => {
    if (handCollisionBodies?.children.length !== 10) {
      return;
    }
    // const collisionBodies = {
    //   thumb: handCollisionBodies.children[0], // .getObjectByName(`${handedness}-thumb-distal`),
    //   index: handCollisionBodies.children[3], // .getObjectByName(`${handedness}-index-distal`),
    //   middle: handCollisionBodies.children[7], // .getObjectByName(`${handedness}-middle-distal`),
    //   ring: handCollisionBodies.children[11], // .getObjectByName(`${handedness}-ring-distal`),
    //   pinky: handCollisionBodies.children[15], // .getObjectByName(`${handedness}-pinky-distal`),
    //   thumbPalm: handCollisionBodies.children[2], // .getObjectByName(`${handedness}-thumb-metacarpal`),
    //   indexPalm: handCollisionBodies.children[6], // .getObjectByName(`${handedness}-index-metacarpal`),
    //   middlePalm: handCollisionBodies.children[10], // .getObjectByName(`${handedness}-middle-metacarpal`),
    //   ringPalm: handCollisionBodies.children[14], // .getObjectByName(`${handedness}-ring-metacarpal`),
    //   pinkyPalm: handCollisionBodies.children[18], // .getObjectByName(`${handedness}-pinky-metacarpal`),
    // };
    const collisionBodies = {
      thumb: handCollisionBodies.children[0], // .getObjectByName(`${handedness}-thumb-distal`),
      thumbPalm: handCollisionBodies.children[1], // .getObjectByName(`${handedness}-thumb-metacarpal`),
      index: handCollisionBodies.children[2], // .getObjectByName(`${handedness}-index-distal`),
      indexPalm: handCollisionBodies.children[3], // .getObjectByName(`${handedness}-index-metacarpal`),
      middle: handCollisionBodies.children[4], // .getObjectByName(`${handedness}-middle-distal`),
      middlePalm: handCollisionBodies.children[5], // .getObjectByName(`${handedness}-middle-metacarpal`),
      ring: handCollisionBodies.children[6], // .getObjectByName(`${handedness}-ring-distal`),
      ringPalm: handCollisionBodies.children[7], // .getObjectByName(`${handedness}-ring-metacarpal`),
      pinky: handCollisionBodies.children[8], // .getObjectByName(`${handedness}-pinky-distal`),
      pinkyPalm: handCollisionBodies.children[9], // .getObjectByName(`${handedness}-pinky-metacarpal`),
    };

    const allAreBoolean = Object.values(collisionBodies).every(
      (body) => body?.userData?.colliding !== undefined
    );
    if (!allAreBoolean) {
      return;
    }
    const angles = getFingerGestures({ motionController });
    const fourBent = Object.values(angles).filter((a) => a.bent).length >= 4;
    const thumbColliding = collisionBodies.thumb.userData.colliding;
    const indexColliding = collisionBodies.index.userData.colliding;
    const middleColliding = collisionBodies.middle.userData.colliding;
    const ringColliding = collisionBodies.ring.userData.colliding;
    const pinkyColliding = collisionBodies.pinky.userData.colliding;
    // const thumbPalmColliding = collisionBodies.thumbPalm.userData.colliding;
    const indexPalmColliding = collisionBodies.indexPalm.userData.colliding;
    const middlePalmColliding = collisionBodies.middlePalm.userData.colliding;
    const ringPalmColliding = collisionBodies.ringPalm.userData.colliding;
    const pinkyPalmColliding = collisionBodies.pinkyPalm.userData.colliding;
    const twoFingerTipsColliding =
      [indexColliding, middleColliding, ringColliding, pinkyColliding].filter(
        Boolean
      ).length >= 1;
    const twoFingerPalmsColliding =
      [
        indexPalmColliding,
        middlePalmColliding,
        ringPalmColliding,
        pinkyPalmColliding,
      ].filter(Boolean).length >= 1;

    const noFingerTipsColliding =
      !indexColliding && !middleColliding && !ringColliding && !pinkyColliding;
    const pinchCollision = thumbColliding && twoFingerTipsColliding;
    const grabCollision =
      fourBent && twoFingerTipsColliding && twoFingerPalmsColliding;
    const collision = pinchCollision || grabCollision;
    const endPinchCollision =
      !grabCollision &&
      prevPinchCollision.current &&
      (!thumbColliding || noFingerTipsColliding);
    const endGrabCollision =
      !pinchCollision && prevGrabCollision.current && !grabCollision;
    const endCollision = endPinchCollision || endGrabCollision;
    // only if no collision is currently occurring
    // to prevent ping-pong effect when taking from other hand
    // if collision is currently occurring, wait for collision to end once
    // first, then collision & object to hand locking can happen again.
    // for smoother handover to remote, pause being able to grab for 500ms
    // when remote hand is pinching object, see useListenForRemotePinch.js
    if (collision && !bvhColliding) {
    }
    if (
      collision &&
      bvhColliding === false &&
      getServerDateNow() - lastRemotePinchOverride > 500
    ) {
      setBvhColliding(handedness, true);
      if (selectOnCollision && !isPinchingObject) {
        lockObjectToHand(handedness);
      }
    } else if (endCollision) {
      setBvhColliding(handedness, false);
      if (selectOnCollision && isPinchingObject) {
        releaseObjectFromHand(handedness);
      }
    }
    prevPinchCollision.current = pinchCollision;
    prevGrabCollision.current = grabCollision;
    // console.log("frame", frame);
  }, -1); // -2 to run after setting current joint collision states in HandCollisionBody
}
