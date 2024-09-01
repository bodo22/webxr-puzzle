import React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Quaternion, Vector3 } from "three";
import useSocket, { useUser } from "@/stores/socket";
import useInteracting, { useIsObjectPinched } from "@/stores/interacting";
import { getHandTransform } from "@/utils";
import { useXR } from "@react-three/xr";
import { getServerDateNow } from "../useGetServerDate";

export default function useUpdateGroup(ref, props) {
  const previousTransformRef = React.useRef();
  const previousManipQuatGiverRef = React.useRef(new Quaternion());
  const frozenHandQuatRef = React.useRef(new Quaternion());
  const frameInManip = React.useRef(0);
  const previousHandedness = React.useRef();
  const sendPinchData = useSocket((state) => state.sendPinchData);
  const pinched = useIsObjectPinched(ref.current?.name);
  const handedness = pinched?.[0];
  const handMeshModel = useInteracting(
    (state) => state.motionControllers[handedness]
  );
  const { type: userType } = useUser();

  // when grabbing an object as receiver, apply and send rotation
  const isReceiver = userType === "receiver";
  const isGiver = userType === "giver";

  const remoteController = useSocket((state) =>
    Object.values(state.controllers)?.[0]?.find((c) => c.handedness === "right")
  );

  const socket = useSocket((state) => state.socket);
  const manipulationObjRef = React.useRef();
  React.useEffect(() => {
    function handleViewerData(viewerData) {
      manipulationObjRef.current = viewerData.transformMatrix;
    }
    socket.on("viewerData", handleViewerData);
    return () => {
      socket.off("viewerData", handleViewerData);
    };
  }, [socket]);
  const scene = useThree((state) => state.scene);
  const player = useXR((state) => state.player);
  const objectOrientation = useSocket((state) => state.objectOrientation);

  const { glb } = useSocket((state) => state.level);
  const meshName = `${glb}-meshWithBvh`;
  const collideObjectParent = scene.getObjectByName(meshName)?.parent;

  const getNewTransformForRemote = React.useCallback(() => {
    const scale = ref.current.userData?.origProps?.scale || 1;
    const handTransform = getHandTransform(handMeshModel, ref.current.scale);
    const localHandQuat = new Quaternion();
    const localHandPos = new Vector3();
    let prevQuat = new Quaternion();
    let prevPos = new Vector3();
    handTransform.decompose(localHandPos, localHandQuat, new Vector3());

    if (
      previousTransformRef.current === undefined ||
      previousHandedness.current !== handedness
    ) {
      previousTransformRef.current = handTransform.clone();
      previousHandedness.current = handedness;
      prevQuat = localHandQuat.clone();
      prevPos = localHandPos.clone();
    } else {
      previousTransformRef.current.decompose(prevPos, prevQuat, new Vector3());
    }

    const distanceToTriggerManip = 0.9;
    const distanceBetweenHands = remoteController?.distanceToLocalHand ?? 999;
    const isGiverAndDistanceLeqThreshold =
      userType === "giver" && distanceBetweenHands >= distanceToTriggerManip;
    const baseline = objectOrientation.level === "baseline";
    const directlyApplyRotation =
      baseline || isReceiver || isGiverAndDistanceLeqThreshold;
    const copy = ref.current.clone(false);
    copy.applyMatrix4(previousTransformRef.current.clone().invert());
    const negatedMat4 = copy.matrix.clone();
    copy.applyMatrix4(handTransform.clone());

    collideObjectParent.applyMatrix4(
      previousTransformRef.current.clone().invert()
    );
    collideObjectParent.applyMatrix4(handTransform.clone());

    if (directlyApplyRotation) {
      frameInManip.current = 0;
      ref.current.matrix.copy(copy.matrix);
      ref.current.matrix.decompose(
        ref.current.position,
        ref.current.quaternion,
        ref.current.scale
      );
      ref.current.scale.setScalar(scale);
      
      previousTransformRef.current = handTransform.clone();
      return ref.current.matrix.clone();
    }
    frameInManip.current++;
    if (frameInManip.current === 1) {
      frozenHandQuatRef.current = localHandQuat.clone();
    }
    prevQuat = frozenHandQuatRef.current.clone();
    
    ref.current.position.setFromMatrixPosition(negatedMat4);

    const tmpObj = scene.getObjectByName("tmpPinchObj");
    const handOrientObj = scene.getObjectByName("handOrientObj");
    handOrientObj.position.copy(localHandPos);
    handOrientObj.quaternion.copy(localHandQuat);
    let influence = 1;
    // in case of local giver & orient toward receiver (remote)
    const remoteManipPos = new Vector3(
      manipulationObjRef?.current?.[12],
      manipulationObjRef?.current?.[13],
      manipulationObjRef?.current?.[14]
    );
    // in case of local giver & orient toward giver (local)
    const localManipPos = player.position.clone();

    tmpObj.position.copy(localHandPos.clone());
    tmpObj.lookAt(localManipPos);
    const tmpObjQuatLocal = tmpObj.quaternion.clone();
    tmpObj.lookAt(remoteManipPos);
    const tmpObjQuatRemote = tmpObj.quaternion.clone();
    influence = MathUtils.smoothstep(
      distanceBetweenHands,
      0.4,
      distanceToTriggerManip
    );

    if (frameInManip.current > 1) {
      ref.current.quaternion.copy(previousManipQuatGiverRef.current.clone());
    }
    const invertedPrevQuat = prevQuat.clone().invert();

    ref.current.applyQuaternion(invertedPrevQuat);
    ref.current.applyQuaternion(frozenHandQuatRef.current.clone());
    previousManipQuatGiverRef.current = ref.current.quaternion.clone();
    const quatManipToLocal = new Quaternion().slerpQuaternions(
      tmpObjQuatLocal,
      ref.current.quaternion.clone(),
      influence
    );
    // console.log(quatManipToLocal.length());
    const quatManipToRemote = new Quaternion().slerpQuaternions(
      tmpObjQuatRemote,
      ref.current.quaternion.clone(),
      influence
    );
    const manipToGiver =
      isGiver &&
      ["towardGiver", "towardBoth"].includes(objectOrientation.level);
    if (manipToGiver) {
      ref.current.quaternion.copy(quatManipToLocal.clone());
    } else {
      ref.current.quaternion.copy(quatManipToRemote.clone());
    }
    ref.current.position.setFromMatrixPosition(copy.matrix);
    const newRemoteMatrix = ref.current.matrix.clone();
    if (objectOrientation.level === "towardBoth") {
      newRemoteMatrix.compose(
        ref.current.position.clone(),
        quatManipToRemote,
        new Vector3(scale, scale, scale)
      );
    }
    ref.current.scale.setScalar(scale);
    previousTransformRef.current = handTransform.clone();
    return newRemoteMatrix;
  }, [
    collideObjectParent,
    handMeshModel,
    handedness,
    isGiver,
    isReceiver,
    objectOrientation.level,
    player.position,
    ref,
    remoteController?.distanceToLocalHand,
    scene,
    userType,
  ]);

  useFrame(() => {
    if (props.goalReached && ref.current) {
      return;
    }
    if (!pinched) {
      previousTransformRef.current = undefined;
      previousHandedness.current = undefined;
      frameInManip.current = 0;
      return;
    }
    const newRemoteMatrix = getNewTransformForRemote();

    
    // update parents, update children:
    ref.current.updateWorldMatrix(false, true);
    previousHandedness.current = handedness;

    sendPinchData({
      pinchStart: props.pinchStart,
      matrix: newRemoteMatrix.elements,
      name: ref.current.name,
      timestamp: getServerDateNow(),
    });
  });
}
