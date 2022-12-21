import { Canvas } from '@react-three/fiber'
import { OrbitControls, Preload } from '@react-three/drei'
import { XR, Controllers, Hands } from '@react-three/xr'
import BuggyMinimalXR from '@/components/canvas/BuggyMinimalXR'

export default function Scene({ children, ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <Canvas {...props}>
      <BuggyMinimalXR>
        <directionalLight intensity={0.75} />
        <ambientLight intensity={0.75} />
        {/* {children} */}
      </BuggyMinimalXR>
    </Canvas>
  )
}
