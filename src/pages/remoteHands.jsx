import React from 'react'
import { MeshDistortMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import useRemoteHands from '@/stores/remoteHands'

export default function Page(props) {
  return (
    <div
      className='absolute max-w-lg px-10 py-8 text-sm rounded-lg shadow-xl bg-zinc-800 md:text-base top-16 left-1/2 transform -translate-x-1/2'
      style={{ maxWidth: 'calc(100% - 28px)' }}>
      <p className='hidden mb-8 md:block'>Testing Remote Hand Rendering</p>
    </div>
  )
}

const Cube = (props) => {
  const ref = React.useRef()
  // const coords = useRemoteHands((state) => state[props.id])

  React.useEffect(() => {
    const unsubscribe = useRemoteHands.subscribe(
      (state) => state[props.id],
      (coords, prevCoords) => {
        if (!ref.current) {
          console.log(coords, prevCoords)
          return
        }
        ref.current.position.x = coords[0]
        ref.current.position.y = coords[1]
      },
    )

    return () => {
      unsubscribe()
    }
  }, [props.id])
  console.log('rerendering', props.id)

  return (
    <mesh
      ref={ref}
      position={[0, 0, -2]}
      onClick={console.log}
      // onPointerOver={() => hover(true)}
      // onPointerOut={() => hover(false)}
    >
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial roughness={0} color={props.id ? 'hotpink' : '#1fb2f5'} />
    </mesh>
  )
}

const Cubes = (props) => {
  const items = useRemoteHands((state) => state.items)

  useFrame((state, delta, xrFrame) => {
    useRemoteHands.getState().advance()
  })

  return items.map((item) => {
    return <Cube key={item} id={item} />
  })
}

Page.canvas = (props) => <Cubes {...props} />

export async function getStaticProps() {
  return { props: { title: 'RemoteHands' } }
}
