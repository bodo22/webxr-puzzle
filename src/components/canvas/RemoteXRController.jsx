import * as THREE from 'three'

export default class XRController extends THREE.Group {
  constructor(index) {
    super()

    this.index = index
    this.webXRController = new THREE.WebXRController()
    this.controller = this.webXRController.getTargetRaySpace()
    this.grip = this.webXRController.getGripSpace()
    this.hand = this.webXRController.getHandSpace()

    this.grip.userData.name = 'grip'
    this.controller.userData.name = 'controller'
    this.hand.userData.name = 'hand'
    const x = 0.05
    const offset = -0.27
    this.position.setX(index ? x + offset : -x + offset)
    // this.position.setZ(4.4)
    // this.position.setY(-1.8)
    this.position.setZ(-0.4)
    this.position.setY(-0.2)

    // this.visible = false
    this.add(this.controller, this.grip, this.hand)

    this._onConnected = this._onConnected.bind(this)
    this._onDisconnected = this._onDisconnected.bind(this)

    this.controller.addEventListener('connected', this._onConnected)
    this.controller.addEventListener('disconnected', this._onDisconnected)
  }

  _onConnected(event) {
    if (event.fake) return

    this.visible = true
    this.inputSource = event.data
    this.dispatchEvent(event)
  }

  _onDisconnected(event) {
    if (event.fake) return

    this.visible = false
    this.dispatchEvent(event)
  }

  dispose() {
    this.controller.removeEventListener('connected', this._onConnected)
    this.controller.removeEventListener('disconnected', this._onDisconnected)
  }
}