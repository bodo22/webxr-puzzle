import { Canvas } from '@react-three/fiber'
import { OrbitControls, Preload, Stats } from '@react-three/drei'
import { XR, Controllers, Hands } from '@react-three/xr'
import CustomVRButton from '@/components/dom/VRButton'
import { useRouter } from 'next/router'

export default function Scene({ children, ...props }) {
  const router = useRouter()
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <Canvas
      {...props}
      onCreated={({ gl }) => {
        if (router.pathname === '/') {
          document.body.appendChild(CustomVRButton.createButton(gl))
        }
      }}>
      <XR>
        <Controllers />
        <Hands />
        <directionalLight intensity={0.75} />
        <ambientLight intensity={0.75} />
        {children}
        <Preload all />
        <OrbitControls />
      </XR>
      <Stats showPanel={0} className='stats' {...props} />
    </Canvas>
  )
}
