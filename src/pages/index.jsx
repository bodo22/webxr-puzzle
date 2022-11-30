import dynamic from 'next/dynamic'
import Instructions from '@/components/dom/Instructions'
import { VRButton } from '@react-three/xr'
import Logo from '@/components/canvas/Logo'

// Dom components go here
export default function Page(props) {
  return (
    <>
      {/* <div>
        This is a minimal starter for Nextjs + React-three-fiber and Threejs. Click on the{' '}
        <span className='text-cyan-200'>atoms nucleus</span> to navigate to the{' '}
        <span className='text-green-200'>/blob</span> page. OrbitControls are enabled by default.
      </div> */}
      {/* <VRButton /> */}
    </>
  )
}

// Canvas components go here
// It will receive same props as the Page component (from getStaticProps, etc.)
Page.canvas = (props) => {
  return <Logo scale={0.5} route='/blob' position-y={0} />
}

export async function getStaticProps() {
  return { props: { title: 'Puzzle' } }
}
