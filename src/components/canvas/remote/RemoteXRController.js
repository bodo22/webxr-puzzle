import * as THREE from "three";
import fistOverride from "@/assets/handData/gesture-fist-1.json";
import pointOverride from "@/assets/handData/gesture-point-1.json";
import defaultOverride from "@/assets/handData/gesture-default-1.json";
import pinchOverride from "@/assets/handData/gesture-pinch-1.json";
import loadGltf from "@/utils/loadGltf.js";

const jointPosesOverrides = {
  fist: fistOverride[0].joints,
  point: pointOverride[0].joints,
  default: defaultOverride[0].joints,
  pinch: pinchOverride[0].joints,
};

let pointMesh;

loadGltf("models/arrow.glb", (gltf) => {
  gltf.scene.rotation.x = THREE.MathUtils.degToRad(-90); // only works for finger tip
  gltf.scene.scale.set(0.15, 0.15, 0.15);
  pointMesh = gltf.scene;
});

export default class XRController extends THREE.Group {
  constructor(data, handedness) {
    super();

    this.userId = data.userId;
    this.data = data;
    this.handedness = handedness;
    this.webXRController = new THREE.WebXRController();
    this.controller = this.webXRController.getTargetRaySpace();
    this.grip = this.webXRController.getGripSpace();
    this.hand = this.webXRController.getHandSpace();

    const sphere = new THREE.SphereGeometry(0.05, 32, 16);
    const material = new THREE.MeshStandardMaterial();
    const box = new THREE.BoxGeometry(0.07, 0.07, 0.07);
    this.blobs = {
      pinch: new THREE.Mesh(sphere, material),
      default: new THREE.Mesh(box, material),
      point: pointMesh.clone(),
    };

    this.blobGroup = new THREE.Group();
    Object.values(this.blobs).forEach((mesh) => {
      mesh.visible = false;
      this.blobGroup.add(mesh);
    });
    this.add(this.blobGroup);

    this.grip.userData.name = "grip";
    this.controller.userData.name = "controller";
    this.hand.userData.name = "hand";

    // this.visible = false
    this.add(this.controller, this.grip, this.hand);

    this.initialMatrix = new THREE.Matrix4();
    this.initialMatrix.copy(this.hand.matrix);

    this._onConnected = this._onConnected.bind(this);
    this._onDisconnected = this._onDisconnected.bind(this);

    this.controller.addEventListener("connected", this._onConnected);
    this.controller.addEventListener("disconnected", this._onDisconnected);
  }

  _onConnected(event) {
    if (event.fake) return;

    this.visible = true;
    this.inputSource = event.data;
    this.dispatchEvent(event);
  }

  _onDisconnected(event) {
    if (event.fake) return;

    this.visible = false;
    this.dispatchEvent(event);
  }

  updateVirtual(joints, fakeInputSource) {
    const fakeFrame = {
      session: { visibilityState: "visible" },
      getPose: () => null,
      getJointPose: (inputjoint) => {
        const jointPose = joints?.[inputjoint?.jointName];
        if (!jointPose) {
          return null;
        }
        return {
          transform: { matrix: jointPose.transformMatrix },
          radius: jointPose.radius,
        };
      },
    };
    const fakeReferenceSpace = "local";
    this.lastXRUpdate = Date.now();
    this.webXRController.update(fakeInputSource, fakeFrame, fakeReferenceSpace);
  }

  update(joints, fakeInputSource, fidelity, gesture) {
    Object.values(this.blobs).forEach((mesh) => {
      mesh.visible = false;
    });
    this.hand.visible = false;
    const fidelityChange = this.currentFidelity?.level !== fidelity?.level;
    this.currentFidelity = fidelity;
    switch (fidelity?.level) {
      case "none": {
        break;
      }
      case "blob": {
        const matrixArray = joints?.[fidelity.blobJoint]?.transformMatrix;
        if (matrixArray) {
          const b = this.blobGroup;
          b.matrix.fromArray(matrixArray);
          b.matrix.decompose(b.position, b.quaternion, b.scale);
          this.blobs[gesture].visible = true;
        } else {
          console.warn("matrixArray not defined", { joints, fidelity });
        }
        break;
      }
      case "gesture": {
        if (jointPosesOverrides[gesture]) {
          const overrideJoints = jointPosesOverrides[gesture][this.handedness];
          this.updateVirtual(overrideJoints, fakeInputSource);
          const h = this.hand;
          h.matrix.fromArray(joints.wrist.transformMatrix);
          h.matrix.decompose(h.position, h.quaternion, h.scale);
          h.updateMatrixWorld(true);
        } else {
          console.warn("gesture unknown", gesture, this.hand);
        }
        this.hand.visible = true;
        break;
      }
      case "virtual": {
        this.updateVirtual(joints, fakeInputSource);
        if (fidelityChange) {
          const h = this.hand;
          h.matrix.copy(this.initialMatrix);
          h.matrix.decompose(h.position, h.quaternion, h.scale);
          h.updateMatrixWorld(true);
        }
        this.hand.visible = true;
        break;
      }
      default: {
        console.warn("fidelity unknown", joints, fidelity);
        break;
      }
    }
  }

  dispose() {
    this.controller.removeEventListener("connected", this._onConnected);
    this.controller.removeEventListener("disconnected", this._onDisconnected);
    Object.values(this.blobs).forEach((mesh) => {
      mesh.dispose();
    });
    this.blobGroup.dispose();
  }
}
