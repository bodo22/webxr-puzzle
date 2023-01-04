import RemoteHands from '@/components/canvas/RemoteHands'
import { MeshDistortMaterial } from '@react-three/drei'

export default function Page(props) {
  return (
    <div
      className='absolute max-w-lg px-10 py-8 text-sm rounded-lg shadow-xl bg-zinc-800 md:text-base top-16 left-1/2 transform -translate-x-1/2'
      style={{ maxWidth: 'calc(100% - 28px)' }}>
      <p className='hidden mb-8 md:block'>Testing Remote Hand Rendering</p>
    </div>
  )
}

Page.canvas = (props) => {
  return (
    <mesh
      position={[0, 0, -2]}
      onClick={console.log}
      // onPointerOver={() => hover(true)}
      // onPointerOut={() => hover(false)}
      {...props}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial roughness={0} color={false ? 'hotpink' : '#1fb2f5'} />
    </mesh>
  )
}

export async function getStaticProps() {
  return { props: { title: 'RemoteHands' } }
}
