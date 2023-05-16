import * as THREE from "three";

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
    const geometry = new THREE.SphereGeometry(0.05, 32, 16);
    const material = new THREE.MeshStandardMaterial();
    this.blob = new THREE.Mesh(geometry, material);
    this.blob.visible = false;

    this.grip.userData.name = "grip";
    this.controller.userData.name = "controller";
    this.hand.userData.name = "hand";

    // this.visible = false
    this.add(this.controller, this.grip, this.hand);

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

  update(joints, fakeInputSource, fidelity) {
    switch (fidelity?.level) {
      case "none": {
        this.hand.visible = false;
        this.blob.visible = false;
        break;
      }
      case "blob": {
        const matrixArray = joints?.[fidelity.blobJoint]?.transformMatrix;
        if (matrixArray) {
          const b = this.blob;
          b.matrix.fromArray(matrixArray);
          b.matrix.decompose(b.position, b.rotation, b.scale);
        } else {
          console.warn("matrixArray not defined", { joints, fidelity });
        }
        this.hand.visible = false;
        this.blob.visible = true;
        break;
      }
      case "gesture": {
        console.log("TODO gesture!");
        this.blob.visible = false;
        this.hand.visible = true;
        break;
      }
      case "virtual": {
        this.updateVirtual(joints, fakeInputSource);
        this.blob.visible = false;
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
    this.blob.dispose();
  }
}
