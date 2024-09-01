import React from "react";
import { useXR } from "@react-three/xr";
import { useFrame, useThree } from "@react-three/fiber";

import { useFirstRender } from "@/utils";
import useInteracting from "@/stores/interacting";

import { Vector3, Matrix4 } from "three";
import { MeshBVHHelper, SAH } from "three-mesh-bvh";
import { extend, createPortal } from "@react-three/fiber";
import { fingerJointsToBoneMap } from "@/utils/FakeInputSourceFactory";
import useSocket, { useDebug } from "@/stores/socket";

extend({ MeshBVHHelper });

const FingerBoneCylinder = ({
  finger = "index",
  bone = "distal",
  handedness,
  color = "wheat",
  args = [0.008, 0.008, 1, 8, 8],
  handModelRef,
}) => {
  const xr = useThree((state) => state.gl.xr);
  const scene = useThree((state) => state.scene);
  const ref = React.useRef();
  const isFirstRender = useFirstRender();
  const jointNameFrom = fingerJointsToBoneMap[finger][bone].from;
  const jointNameTo = fingerJointsToBoneMap[finger][bone].to;
  const player = useXR((state) => state.player);
  const { showBvhs } = useDebug();

  const isPinchingObject = !!useInteracting(
    (state) => state.pinchedObjects[handedness]
  );

  const { glb } = useSocket((state) => state.level);
  const meshName = `${glb}-meshWithBvh`;

  useFrame((_, __, frame) => {
    const motionController = handModelRef.current?.motionController;
    const inputSource = motionController?.controller?.parent?.inputSource;
    if (!inputSource) {
      return;
    }

    const referenceSpace = xr.getReferenceSpace();
    const fromInputjoint = inputSource.hand.get(jointNameFrom);
    const toInputjoint = inputSource.hand.get(jointNameTo);
    // TODO: this useFrame is getting called as many times as
    // collision hand bone bodies are used per frame (max 25 bones per Hand = 50)
    // need to optimize, currently only 10 bones from right are used
    const fromJointPose = frame.getJointPose(
      fromInputjoint,
      referenceSpace
    )?.transform;
    const toJointPose = frame.getJointPose(
      toInputjoint,
      referenceSpace
    )?.transform;

    if (!ref.current.geometry.boundsTree) {
      return;
    }
    const collideObject = scene.getObjectByName(meshName);
    if (!collideObject) {
      return console.log(`collideObject not found, name: ${meshName}`);
    }
    const transformMatrix = new Matrix4()
      .copy(ref.current.matrixWorld)
      .invert()
      .multiply(collideObject?.matrixWorld);
    const colliding = ref.current.geometry.boundsTree.intersectsGeometry(
      collideObject?.geometry,
      transformMatrix
    );
    ref.current.userData.colliding = colliding;
    if (colliding) {
      ref.current.material.color.set("blue");
    } else {
      ref.current.material.color.set(color);
    }
    if (fromJointPose && toJointPose && ref.current) {
      const posFrom = new Vector3(
        fromJointPose.position.x,
        fromJointPose.position.y,
        fromJointPose.position.z
      );
      const posTo = new Vector3(
        toJointPose.position.x,
        toJointPose.position.y,
        toJointPose.position.z
      );

      player.localToWorld(posFrom);
      player.localToWorld(posTo);
      const o = ref.current;
      // https://discourse.threejs.org/t/how-to-update-the-endpoints-of-a-cylinder/49853/2
      o.position.copy(posFrom);
      const scaleZFactor = isPinchingObject ? 1.5 : 1;
      o.scale.z = posFrom.distanceTo(posTo) * scaleZFactor;
      o.lookAt(posTo.multiply(new Vector3(1, 1, 1)));
    }
  }, -2); // -2 to run before evaluating collision in useListenForBvhCollision

  React.useEffect(() => {
    if (isFirstRender) {
      ref.current.geometry.translate(0, 0.5, 0).rotateX(Math.PI * 0.5);
      ref.current.geometry.computeBoundsTree({
        // maxDepth: 100,
        // maxLeafTris: 100,
        strategy: SAH,
      });
    }
  }, [isFirstRender, ref]);
  // https://discourse.threejs.org/t/physics-body-falling-down-after-scaling/44771/6

  React.useEffect(() => {
    if (isPinchingObject) {
      const scale = bone !== "metacarpal" ? 1.7 : 1;
      ref.current.scale.x = scale;
      ref.current.scale.y = scale;
    } else {
      ref.current.scale.x = 1;
      ref.current.scale.y = 1;
    }
  }, [bone, isPinchingObject]);

  return (
    <>
      <mesh
        ref={ref}
        visible={showBvhs}
        name={`${handedness}-${finger}-${bone}`} /* position={[0.25, 0.25, 0]} */
      >
        <cylinderGeometry args={args} /* args={[0.008, 0.008, .02, 8]} */ />
        <meshStandardMaterial color={color} />
      </mesh>
      {showBvhs &&
        ref.current &&
        createPortal(<meshBVHHelper args={[ref.current]} />, scene)}
    </>
  );
};

export default function HandCollisionBody({ handedness, handModelRef }) {
  return Object.entries(fingerJointsToBoneMap)
    .map(([finger, bones]) => {
      return Object.keys(bones).map((bone) => {
        return (
          <FingerBoneCylinder
            key={`${finger}-${bone}-${handedness}`}
            handedness={handedness}
            color="red"
            finger={finger}
            bone={bone}
            handModelRef={handModelRef}
            args={
              bone !== "metacarpal"
                ? [0.008, 0.008, 1, 8, 8]
                : [0.015, 0.015, 1, 8, 8]
            }
          />
        );
      });
    })
    .flat();
}
