import React from "react";
import { useThree } from "@react-three/fiber";
import { SAH, MeshBVHHelper } from "three-mesh-bvh";
import { extend, createPortal } from "@react-three/fiber";
import { useDebug } from "@/stores/socket";
extend({ MeshBVHHelper });

export default function Bvh({ mesh }) {
  const scene = useThree((state) => state.scene);
  const bvhRef = React.useRef();
  const { showBvhs } = useDebug();

  React.useEffect(() => {
    if (mesh) {
      mesh.geometry.computeBoundsTree({
        strategy: SAH,
        // maxDepth: 10,
        // maxLeafTris: 5,
      });
      bvhRef.current && bvhRef.current.update();
    }
  }, [mesh]);

  return (
    <>
      {showBvhs &&
        mesh &&
        createPortal(<meshBVHHelper ref={bvhRef} args={[mesh]} />, scene)}
    </>
  );
}
