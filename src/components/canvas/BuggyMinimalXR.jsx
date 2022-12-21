import * as React from 'react'
import * as THREE from 'three'
import create, { EqualityChecker, GetState, SetState, StateSelector, UseBoundStore } from 'zustand'
import { useThree } from '@react-three/fiber'
import { useIsomorphicLayoutEffect } from '@react-three/xr'

const colors = { left: 0xff0000, right: 0x0000ff }

class TestEvents {
  constructor(wrapper) {
    this.wrapper = wrapper
    return this
  }

  async wait(waitTime) {
    await new Promise((resolve) => setTimeout(resolve, waitTime))
    return this
  }

  async event(event) {
    this.wrapper.dispatchEvent(event)
    return this
  }
}

const events = {
  left: [
    { wait: 500 },
    { type: 'connected' },
    // { wait: 2000 },
    // { type: 'disconnected' },
    // // { wait: 1 },
    // { type: 'connected' },
    // { wait: 1000 },
    // { type: 'disconnected' },
    // { type: 'connected' },
    // { wait: 1000 },
    // { type: 'disconnected' },
    // { type: 'connected' },
  ],
  right: [
    { wait: 500 },
    { type: 'connected' },
    // { wait: 1000 },
    // { type: 'disconnected' },
    // { type: 'connected' },
    // { wait: 1000 },
    // { wait: 1000 },
    // { type: 'disconnected' },
    // { type: 'connected' },
    // { wait: 1000 },
    // { type: 'disconnected' },
    // { type: 'connected' },
  ],
}

class Box extends THREE.Mesh {
  constructor(boxGeo, material, index) {
    super(boxGeo, material)
    this.index = index

    // setInterval(() => {
    //   setTimeout(() => {
    //     this.dispatchEvent({ type: 'connected' })
    //     setTimeout(() => {
    //       this.dispatchEvent({ type: 'disconnected' })
    //     }, 1000 + this.index * 50)
    //   }, 1000 + this.index * 50)
    // }, 3000 + 1000 * this.index)
  }

  async startEvents() {
    const testEvents = new TestEvents(this)

    for (const event of events[this.index]) {
      //   console.log(this.index, event)
      if (event.wait) {
        await testEvents.wait(event.wait)
      } else {
        await testEvents.event(event)
      }
    }
  }
}

class FakeXRController extends THREE.Group {
  constructor(index, gl) {
    super()

    this.color = `color: rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
      Math.random() * 255,
    )})`

    this.index = index
    this.material = new THREE.MeshBasicMaterial({ color: colors[this.index] })

    this.boxGeo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5)
    this.box = new Box(this.boxGeo, this.material, this.index)
    this.box.position.setY(-3)

    this.coneGeo = new THREE.ConeBufferGeometry(0.5, 0.5, 10)
    this.cone = new THREE.Mesh(this.coneGeo, this.material)
    this.cone.position.setY(0)

    this.icosahedronGeo = new THREE.IcosahedronBufferGeometry(0.5)
    this.icosahedron = new THREE.Mesh(this.icosahedronGeo, this.material)
    this.icosahedron.position.setY(3)

    this.position.setZ(-5)
    this.position.setX(this.index === 'left' ? -2 : 2)

    this.cone.userData.name = 'grip'
    this.box.userData.name = 'controller'
    this.icosahedron.userData.name = 'hand'

    this.visible = false
    this.add(this.box, this.cone, this.icosahedron)

    this._onConnected = this._onConnected.bind(this)
    this._onDisconnected = this._onDisconnected.bind(this)

    this.box.addEventListener('connected', this._onConnected)
    this.box.addEventListener('disconnected', this._onDisconnected)

    this._addedCallback = this._addedCallback.bind(this)
    this._removedCallback = this._removedCallback.bind(this)
    // this._addedCallbackHand = this._addedCallbackHand.bind(this)
    // this._removedCallbackHand = this._removedCallbackHand.bind(this)
    // this._addedCallbackGrip = this._addedCallbackGrip.bind(this)
    // this._removedCallbackGrip = this._removedCallbackGrip.bind(this)
    // this._addedCallbackController = this._addedCallbackController.bind(this)
    // this._removedCallbackController = this._removedCallbackController.bind(this)

    this.addEventListener('added', this._addedCallback)
    this.addEventListener('removed', this._removedCallback)

    // this.box.addEventListener('added', this._addedCallbackHand)
    // this.box.addEventListener('removed', this._removedCallbackHand)

    // this.conoe.addEventListener('added', this._addedCallbackGrip)
    // this.conoe.addEventListener('removed', this._removedCallbackGrip)

    // this.icosahedron.addEventListener('added', this._addedCallbackController)
    // this.icosahedron.addEventListener('removed', this._removedCallbackController)

    this.box.startEvents()
  }

  _onConnected(event) {
    this.visible = true
    this.dispatchEvent(event)
  }

  _onDisconnected(event) {
    this.visible = false
    this.dispatchEvent(event)
  }

  _addedCallback(e) {
    console.log(`%c added ${this.index}, trace:`, this.color)
    // console.log(this.parent)
    console.trace()
  }

  _removedCallback(e) {
    console.log(`%c removed ${this.index}, trace:`, this.color)
    // console.log(this.parent)
    console.trace()
  }

  //   _addedCallbackHand(e) {
  //     console.log(`%c added hand ${this.index}`, this.color)
  //   }

  //   _removedCallbackHand(e) {
  //     console.log(`%c removed hand ${this.index}`, this.color)
  //   }

  //   _addedCallbackGrip(e) {
  //     console.log(`%c added grip ${this.index}`, this.color)
  //   }

  //   _removedCallbackGrip(e) {
  //     console.log(`%c removed grip ${this.index}`, this.color)
  //   }

  //   _addedCallbackController(e) {
  //     console.log(`%c added controller ${this.index}`, this.color)
  //   }

  //   _removedCallbackController(e) {
  //     console.log(`%c removed controller ${this.index}`, this.color)
  //     // console.trace()
  //   }

  dispose() {
    this.removeEventListener('added', this._addedCallback)
    this.removeEventListener('removed', this._removedCallback)

    this.box.removeEventListener('connected', this._onConnected)
    this.box.removeEventListener('disconnected', this._onDisconnected)
  }
}

export default function BuggyMinimalXR({ children }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  const store = React.useMemo(() => {
    return create((set, get) => ({
      set,
      get,
      controllers: [],
    }))
  }, [])
  const set = store((store) => store.set)
  const controllers = store((state) => state.controllers)

  React.useLayoutEffect(() => {
    const handlers = ['left', 'right'].map((id) => {
      const target = new FakeXRController(id, gl)
      const onConnected = () =>
        set((state) => {
          console.log('onConnected set', id)
          return { controllers: [...state.controllers, target] }
        })
      const onDisconnected = () =>
        set((state) => {
          console.log('onDisconnected set', id)
          return { controllers: state.controllers.filter((it) => it !== target) }
        })

      target.addEventListener('connected', onConnected)
      target.addEventListener('disconnected', onDisconnected)

      return () => {
        target.removeEventListener('connected', onConnected)
        target.removeEventListener('disconnected', onDisconnected)
      }
    })

    return () => handlers.forEach((cleanup) => cleanup())
  }, [gl, set])

  console.log(
    'controllers',
    controllers.map(({ index }) => index),
  )
  React.useLayoutEffect(() => {
    console.log(
      'scene.children',
      scene.children.map(({ index }) => index),
    )
  }, [controllers, scene])

  React.useLayoutEffect(() => {
    let to = setTimeout(() => {
      set((state) => {
        console.log(state.controllers)
        return { controllers: state.controllers.reverse() }
      })
    }, 1000)
    return () => {
      clearTimeout(to)
      to = null
    }
  }, [set])

  return (
    <>
      {controllers.map((controller, i) => (
        <primitive key={i} object={controller} />
      ))}
      {children}
    </>
  )
}
