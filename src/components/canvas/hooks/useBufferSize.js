import * as THREE from "three";
import { useState, useLayoutEffect } from "react";

const size = new THREE.Vector2();

/**
 * Returns size of the current drawing buffer. Updates with XR sessions.
 * @param {THREE.WebGLRenderer} gl
 */
function useBufferSize(gl) {
  const [bufferSize, setBufferSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const handleResize = () => {
      gl.getSize(size);
      setBufferSize({ width: size.x, height: size.y });
    };
    handleResize();

    window.addEventListener("resize", handleResize);
    gl.xr.addEventListener("sessionstart", handleResize);
    gl.xr.addEventListener("sessionend", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      gl.xr.removeEventListener("sessionstart", handleResize);
      gl.xr.removeEventListener("sessionend", handleResize);
    };
  }, [gl]);

  return bufferSize;
}

export default useBufferSize;
