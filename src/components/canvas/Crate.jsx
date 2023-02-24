import { useGLTF } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";
import { Matrix3, Mesh, Vector3 } from "three";
import { OBB } from "three-stdlib";

import Pinch from "./Pinch";
import * as handModelUtils from "@/utils";

export default function Crate(props) {
  const group = useRef();
  const { nodes, materials } = useGLTF(
    "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/crate/model.gltf"
  );

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

  return (
    <Pinch
      onChange={({ isPinched }) => {
        setPinched(isPinched);
      }}
      isColliding={({ hand }) => {
        // do initial position check (if futher, don't check for collisions)
        const position = handModelUtils.getHandPosition(hand);
        const cratePosition = group.current.getWorldPosition(new Vector3());

        // calculate based on bounding box
        // for now hardcodedackage
        if (position.distanceTo(cratePosition) > 0.2) {
          // console.log('IGNORED', position.distanceTo(cratePosition))
          return;
        }

        let mesh = undefined;
        group.current.traverse((object) => {
          if (!mesh && object instanceof Mesh && object.geometry) {
            mesh = object;
          }
        });
        if (!mesh) {
          return;
        }

        const obb = new OBB(
          new Vector3().setFromMatrixPosition(group.current.matrixWorld),
          mesh.geometry.boundingBox
            .getSize(new Vector3())
            .multiply(group.current.scale)
            .divideScalar(2),
          new Matrix3().setFromMatrix4(
            group.current.matrixWorld.clone().makeScale(1, 1, 1)
          )
        );

        const matrix = handModelUtils.getHandRotationMatrix(hand);

        const indexTip = hand.bones.find(
          (bone) => bone.jointName === "index-finger-tip"
        );
        const thumbTip = hand.bones.find(
          (bone) => bone.jointName === "thumb-tip"
        );

        const thumbOBB = new OBB(
          indexTip.getWorldPosition(new Vector3()),
          new Vector3(0.05, 0.05, 0.05).divideScalar(2),
          new Matrix3().setFromMatrix4(matrix)
        );
        const indexOBB = new OBB(
          thumbTip.getWorldPosition(new Vector3()),
          new Vector3(0.05, 0.05, 0.05).divideScalar(2),
          new Matrix3().setFromMatrix4(matrix)
        );

        return (
          obb.intersectsOBB(thumbOBB, Number.EPSILON) &&
          obb.intersectsOBB(indexOBB, Number.EPSILON)
        );
      }}
      ref={group}
      {...props}
      dispose={null}
    >
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* <mesh
          geometry={nodes.Cube013.geometry}
          material={materialsRef.current["BrownDark.057"]}
        /> */}
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