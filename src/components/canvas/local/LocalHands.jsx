import React from "react";
import { useXR } from "@react-three/xr";

import useSocket, { useUser } from "@/stores/socket";
import Hand from "../Hand";
import useInteracting from "@/stores/interacting";
import { useFrame, useThree } from "@react-three/fiber";
import usePlayerTransform from "../hooks/usePlayerTransform";
import { Quaternion, Vector3 } from "three";
import useGetServerDateNow from "@/components/canvas/hooks/useGetServerDate";

function roundToDecimal(value, decimals) {
  const d = Math.pow(10, decimals);
  return Math.round(value * d) / d;
}

// record and send viewer and hand data for vis at remote clients
function useRecordUserData() {
  const controllers = useXR((state) => state.controllers);
  const player = useXR((state) => state.player);
  const xrManager = useThree((state) => state.gl.xr);
  const sendHandData = useSocket((state) => state.sendHandData);
  const sendViewerData = useSocket((state) => state.sendViewerData);
  const fidelity = useSocket((state) => state.fidelity);
  const lastFrameHands = React.useRef("");
  const remoteControllers = useSocket(
    (state) => Object.values(state.controllers)?.[0]
  );
  const getServerDateNow = useGetServerDateNow()
  const playerTransform = usePlayerTransform();
  const quat = new Quaternion();
  quat
    .setFromAxisAngle(new Vector3(0, 1, 0), playerTransform["rotation-y"])
    .normalize();
  // eslint-disable-next-line no-undef
  const playerRigidTransform = new XRRigidTransform(undefined, quat);
  useFrame((_, __, frame) => {
    const { pinchedObjects, gestures, hands } = useInteracting.getState();
    const referenceSpace = xrManager.getReferenceSpace();
    if (referenceSpace && frame.getViewerPose) {
      const refSpaceToPlayer =
        referenceSpace.getOffsetReferenceSpace(playerRigidTransform);
      const viewerPose = frame.getViewerPose(refSpaceToPlayer);
      const transformMatrix = Array.from(viewerPose.transform.matrix);
      // add player offset here instead of at XRRigidTransform, so that we translate first, then rotate
      // see https://immersive-web.github.io/webxr/#dom-xrrigidtransform-xrrigidtransform
      transformMatrix[12] += player.position.x;
      transformMatrix[13] += player.position.y;
      transformMatrix[14] += player.position.z;
      const transformMatrixRounded = transformMatrix.map((v) =>
        roundToDecimal(v, 3)
      );
      sendViewerData({ transformMatrix: transformMatrixRounded });
    }

    const joints = Object.entries(hands).reduce(
      (newJoints, [handedness, hand]) => {
        if (!hand || !frame) {
          return newJoints;
        }
        // TODO: this is just to find out if the hand is currently being tracked
        // or not... there seems to be no disconnect event in three js and / or the
        // inputSource is not being set to null
        const wristInputjoint = hand.parent.inputSource.hand.get("wrist");
        const wristJointPose = frame.getJointPose(
          wristInputjoint,
          referenceSpace
        );
        if (!wristJointPose) {
          return newJoints;
        }
        newJoints[handedness] = Object.entries(hand.joints).reduce(
          (handJoints, [jointName, joint]) => {
            handJoints.push({
              transformMatrix: joint.matrixWorld
                .toArray()
                .map((v) => roundToDecimal(v, 3)),
              jointRadius: roundToDecimal(joint.jointRadius, 3),
            });
            const remoteController = remoteControllers?.find(
              (c) => c.handedness === handedness
            );
            if (remoteController && jointName === "wrist") {
              const localHandPos = new Vector3().setFromMatrixPosition(
                joint.matrixWorld
              );
              remoteController.setDistanceToLocalHand(localHandPos);
            }
            return handJoints;
          },
          []
        );
        return newJoints;
      },
      {}
    );
    const handData = {
      joints,
      gestures,
      fidelity,
      pinchedObjects,
      timestamp: getServerDateNow(),
    };
    const handsSet = Object.keys(handData.joints).sort().join("-");
    const handDataUpdated =
      lastFrameHands.current !== handsSet || handsSet.length > 0;
    if (handDataUpdated) {
      sendHandData(handData);
    }
    lastFrameHands.current = handsSet;
  });
  if (controllers.length === 0) {
    // this removes remote hands instantly
    // TODO: this never occurs anymore, remove?
    sendHandData({});
  }
}

export default function LocalHands() {
  const userId = useSocket((state) => state.userId);
  const { color } = useUser();
  const controllers = useXR((state) => state.controllers);
  useRecordUserData();
  React.useLayoutEffect(() => {
    for (const target of controllers) {
      target.hand.dispatchEvent({
        type: "connected",
        data: target.inputSource,
        fake: true,
      });
    }
  }, [controllers]);

  return controllers.reduce((acc, target) => {
    if (target.inputSource.gamepad) {
      acc.push(
        <Hand
          local
          userId={userId}
          key={`${userId}-${target.index}-hand`}
          color={color}
          target={target}
          handedness={target.inputSource.handedness}
        />
      );
    }
    return acc;
  }, []);
}
