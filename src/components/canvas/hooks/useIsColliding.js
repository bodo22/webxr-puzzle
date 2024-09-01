import React from "react";
import { Matrix3, Vector3, Box3 } from "three";
import { OBB } from "three-stdlib";
import { useDebug } from "@/stores/socket";
import { handMeshModelIntersectsOBB } from "@/utils/MotionController";
import useInteracting from "@/stores/interacting";
import { getHandPosition } from "@/utils";

export default function useIsColliding(mesh) {
  const { collide } = useDebug();

  const getBoundingBox = React.useCallback(
    (position) => {
      // do initial position check (if further, don't check for collisions)
      const meshPos = mesh.getWorldPosition(new Vector3());

      const box = new Box3().setFromObject(mesh);

      let boxContainsPoint = box.containsPoint(position);
      if (!boxContainsPoint) {
        collide && console.log("IGNORED", position.distanceTo(meshPos));
      }
      return {
        meshPos,
        box,
        boxContainsPoint,
      };
    },
    [collide, mesh]
  );
  return React.useCallback(
    ({ handedness }) => {
      const handMeshModel =
        useInteracting.getState().motionControllers[handedness];
      const position = getHandPosition(handMeshModel);
      const { meshPos, box, boxContainsPoint } = getBoundingBox(position);

      if (!boxContainsPoint) {
        return;
      }

      const boxSize = box.getSize(new Vector3());
      const boxSizeObb = boxSize.clone().divideScalar(2);
      const obbRotation = new Matrix3().setFromMatrix4(
        mesh.matrixWorld.clone().makeScale(1, 1, 1)
      );

      const obb = new OBB(meshPos, boxSizeObb, obbRotation);

      return handMeshModelIntersectsOBB(handMeshModel, obb);
    },
    [getBoundingBox, mesh.matrixWorld]
  );
}
