import { Canvas } from '@react-three/fiber'
import { OrbitControls, Preload, Stats } from '@react-three/drei'
import { XR, Controllers, Hands } from '@react-three/xr'
import CustomVRButton from '@/components/dom/VRButton'

export default function Scene({ children, ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <Canvas
      {...props}
      onCreated={({ gl, xr, ...rest }) => {
        if (window.location.pathname === '/') {
          document.body.appendChild(CustomVRButton.createButton(gl))
          // if (gl?.xr?.setAnimationLoop) {
          //   console.log('setting setAnimationLoop')
          //   gl.xr.setAnimationLoop((time, frame) => {
          //     console.log(time, frame)
          //   })
          // }
          // https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/core/index.tsx#L231
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
