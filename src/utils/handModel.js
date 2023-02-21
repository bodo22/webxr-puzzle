import { Matrix4, Quaternion, Vector3 } from "three";

export function getHandPosition(hand) {
  const indexTip = hand.bones.find(
    (bone) => bone.jointName === "index-finger-tip"
  );
  const thumbTip = hand.bones.find((bone) => bone.jointName === "thumb-tip");

  const position = indexTip
    .getWorldPosition(new Vector3())
    .add(thumbTip.getWorldPosition(new Vector3()))
    .multiplyScalar(0.5);

  return position;
}

export function getHandTransform(hand) {
  const quaternion = new Quaternion();
  getHandRotationMatrix(hand).decompose(
    new Vector3(),
    quaternion,
    new Vector3()
  );
  const position = getHandPosition(hand);

  return new Matrix4().compose(position, quaternion, new Vector3(1, 1, 1));
}

export function getHandRotationMatrix(hand) {
  const indexTip = hand.bones.find(
    (bone) => bone.jointName === "index-finger-phalanx-proximal"
  );
  const thumbTip = hand.bones.find(
    (bone) => bone.jointName === "thumb-phalanx-proximal"
  );
  const indexKnuckle = hand.bones.find(
    (bone) => bone.jointName === "index-finger-metacarpal"
  );
  const pinkyKnuckle = hand.bones.find(
    (bone) => bone.jointName === "pinky-finger-metacarpal"
  );

  const z = thumbTip
    .getWorldPosition(new Vector3())
    .sub(indexTip.getWorldPosition(new Vector3()))
    .normalize();

  const y = indexKnuckle
    .getWorldPosition(new Vector3())
    .sub(pinkyKnuckle.getWorldPosition(new Vector3()))
    .normalize();

  const x = new Vector3().crossVectors(z, y).negate();

  const y2 = new Vector3().crossVectors(x, z).negate();

  return new Matrix4().makeBasis(x, y2, z);
}
