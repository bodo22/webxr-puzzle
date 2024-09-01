import { MathUtils } from "three";

export class TestQuaternion {
  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  dot(q) {
    return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
  }

  length() {
    return Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
  }

  normalize() {
    const len = this.length();
    if (len === 0) return this;

    this.x /= len;
    this.y /= len;
    this.z /= len;
    this.w /= len;

    return this;
  }

  multiplyScalar(scalar) {
    return new TestQuaternion(
      this.x * scalar,
      this.y * scalar,
      this.z * scalar,
      this.w * scalar
    );
  }

  add(q) {
    return new TestQuaternion(
      this.x + q.x,
      this.y + q.y,
      this.z + q.z,
      this.w + q.w
    );
  }

  negate() {
    return new TestQuaternion(-this.x, -this.y, -this.z, -this.w);
  }

  slerp(q, t, lockShortestPath = true) {
    let cosTheta = this.dot(q);

    // If locking to the initially determined path, do not negate the quaternion.
    if (!lockShortestPath && cosTheta < 0.0) {
      q = q.negate();
      cosTheta = -cosTheta;
    }

    // If quaternions are nearly identical, use linear interpolation to avoid division by zero
    if (cosTheta > 0.9995) {
      return this.multiplyScalar(1 - t)
        .add(q.multiplyScalar(t))
        .normalize();
    }

    // Calculate the angle between the quaternions
    const theta = Math.acos(cosTheta);
    console.log(MathUtils.radToDeg(theta));
    const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);

    // Compute the coefficients
    const a = Math.sin((1 - t) * theta) / sinTheta;
    const b = Math.sin(t * theta) / sinTheta;

    // Perform the interpolation
    const qA = this.multiplyScalar(a);
    const qB = q.multiplyScalar(b);

    return qA.add(qB);
  }
}

// Example usage:

const q1 = new TestQuaternion(0.707, 0, -0.707, 0); // Example quaternion 1
const q2 = new TestQuaternion(0, 0, 0, 1); // Example quaternion 2

// Create a flag to lock the initial path decision
let lockShortestPath = false;

// SLERP between q1 and q2 with t = 0.5 (halfway) without locking the shortest path
let t = 0.5;
let resultQuat = q1.slerp(q2, t, lockShortestPath);

console.log(
  `Result Quaternion (without lock): x=${resultQuat.x}, y=${resultQuat.y}, z=${resultQuat.z}, w=${resultQuat.w}`
);

// Example when the initial path should be locked
lockShortestPath = true;
resultQuat = q1.slerp(q2, t, lockShortestPath);

console.log(
  `Result Quaternion (with lock): x=${resultQuat.x}, y=${resultQuat.y}, z=${resultQuat.z}, w=${resultQuat.w}`
);
