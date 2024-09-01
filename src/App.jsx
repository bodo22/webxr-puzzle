import './wdyr';
import { useRef } from 'react'
import Layout from '@/components/dom/Layout'
import Scene from '@/components/canvas/Scene'
import '@/index.css'
import Index from '@/index.jsx'
import * as THREE from 'three';

import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { update } from './components/dom/WebXRController'

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
// THREE.WebXRController.prototype.update = WebXRController.update;
THREE.WebXRController.prototype.update = update;
// THREE.WebXRController.prototype = WebXRController;
// console.log(WebXRController);
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
