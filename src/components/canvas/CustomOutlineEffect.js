import { OutlineEffect } from "postprocessing";
import { Vector4 } from "three";
export default class CustomOutlineEffect extends OutlineEffect {
  resetViewport(renderer) {
    if (renderer.overrideViewport) {
      renderer.setViewport(
        0,
        0,
        renderer.overrideViewport.width * 2,
        renderer.overrideViewport.height
      );
      const target = new Vector4();
      renderer.getViewport(target);
      renderer.overrideViewport = target;
    }
  }

  update(renderer, inputBuffer, deltaTime) {
    const scene = this.scene;
    const camera = this.camera;
    const selection = this.selection;
    const uniforms = this.uniforms;
    const pulse = uniforms.get("pulse");

    const background = scene.background;
    const mask = camera.layers.mask;

    if (selection.size > 0) {
      scene.background = null;
      pulse.value = 1;

      if (this.pulseSpeed > 0) {
        pulse.value =
          Math.cos(this.time * this.pulseSpeed * 10.0) * 0.375 + 0.625;
      }

      this.active = true;
      this.time += deltaTime;

      // Render a custom depth texture and ignore selected objects.
      selection.setVisible(false);
      this.depthPass.render(renderer);
      selection.setVisible(true);

      // Compare the depth of the selected objects with the depth texture.
      camera.layers.set(selection.layer);
      this.maskPass.render(renderer, this.renderTargetMask);

      // Restore the camera layer mask and the scene background.
      camera.layers.mask = mask;
      scene.background = background;

      // until here: rendering everything twice, once for each eye
      // from here: reset to full size viewport & render that (no perspective needed anymore)
      // this.resetViewport & next if are custom, rest is copied from source: OutlineEffect
      this.resetViewport(renderer);

      if (this.outlinePass.enabled) {
        // Detect the outline.
        this.outlinePass.render(renderer, null, this.renderTargetOutline);
      }
      if (this.blurPass.enabled) {
        this.blurPass.render(
          renderer,
          this.renderTargetOutline,
          this.renderTargetOutline
        );
      }
    } else {
      this.resetViewport(renderer);
      if (this.active) {
        this.clearPass.render(renderer, this.renderTargetOutline);
        this.active = false;
      }
    }
  }
}
