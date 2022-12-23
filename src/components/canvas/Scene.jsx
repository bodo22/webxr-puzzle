import { Canvas } from '@react-three/fiber'
import { OrbitControls, Preload } from '@react-three/drei'
import { XR, Controllers, Hands } from '@react-three/xr'
import CustomVRButton from '@/components/dom/VRButton'

export default function Scene({ children, ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <Canvas
      {...props}
      onCreated={({ gl }) => {
        document.body.appendChild(CustomVRButton.createButton(gl))
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
    </Canvas>
  )
}
