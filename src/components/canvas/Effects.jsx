import React, { useRef } from "react";
import { extend, useThree, useFrame } from "@react-three/fiber";
import { useXR } from "@react-three/xr";

import useBufferSize from "./hooks/useBufferSize";
import useSelected from "./hooks/useSelected";
import CustomEffects from "./CustomEffects";

extend({ CustomEffects });

function Effects() {
  const effects = useRef();
  const { gl, camera, scene } = useThree();
  const player = useXR(state => state.player);
  const { width, height } = useBufferSize(gl);

  const selected = useSelected();

  React.useEffect(() => {
    if (effects.current) {
      effects.current.outlineEffect.selection.set(selected);
    }
  }, [selected]);

  useFrame(
    () => {
      // If not in session, render normally
      if (!effects.current) return;

      if (!gl.xr.isPresenting) return effects.current?.render();

      // Manually handle XR
      gl.xr.enabled = false;

      // Update camera with XRPose
      gl.xr.updateCamera(camera);

      effects.current.passes[0].enabled = true;
      effects.current.passes[1].enabled = false;
      effects.current.passes[2].enabled = false;
      effects.current.render();
      effects.current.passes[0].enabled = false;
      effects.current.passes[1].enabled = true;
      effects.current.passes[2].enabled = true;

      // Render stereo cameras
      const { cameras } = gl.xr.getCamera();
      cameras.forEach((arrayCamera, i) => {
        if (!arrayCamera.parent) {
          player.add(arrayCamera)
        }
        effects.current.outlineEffect.maskPass.clearPass.enabled = i === 0;
        effects.current.outlineEffect.outlinePass.enabled = i === 1;

        arrayCamera.userData.i = i;
        gl.setViewport(arrayCamera.viewport);
        gl.overrideViewport = arrayCamera.viewport;
        camera.position.setFromMatrixPosition(arrayCamera.matrixWorld);
        camera.projectionMatrix.copy(arrayCamera.projectionMatrix);
        effects.current.setMainCamera(arrayCamera);

        effects.current.render();
      });

      // Reset
      gl.setViewport(0, 0, width, height);

      gl.xr.updateCamera(camera);
      gl.xr.enabled = true;
    },
    gl.xr.isPresenting ? 1 : 0
  );

  if (!gl.xr.isPresenting) {
    return null;
  }

  return <customEffects ref={effects} args={[gl, camera, scene]} />;
}

export default Effects;
