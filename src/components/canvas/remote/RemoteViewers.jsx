import React from "react";
import useSocket, { useLog, useUser, useUsers } from "@/stores/socket";
import { Box3, Matrix4, Vector3 } from "three";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { formatRgb } from "culori";
import { Text } from "@react-three/drei";
import usePlayerTransform from "../hooks/usePlayerTransform";
import useInteracting from "@/stores/interacting";
import socket from "@/stores/socketConnection";

function RemoteViewer({
  color,
  tableY,
  setTableY,
  userId,
  index,
  defaultTableHeight,
  levelSuccess,
}) {
  const playerTransform = usePlayerTransform({ index, userId });
  const userIdSelf = useSocket((state) => state.userId);
  const local = userIdSelf === userId;
  const { type: userType } = useUser();
  const { glb } = useSocket((state) => state.level);
  const pinched = useInteracting((state) => state.pinchedObjects.right) === glb && glb;
  const logPhase1 = local && userType === "giver"; // reach & grasp
  const logPhase4 = local && userType === "receiver" && pinched; // end of handover
  const log = useLog();
  const scene = useThree((state) => state.scene);
  const boxRef = React.useRef();
  const ref = React.useRef();
  const motionController = useInteracting(
    (state) => state.motionControllers.right
  );
  const [phaseOneLogSent, setPhaseOneLogSent] = React.useState(false);
  const [phaseFourLogSent, setPhaseFourLogSent] = React.useState(false);
  const [remoteTableY, setRemoteTableY] = React.useState(defaultTableHeight);
  React.useEffect(() => {
    ref.current.geometry.computeBoundingBox();
    boxRef.current = new Box3();
  }, []);

  const resetLogsSent = React.useCallback(() => {
    setPhaseOneLogSent(false);
    setPhaseFourLogSent(false);
  }, []);

  React.useEffect(() => {
    if (glb) {
      // reset sending events
      resetLogsSent();
    }
  }, [glb, resetLogsSent]);

  React.useEffect(() => {
    function handleReset() {
      resetLogsSent();
      setTableY(defaultTableHeight);
      setRemoteTableY(defaultTableHeight);
    }
    function handleRecenter(eventUserId) {
      if (local) {
        setTableY(defaultTableHeight);
      } else if (eventUserId === userId) {
        setRemoteTableY(defaultTableHeight);
      }
    }
    socket.on("reset", handleReset);
    socket.on("recenter", handleRecenter);
    return () => {
      socket.off("reset", handleReset);
      socket.off("recenter", handleRecenter);
    };
  }, [defaultTableHeight, local, resetLogsSent, setTableY, userId]);

  useFrame(() => {
    if (boxRef.current) {
      boxRef.current
      .copy(ref.current.geometry.boundingBox)
      .applyMatrix4(ref.current.matrixWorld);
    }
    
    if (local && motionController?.bones?.[11]) {
      const wristBone = new Vector3();
      motionController.bones[11].getWorldPosition(wristBone);
      if (tableY > wristBone.y - 0.03) {
        setTableY(wristBone.y - 0.03);
      }
    }
    const pinchObject = scene.getObjectByName(glb);
    // if levelSuccess is true or pinchObject doesnt exist, return
    if (levelSuccess || !pinchObject) {
      return;
    }
    // if the box has not been set by the hand height yet, do not check
    // if the hand is inside the box
    if (ref.current.matrixWorld.elements[13] > defaultTableHeight - 1) {
      return;
    }
    // 9 = index finger tip
    // 11 = middle finger knuckle (middle-finger-phalanx-proximal)
    const boneIndex = 11;
    if (local && motionController?.bones?.[boneIndex]) {
      const indexFingerTipBone = new Vector3();
      motionController.bones[boneIndex].getWorldPosition(indexFingerTipBone);
      const containsPoint = boxRef.current.containsPoint(indexFingerTipBone);
      if (logPhase1 && !containsPoint && !phaseOneLogSent) {
        log({ type: "beginReach" });
        setPhaseOneLogSent(true);
      }

      if (logPhase4 && containsPoint && !phaseFourLogSent && !levelSuccess) {
        log({ type: "endOfHandover" });
        setPhaseFourLogSent(true);
        const event = {
          type: "goalReached",
          handedness: "right",
        };
        pinchObject.dispatchEvent(event);
      }
    }
  });

  React.useEffect(() => {
    function handleHandData(handData) {
      if (handData.userId !== userId) return;
      if (!local && handData?.joints?.right?.[0]?.transformMatrix?.[13]) {
        const currY = handData?.joints?.right?.[0]?.transformMatrix?.[13];
        if (remoteTableY > currY - 0.03) {
          setRemoteTableY(currY - 0.03);
        }
      }
    }
    socket.on("handData", handleHandData);
    return () => {
      socket.off("handData", handleHandData);
    };
  }, [local, remoteTableY, userId]);

  return (
    <>
      {!local && (
        <mesh name={`${userId}-head`} visible={false}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color={formatRgb(color)} />
        </mesh>
      )}
      <group {...playerTransform}>
        <group position={[0, local ? tableY : remoteTableY, -0.2]}>
          <mesh>
            <boxGeometry args={[0.7, 0.01, 0.3]} />
            <meshStandardMaterial color={formatRgb(color)} />
          </mesh>
          <mesh ref={ref} position={[0, 0.05, 0]}>
            <boxGeometry args={[0.7, 0.1, 0.3]} />
            <meshStandardMaterial
              color={formatRgb(color)}
              transparent={true}
              opacity={0.5}
            />
          </mesh>
        </group>
        <group position={[0, 0.3, 0]} visible={false}>
          <Text
            color={formatRgb(color)}
            material-transparent={true}
            material-opacity={0.6}
            anchorX="center"
            anchorY="middle"
            fontSize={0.2}
          >
            {userId}
          </Text>
        </group>
      </group>
    </>
  );
}

export default function RemoteViewers(props) {
  const users = useUsers();
  const remoteUsersRef = React.useRef();
  const socket = useSocket((state) => state.socket);
  const scene = useThree((state) => state.scene);
  React.useEffect(() => {
    function handleViewerData(viewerData) {
      if (remoteUsersRef.current) {
        const obj = remoteUsersRef.current.children
          .find((child) => child.name === `${viewerData.userId}-viewer`)
          ?.children?.find((c) => c.name === `${viewerData.userId}-head`);
        if (obj) {
          obj.visible = !props.levelSuccess;
          obj.matrix = new Matrix4();
          obj.matrix.elements = viewerData.transformMatrix;
          obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
          obj.updateWorldMatrix(false, true);
        }
      }
    }
    socket.on("viewerData", handleViewerData);
    return () => {
      socket.off("viewerData", handleViewerData);
    };
  }, [socket, props.levelSuccess]);
  return createPortal(
    <group ref={remoteUsersRef}>
      {users.reduce((acc, { userId, color }, index) => {
        const key = `${userId}-viewer`;
        acc.push(
          <group key={key} name={key}>
            <RemoteViewer {...props} userId={userId} color={color} />
          </group>
        );
        // }
        return acc;
      }, [])}
    </group>,
    scene
  );
}
