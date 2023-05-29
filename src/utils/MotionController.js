import { Matrix3, Vector3 } from "three";
import * as handModelUtils from "./handModel";
import { OBB } from "three-stdlib";

export class HandMotionController {
  constructor(target) {
    this.target = target;
  }

  get transform() {
    return handModelUtils.getHandTransform(this.target);
  }

  get position() {
    return handModelUtils.getHandPosition(this.target);
  }

  jointWorldPositionFor(jointName) {
    const joint = this.target.bones.find(
      (bone) => bone.jointName === jointName
    );
    return joint.getWorldPosition(new Vector3())
  }

  intersectsOBB(obb) {
    const matrix = handModelUtils.getHandRotationMatrix(this.target);

    const indexTip = this.target.bones.find(
      (bone) => bone.jointName === "index-finger-tip"
    );
    const thumbTip = this.target.bones.find(
      (bone) => bone.jointName === "thumb-tip"
    );

    const thumbOBB = new OBB(
      indexTip.getWorldPosition(new Vector3()),
      new Vector3(0.05, 0.05, 0.05).divideScalar(2),
      new Matrix3().setFromMatrix4(matrix)
    );
    const indexOBB = new OBB(
      thumbTip.getWorldPosition(new Vector3()),
      new Vector3(0.05, 0.05, 0.05).divideScalar(2),
      new Matrix3().setFromMatrix4(matrix)
    );

    return (
      obb.intersectsOBB(thumbOBB, Number.EPSILON) &&
      obb.intersectsOBB(indexOBB, Number.EPSILON)
    );
  }
}

export class TriggerMotionController {
  constructor(target) {
    this.target = target;
  }

  get transform() {
    return this.target.matrixWorld.clone();
  }

  get position() {
    return this.target.getWorldPosition(new Vector3());
  }

  updateObb() {
    this.obb.applyMatrix4(this.transform);
  }

  intersectsOBB(obb) {
    const targetOBB = new OBB(
      undefined,
      new Vector3(0.05, 0.05, 0.05).divideScalar(2)
    ).applyMatrix4(this.transform);
    return obb.intersectsOBB(targetOBB, Number.EPSILON);
  }
}
