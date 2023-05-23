import React from "react";
import { Vector3, Box3 } from "three";

export default function useCenterObject(group) {
  const [offset, setOffset] = React.useState();

  React.useLayoutEffect(() => {
    if (group.current) {
      function getCenterPoint(mesh) {
        const box = new Box3().setFromObject(mesh);
        const center = new Vector3();
        box.getCenter(center);
        // mesh.localToWorld(center);
        return center;
      }
      const centerOfGroup = getCenterPoint(group.current).multiplyScalar(-1);
      setOffset((oldOffset) => {
        if (oldOffset) {
          return oldOffset;
        }
        return centerOfGroup;
      });
    }
  }, [group]);
  return offset;
}
