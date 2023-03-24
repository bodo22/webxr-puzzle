import React from "react";
import { Matrix3, Vector3, Box3 } from "three";
import { OBB } from "three-stdlib";
import { useDebug } from "@/stores/socket";

function useIsColliding(group) {
  const { collide } = useDebug();
  return React.useCallback(
    ({ pinchingController }) => {
      // do initial position check (if futher, don't check for collisions)
      const position = pinchingController.position;
      const groupPosition = group.current.getWorldPosition(new Vector3());

      const box = new Box3().setFromObject(group.current);

      if (!box.containsPoint(position)) {
        collide && console.log("IGNORED", position.distanceTo(groupPosition));
        return;
      }

      const boxSize = box.getSize(new Vector3());
      const boxSizeObb = boxSize.clone().divideScalar(2);
      const obbRotation = new Matrix3().setFromMatrix4(
        group.current.matrixWorld.clone().makeScale(1, 1, 1)
      );

      const obb = new OBB(groupPosition, boxSizeObb, obbRotation);

      return pinchingController.intersectsOBB(obb);
    },
    [group, collide]
  );
}

function useCenterObject(group) {
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

export { useIsColliding, useCenterObject };
