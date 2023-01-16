import { useRef } from 'react'
import Layout from '@/components/dom/Layout'
import Scene from '@/components/canvas/Scene'
import '@/index.css'
import Index from '@/index.jsx'


export default function App() {
  const ref = useRef()
  return (
    <>
      <Layout ref={ref}>
        <Index />
        {/* The canvas can either be in front of the dom or behind. If it is in front it can overlay contents.
         * Setting the event source to a shared parent allows both the dom and the canvas to receive events.
         * Since the event source is now shared, the canvas would block events, we prevent that with pointerEvents: none. */}
        {Index?.canvas && (
          <Scene className='pointer-events-none' eventSource={ref} eventPrefix='client'>
            {Index.canvas()}
          </Scene>
        )}
      </Layout>
    </>
  )
}
