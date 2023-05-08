import { UnsignedByteType } from "three";

import {
  EffectComposer,
  EffectPass,
  RenderPass,
  ClearPass,
} from "postprocessing";
import CustomOutlineEffect from "./CustomOutlineEffect";

// based on:
// https://codesandbox.io/s/7x7p3q?file=/src/Effects.js
// and forked:
// https://codesandbox.io/s/webxr-postprocessing-forked-kp7jr5?file=/src/Effects.js

class CustomEffects extends EffectComposer {
  constructor(gl, camera, scene) {
    super(gl, {
      // multisampling: 8,
      frameBufferType: UnsignedByteType,
    });
    // override setting inputBuffer & outputBuffer which were set in super()
    this.inputBuffer = this.inputBuffer.clone();
    this.outputBuffer = gl.xr.newRenderTarget;
    this.outputBuffer.isXRRenderTarget = true;
    gl.setDrawingBufferSize(
      gl.xr.newRenderTarget.width,
      gl.xr.newRenderTarget.height,
      1
    );
    this.setSize(gl.xr.newRenderTarget.width, gl.xr.newRenderTarget.height);

    this.autoRenderToScreen = false;
    this.addPass(new ClearPass());
    const renderPass = new RenderPass(scene, camera);
    renderPass.clearPass.enabled = false;
    renderPass.renderToScreen = false;
    this.addPass(renderPass);

    this.outlineEffect = new CustomOutlineEffect(scene, camera, {
      blur: false,
      visibleEdgeColor: "red",
      hiddenEdgeColor: "blue",
      edgeStrength: 15,
      resolutionScale: 1,
      // blendFunction: BlendFunction.SET,
      // resolutionY: 500,
    });
    this.outlineEffect.maskPass.clearPass.enabled = false;
    // this.outlineEffect.maskPass.renderToScreen = true;
    // this.outlineEffect.outlinePass.renderToScreen = true;
    this.outlineEffect.clearPass.enabled = false;
    this.outlineEffect.depthPass.renderPass.clearPass.enabled = false;
    this.outlineEffect.blurPass.enabled = false;
    this.outlineEffectPass = new EffectPass(camera, this.outlineEffect);
    this.outlineEffectPass.renderToScreen = false;

    this.addPass(this.outlineEffectPass);
  }
}

export default CustomEffects;

/**
 * idea:
 * 1x clearpass
 * 2x renderpass
 * 2x outlineEffect.depthPass
 * 1x outlineEffect.maskPass.clearPass
 * 2x outlineEffect.maskPass (maskPass is actually a renderPass)
 * reset the viewport to full screen!
 * 1x outlineEffect.outlinePass
 */
