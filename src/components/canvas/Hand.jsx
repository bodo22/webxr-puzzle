import React from "react";
import { OculusHandModel } from "three-stdlib";
import { extend, createPortal, useFrame, useThree } from "@react-three/fiber";

import useSocket, { useDebug } from "@/stores/socket";
import useInteracting from "@/stores/interacting";

import Axes from "@/components/canvas/debug/Axes";
import HandCollisionBody from "./HandCollisionBody";

extend({ OculusHandModel });

function JointManager({ target, handModelRef, handedness }) {
  const xrManager = useThree((state) => state.gl.xr);

  const { freezeHand } = useSocket((state) => state.level);

  const isPinchingObject = !!useInteracting(
    (state) => state.pinchedObjects[handedness]
  );

  const isBvhColliding = !!useInteracting(
    (state) => state.bvhColliding[handedness]
  );

  const freezeHandDuringGrab = isPinchingObject && freezeHand === "onGrab";
  const freezeHandDuringCollision =
    isBvhColliding && freezeHand === "onCollision";

  useFrame((_, __, frame) => {

    const { controller } = handModelRef.current;
    const referenceSpace = xrManager.getReferenceSpace();
    if (referenceSpace && target.inputSource && controller) {
      const wristInputjoint = target.inputSource.hand.get("wrist");
      const wristJointPose = frame.getJointPose(
        wristInputjoint,
        referenceSpace
      );
      if (!wristJointPose) {
        return;
      }

      const refSpaceToWrist = referenceSpace.getOffsetReferenceSpace(
        wristJointPose.transform
      );
      const h = target.hand;
      h.matrix.fromArray(wristJointPose.transform.matrix);
      h.matrix.decompose(h.position, h.quaternion, h.scale);
      h.updateMatrix();

      if (freezeHandDuringGrab || freezeHandDuringCollision) {
        return;
      } else {
        for (const inputjoint of target.inputSource.hand.values()) {
          // TODO: perf: replace getJointPose with fillPoses
          const jointPose = frame.getJointPose(inputjoint, refSpaceToWrist);
          // The transform of this joint will be updated with the joint pose on each frame
          const joint = controller.joints[inputjoint.jointName];

          if (jointPose !== null) {
            const joint = controller.joints[inputjoint.jointName];
            joint.matrix.fromArray(jointPose.transform.matrix);
            joint.matrix.decompose(
              joint.position,
              joint.quaternion,
              joint.scale
            );
            joint.jointRadius = jointPose.radius;
          }
          joint.visible = jointPose !== null;
        }
      }
    }
  });

  return null;
}

const params = new URL(document.location).searchParams;
const fakeLocalToggle = params.get("fakeLocalToggle") === "true";

export default function Hand({ target, handedness, local, userId }) {
  const userIdSelf = useSocket((state) => state.userId);
  const fakeLocal = fakeLocalToggle && userId === userIdSelf;
  const handModelRef = React.useRef();
  const { hands } = useDebug();
  const setSkinnedMesh = useInteracting((state) => state.setSkinnedMesh);
  const skinnedMesh = useInteracting(
    (state) => state.skinnedMeshes[handedness]
  );
  const { hand } = target;
  const pinchedObject = useInteracting(
    (state) => state.pinchedObjects[handedness]
  );
  React.useLayoutEffect(() => {
    const handModel = handModelRef.current;
    if (handModel) {
      function childAdded(event) {
        const mesh = event.child.getObjectByProperty("type", "SkinnedMesh");
        mesh.material.transparent = true;
        if (local) {
          setSkinnedMesh(handedness, mesh);
        } else {
          hand.parent.skinnedMesh = mesh;
        }
        if (local && userId === "AR") {
          // to hide hands in AR
          mesh.material.colorWrite = false;
          mesh.material.depthWrite = false;
          mesh.material.depthTest = false;
        }
      }
      handModel.addEventListener("childadded", childAdded);
      return () => {
        handModel.removeEventListener("childadded", childAdded);
      };
    }
  }, [local, userId, setSkinnedMesh, handedness, hand]);

  React.useEffect(() => {
    if (!skinnedMesh) {
      return;
    }
    if (pinchedObject) {
      skinnedMesh.material.opacity = 0.15;
    } else {
      skinnedMesh.material.opacity = 1;
    }
  }, [skinnedMesh, pinchedObject]);

  const setHand = useInteracting((state) => state.setHand);
  React.useEffect(() => {
    if (local || fakeLocal) {
      setHand(handedness, hand);
    }
    return () => {
      if (local || fakeLocal) {
        setHand(handedness, undefined);
      }
    };
  }, [setHand, hand, handedness, local, fakeLocal]);

  return (
    <>
      {createPortal(<oculusHandModel ref={handModelRef} args={[hand]} />, hand)}
      {hands && local && (
        <Axes model={handModelRef.current?.motionController} />
      )}
      {local && (
        <>
          <JointManager
            target={target}
            handModelRef={handModelRef}
            handedness={handedness}
          />
        </>
      )}
      {((handedness === "right" && local) || fakeLocal) && (
        <group name={`hand-collision-body-${handedness}`}>
          <HandCollisionBody
            handModelRef={handModelRef}
            handedness={handedness}
          />
        </group>
      )}
    </>
  );
}

// Hand.whyDidYouRender = true;
