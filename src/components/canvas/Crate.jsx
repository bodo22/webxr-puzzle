import { useGLTF } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";
import { Matrix3, Box3, Vector3, BoxHelper } from "three";
import { OBB } from "three-stdlib";
import { useHelper } from "@react-three/drei";

import Pinch from "./Pinch";
import ShowWorldPosition from "./debug/ShowWorldPosition";

export default function Crate(props) {
  const group = useRef();
  const { nodes, materials } = useGLTF(
    "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf"
  );

  useHelper(props.debug && group, BoxHelper, "blue");

  const materialsRef = useRef(materials);
  const [isPinched, setPinched] = useState(false);

  useEffect(() => {
    materialsRef.current = Object.values(materials).reduce(
      (object, material) => {
        object[material.name] = material.clone();
        material.metalness = 0.5;
        return object;
      },
      {}
    );
  }, [materials]);

  useEffect(() => {
    if (isPinched) {
      Object.values(materialsRef.current).forEach((material) => {
        material.metalness = 0.1;
      });
    } else {
      Object.values(materialsRef.current).forEach((material) => {
        material.metalness = 0.5;
      });
    }
  }, [isPinched]);

  const onChange = React.useCallback(({ isPinched }) => {
    setPinched(isPinched);
  }, []);

  return (
    <Pinch
      onChange={onChange}
      isColliding={({ pinchingController }) => {
        // do initial position check (if futher, don't check for collisions)
        const position = pinchingController.position;
        const groupPosition = group.current.getWorldPosition(new Vector3());

        const box = new Box3().setFromObject(group.current);

        if (!box.containsPoint(position)) {
          props.debug &&
            console.log("IGNORED", position.distanceTo(groupPosition));
          return;
        }

        const boxSize = box.getSize(new Vector3());
        const boxSizeObb = boxSize.clone().divideScalar(2);
        const obbRotation = new Matrix3().setFromMatrix4(
          group.current.matrixWorld.clone().makeScale(1, 1, 1)
        );

        const obb = new OBB(groupPosition, boxSizeObb, obbRotation);

        return pinchingController.intersectsOBB(obb);
      }}
      ref={group}
      {...props}
      dispose={null}
    >
      {props.debug && <ShowWorldPosition target={group} />}
      <group>
        <mesh
          geometry={nodes.Cube013.geometry}
          material={materialsRef.current["BrownDark.057"]}
        />
        <mesh
          geometry={nodes.Cube013_1.geometry}
          material={materialsRef.current["Metal.089"]}
        />
      </group>
    </Pinch>
  );
}

useGLTF.preload(
  "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf"
);
