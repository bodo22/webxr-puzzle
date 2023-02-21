import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { BufferGeometry, Vector3 } from "three";

export default function Axes({ model }) {
  useFrame(() => {
    if (!model || model?.bones.length === 0) {
      return;
    }

    const indexTip = model.bones.find(
      (bone) => bone.jointName === "index-finger-tip"
    );
    const thumbTip = model.bones.find((bone) => bone.jointName === "thumb-tip");

    const indexJoint = model.bones.find(
      (bone) => bone.jointName === "index-finger-phalanx-proximal"
    );
    const thumbJoint = model.bones.find(
      (bone) => bone.jointName === "thumb-phalanx-proximal"
    );

    const position = indexTip
      .getWorldPosition(new Vector3())
      .add(thumbTip.getWorldPosition(new Vector3()))
      .multiplyScalar(0.5);

    const indexKnuckle = model.bones.find(
      (bone) => bone.jointName === "index-finger-metacarpal"
    );
    const pinkyKnuckle = model.bones.find(
      (bone) => bone.jointName === "pinky-finger-metacarpal"
    );

    indexTipRef.current?.position.copy(
      indexTip.getWorldPosition(new Vector3())
    );
    indexJointRef.current?.position.copy(
      indexJoint.getWorldPosition(new Vector3())
    );
    thumbTipRef.current?.position.copy(
      thumbTip.getWorldPosition(new Vector3())
    );
    thumbJointRef.current?.position.copy(
      thumbJoint.getWorldPosition(new Vector3())
    );
    indexKnuckleRef.current?.position.copy(
      indexKnuckle.getWorldPosition(new Vector3())
    );
    pinkyKnuckleRef.current?.position.copy(
      pinkyKnuckle.getWorldPosition(new Vector3())
    );
    positionRef.current?.position.copy(position.clone());

    const z = thumbJoint
      .getWorldPosition(new Vector3())
      .sub(indexJoint.getWorldPosition(new Vector3()))
      .normalize();

    const zPoints = [position.clone(), position.clone().add(z)];
    const zGeom = new BufferGeometry().setFromPoints(zPoints);
    zRef.current.geometry = zGeom;

    const y = indexKnuckle
      .getWorldPosition(new Vector3())
      .sub(pinkyKnuckle.getWorldPosition(new Vector3()))
      .normalize();

    const x = new Vector3().crossVectors(z, y).negate();

    const xPoints = [position.clone(), position.clone().add(x.clone())];
    const xGeom = new BufferGeometry().setFromPoints(xPoints);
    xRef.current.geometry = xGeom;

    const y2 = new Vector3().crossVectors(x, z).negate();

    const y2Points = [position.clone(), position.clone().add(y2.clone())];
    const y2Geom = new BufferGeometry().setFromPoints(y2Points);
    y2Ref.current.geometry = y2Geom;

    const distance = indexTip
      .getWorldPosition(new Vector3())
      .sub(thumbTip.getWorldPosition(new Vector3()));

    thumbTipCollidingRef.current?.position.copy(
      thumbTip
        .getWorldPosition(new Vector3())
        .add(new Vector3().copy(distance.clone().divideScalar(20)))
    );

    indexTipCollidingRef.current?.position.copy(
      indexTip
        .getWorldPosition(new Vector3())
        .sub(new Vector3().copy(distance.clone().divideScalar(20)))
    );
  });

  const thumbTipRef = useRef(null);
  const thumbJointRef = useRef(null);
  const thumbTipCollidingRef = useRef(null);
  const indexTipRef = useRef(null);
  const indexJointRef = useRef(null);
  const indexTipCollidingRef = useRef(null);
  const indexKnuckleRef = useRef(null);
  const pinkyKnuckleRef = useRef(null);
  const positionRef = useRef(null);

  const zRef = useRef();
  const y2Ref = useRef();
  const xRef = useRef();

  return (
    <group>
      <mesh ref={thumbTipRef}>
        <sphereGeometry args={[0.005]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      <mesh ref={thumbJointRef}>
        <sphereGeometry args={[0.01]} />
        <meshBasicMaterial color="brown" />
      </mesh>
      <mesh ref={thumbTipCollidingRef}>
        <sphereGeometry args={[0.01]} />
        <meshBasicMaterial color="orange" />
      </mesh>
      <mesh ref={indexTipRef}>
        <sphereGeometry args={[0.005]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      <mesh ref={indexJointRef}>
        <sphereGeometry args={[0.01]} />
        <meshBasicMaterial color="brown" />
      </mesh>
      <mesh ref={indexTipCollidingRef}>
        <sphereGeometry args={[0.01]} />
        <meshBasicMaterial color="orange" />
      </mesh>
      <mesh ref={indexKnuckleRef}>
        <sphereGeometry args={[0.01]} />
        <meshBasicMaterial color="green" />
      </mesh>
      <mesh ref={pinkyKnuckleRef}>
        <sphereGeometry args={[0.01]} />
        <meshBasicMaterial color="green" />
      </mesh>
      <mesh ref={positionRef}>
        <sphereGeometry args={[0.005]} />
        <meshBasicMaterial color="white" />
      </mesh>

      <line ref={zRef}>
        <lineBasicMaterial color="blue" />
      </line>
      <line ref={y2Ref}>
        <lineBasicMaterial color="green" />
      </line>
      <line ref={xRef}>
        <lineBasicMaterial color="red" />
      </line>
    </group>
  );
}
