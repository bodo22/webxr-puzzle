import * as React from 'react'
import * as THREE from 'three'
import create from 'zustand'
import { useThree } from '@react-three/fiber'

const colors = { red: 0xff0000, 0: 0xff0000, blue: 0x0000ff, 1: 0x0000ff }
class FakeXRController extends THREE.Group {
  constructor(index, gl) {
    super()

    this.index = index
    this.material = new THREE.MeshBasicMaterial({ color: colors[this.index] })

    this.boxGeo = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5)
    this.box = new THREE.Mesh(this.boxGeo, this.material)

    this.position.setZ(-5)
    this.position.setX(this.index === 'red' || this.index === 0 ? -2 : 2)

    this.add(this.box)

    this._addedCallback = this._addedCallback.bind(this)
    this._removedCallback = this._removedCallback.bind(this)

    this.addEventListener('added', this._addedCallback)
    this.addEventListener('removed', this._removedCallback)
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

  dispose() {
    this.removeEventListener('added', this._addedCallback)
    this.removeEventListener('removed', this._removedCallback)
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
    ;[0, 1].forEach((id) => {
      const target = new FakeXRController(id, gl)
      set((state) => {
        return { controllers: [...state.controllers, target] }
      })
    })
  }, [gl, set])

  console.log(
    'new controllers index',
    controllers.map(({ index }) => index),
  )

  React.useLayoutEffect(() => {
    console.log(
      'scene.children in useLayoutEffect',
      scene.children.map(({ index }) => index),
    )
  }, [controllers, scene])

  React.useLayoutEffect(() => {
    let to = setTimeout(() => {
      set((state) => {
        console.log('swapping controllers!!!')
        return { controllers: [...state.controllers.reverse()] }
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
