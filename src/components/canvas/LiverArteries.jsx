import React from "react";
import { Matrix3, Vector3, BoxHelper, Box3 } from "three";
import { OBB } from "three-stdlib";
import { OBJLoader } from "three-stdlib";
import { useLoader } from "@react-three/fiber";
import { useHelper } from "@react-three/drei";

import Pinch from "./Pinch";
import ShowWorldPosition from "./debug/ShowWorldPosition";

export default function LiverArteries(props) {
  const innerGroup = React.useRef();
  const group = React.useRef();

  const obj1 = useLoader(OBJLoader, "/models/LiVR_Pat_ID4_Vein.obj");
  const obj2 = useLoader(OBJLoader, "/models/LiVR_Pat_ID4_Portal.obj");
  const meshRef1 = React.useRef();
  const meshRef2 = React.useRef();
  useHelper(props.debug && group, BoxHelper, "blue");
  const [offset, setOffset] = React.useState();

  React.useLayoutEffect(() => {
    if (innerGroup.current) {
      function getCenterPoint(mesh) {
        const box = new Box3().setFromObject(mesh);
        const center = new Vector3();
        box.getCenter(center);
        // mesh.localToWorld(center);
        return center;
      }
      const centerOfGroup = getCenterPoint(innerGroup.current).multiplyScalar(-1);
      setOffset((oldOffset) => {
        if (oldOffset) {
          return oldOffset;
        }
        return centerOfGroup;
      });
    }
  }, []);

  function isColliding({ pinchingController }) {
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
  }

  const onChange = React.useCallback(({ isPinched }) => {}, []);

  return (
    <Pinch
      onChange={onChange}
      isColliding={isColliding}
      ref={group}
      {...props}
      dispose={null}
    >
      {props.debug && <ShowWorldPosition target={group} />}
      <group ref={innerGroup}>
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
