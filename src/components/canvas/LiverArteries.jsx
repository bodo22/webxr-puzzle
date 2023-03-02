import React from "react";
import { Matrix3, Vector3, BoxHelper, Box3 } from "three";
import { OBB } from "three-stdlib";
import { OBJLoader } from "three-stdlib";
import { useLoader } from "@react-three/fiber";
import { useHelper } from "@react-three/drei";

import Pinch from "./Pinch";
import * as utils from "@/utils";
import ShowWorldPosition from "./debug/ShowWorldPosition";

export default function LiverArteries(props) {
  const group = React.useRef();

  const obj1 = useLoader(OBJLoader, "/models/LiVR_Pat_ID4_Vein.obj");
  const obj2 = useLoader(OBJLoader, "/models/LiVR_Pat_ID4_Portal.obj");
  const meshRef1 = React.useRef();
  const meshRef2 = React.useRef();
  useHelper(props.debug && group, BoxHelper, "blue");
  const [offset, setOffset] = React.useState();

  React.useEffect(() => {
    if (group.current) {
      function getCenterPoint(mesh) {
        const box = new Box3().setFromObject(group.current);
        const center = new Vector3();
        box.getCenter(center);
        mesh.localToWorld(center);
        return center;
      }
      const centerOfMesh1 = getCenterPoint(group.current).multiplyScalar(-1);
      setOffset((oldOffset) => {
        if (oldOffset) {
          return oldOffset;
        }
        return centerOfMesh1;
      });
    }
  }, []);

  function isColliding({ hand }) {
    const position = utils.getHandPosition(hand);
    const groupPosition = group.current.getWorldPosition(new Vector3());

    const box = new Box3().setFromObject(group.current);

    if (!box.containsPoint(position)) {
      props.debug && console.log("IGNORED", position.distanceTo(groupPosition));
      return;
    }

    const obb = new OBB(
      new Vector3().setFromMatrixPosition(group.current.matrixWorld),
      box.getSize(new Vector3()).multiply(group.current.scale).divideScalar(2),
      new Matrix3().setFromMatrix4(
        group.current.matrixWorld.clone().makeScale(1, 1, 1)
      )
    );

    const matrix = utils.getHandRotationMatrix(hand);

    const indexTip = hand.bones.find(
      (bone) => bone.jointName === "index-finger-tip"
    );
    const thumbTip = hand.bones.find((bone) => bone.jointName === "thumb-tip");

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
  }

  return (
    <Pinch
      onChange={({ isPinched }) => {
        // setPinched(isPinched);
      }}
      isColliding={isColliding}
      ref={group}
      {...props}
      dispose={null}
    >
      {props.debug && <ShowWorldPosition target={group} />}
      <group>
        <mesh
          ref={meshRef1}
          position={offset}
          scale={0.005}
          geometry={obj1.children[0].geometry}
          material={obj1.children[0].material}
        />
        <mesh
          ref={meshRef2}
          position={offset}
          scale={0.005}
          geometry={obj2.children[0].geometry}
          material={obj2.children[0].material}
        />
      </group>
    </Pinch>
  );
}
