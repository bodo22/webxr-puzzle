import React from 'react'
import { useXR } from '@react-three/xr'
import Logo from '@/components/canvas/Logo'
import { useFrame, useThree } from '@react-three/fiber'
import RemoteControllers from '@/components/canvas/RemoteControllers'


// Dom components go here
export default function Page() {
}

const RecordHandData = () => {
  const controllers = useXR((state) => state.controllers)
  const xr = useThree((state) => state.gl.xr)
  const scene = useThree((state) => state.scene)

  React.useEffect(() => {
    // console.log(scene)
  }, [scene])

  React.useEffect(() => {
    function onFrameJointPoses(frameJointPoses) {
      // console.log({ frameJointPoses })
    }

    controllers.forEach((controller, index) => {
      // const controller3 = xr.controllers[index]
      controller.hand.addEventListener('frameJointPoses', onFrameJointPoses)
    })
    return () => {
      controllers.forEach((controller) => {
        controller.hand.removeEventListener('frameJointPoses', onFrameJointPoses)
      })
    }
  }, [controllers, xr])

  useFrame((gl, ...rest) => {
    if (rest && rest[1]) {
      // console.log(gl, rest)
    }
  })
}

// Canvas components go here
// It will receive same props as the Page component (from getStaticProps, etc.)
Page.canvas = (props) => {
  return (
    <>
      <RemoteControllers />
      <RecordHandData />
      <Logo scale={0.5} route='/blob' position-z={-5} />
    </>
  )
}

export async function getStaticProps() {
  return { props: { title: 'Puzzle' } }
}
