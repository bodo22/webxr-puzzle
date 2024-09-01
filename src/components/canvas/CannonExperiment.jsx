import React from "react";
import { useXR } from "@react-three/xr";
import { useThree } from "@react-three/fiber";
import useSocket from "@/stores/socket";

import { jointNames } from "@/utils/FakeInputSourceFactory";
import useInteracting from "@/stores/interacting";

import {
  Physics,
  usePlane,
  useBox,
  useCylinder,
  Debug,
  useContactMaterial,
} from "@react-three/cannon";
import { Vector3, Matrix4, Euler } from "three";

const bouncyMaterial = {
  name: "bouncy",
  /*
  Restitution for this material.
  If non-negative, it will be used instead of the restitution given by ContactMaterials.
  If there's no matching ContactMaterial, the value from .defaultContactMaterial in the World will be used.
  */
  restitution: 1.1,
};

const boxMaterial = "box";

const groundMaterial = "ground";

/*
Setting the friction on both materials prevents overriding the friction given by ContactMaterials.
Since we want rubber to not be slippery we do not set this here and instead use a ContactMaterial.
See https://github.com/pmndrs/cannon-es/blob/e9f1bccd8caa250cc6e6cdaf85389058e1c9238e/src/world/World.ts#L661-L673
*/
const rubberMaterial = "rubber";

const slipperyMaterial = {
  /*
  Friction for this material.
  If non-negative, it will be used instead of the friction given by ContactMaterials.
  If there's no matching ContactMaterial, the value from .defaultContactMaterial in the World will be used.
  */
  friction: 0,
  name: "slippery",
};

const useContactMaterials = (rubberSlips) => {
  useContactMaterial(groundMaterial, groundMaterial, {
    contactEquationRelaxation: 3,
    contactEquationStiffness: 1e8,
    friction: 0.4,
    frictionEquationStiffness: 1e8,
    restitution: 0.3,
  });

  useContactMaterial(boxMaterial, groundMaterial, {
    contactEquationRelaxation: 3,
    contactEquationStiffness: 1e8,
    friction: 0.4,
    frictionEquationStiffness: 1e8,
    restitution: 0.3,
  });
  useContactMaterial(boxMaterial, slipperyMaterial, {
    friction: 0,
    restitution: 0.3,
  });

  useContactMaterial(groundMaterial, slipperyMaterial, {
    friction: 0,
    restitution: 0.3,
  });
  useContactMaterial(slipperyMaterial, slipperyMaterial, {
    friction: 0.1,
    restitution: 0.3,
  });

  useContactMaterial(bouncyMaterial, slipperyMaterial, {
    friction: 0,
    restitution: 0.5,
  });
  useContactMaterial(bouncyMaterial, groundMaterial, {
    restitution: 0.9,
  });
  useContactMaterial(bouncyMaterial, bouncyMaterial, {
    restitution: 10.0, // This does nothing because bouncyMaterial already has a restitution
  });

  useContactMaterial(
    rubberMaterial,
    slipperyMaterial,
    {
      friction: 1,
      restitution: 0.3,
    },
    [rubberSlips]
  );

  useContactMaterial(rubberMaterial, bouncyMaterial, {
    restitution: 0.5,
  });
};

// copied from index.jsx
function FingerTipCylinder({
  jointNameFrom = "index-finger-phalanx-distal",
  jointNameTo = "index-finger-tip",
  handedness,
  color = "wheat",
  args = [0.008, 0.008, 0.03, 8],
  props,
}) {
  const xr = useThree((state) => state.gl.xr);
  const [colliding, setColliding] = React.useState();
  const [ref, api] = useCylinder(() => ({
    mass: 100000000,
    args,
    onCollide: console.log,
    onCollideBegin: () => {
      console.log("started");
      setColliding(true);
    },
    onCollideEnd: () => {
      console.log("ended");
      setColliding(false);
    },
    // args: [0.008, 0.008, .02, 8],
    // position: [0, 1, -0.85],
    // type: "static",
    // material: rubberMaterial,
    ...props,
  }));

  const jointFromIndex = jointNames.findIndex(
    ({ jointName }) => jointName === jointNameFrom
  );
  const jointToIndex = jointNames.findIndex(
    ({ jointName }) => jointName === jointNameTo
  );
  React.useEffect(() => {
    const handler = ({ data: joints, frame }) => {
      const { pinchedObjects, gestures, pinching } = useInteracting.getState();
      const jointFrom = joints[handedness]?.[jointFromIndex];
      const jointTo = joints[handedness]?.[jointToIndex];
      //   console.log(jointFrom, joints, api);
      const posFrom = new Vector3();
      const posTo = new Vector3();
      // console.log(gestures, pinching);
      if (
        jointFrom &&
        jointTo &&
        ref.current &&
        !colliding /* && pinching.right === false */
      ) {
        posFrom.setFromMatrixPosition(
          new Matrix4().fromArray(jointFrom.transformMatrix)
        );
        posTo.setFromMatrixPosition(
          new Matrix4().fromArray(jointTo.transformMatrix)
        );
        // console.log(posFrom, posTo, posFrom.distanceTo(posTo));
        // const o = ref.current;
        // https://discourse.threejs.org/t/how-to-update-the-endpoints-of-a-cylinder/49853/2
        // o.position.copy(posFrom);
        api.position.set(posTo.x, posTo.y, posTo.z);
        const rotMatrix = new Matrix4().lookAt(
          posFrom,
          posTo,
          new Vector3(0, 1, 0)
        );
        const ninety = new Matrix4().makeRotationX(Math.PI * 0.5);
        rotMatrix.multiply(ninety);
        const euler = new Euler().setFromRotationMatrix(rotMatrix);
        api.rotation.set(euler.x, euler.y, euler.z);
        // api.rotation.set(Math.PI * 0.5, 0, 0);
        // o.scale.z = posFrom.distanceTo(posTo);
        // o.lookAt(posTo);
      }
    };
    xr.addEventListener("managedHandsJointData", handler);
    return () => {
      xr.removeEventListener("managedHandsJointData", handler);
    };
  }, [api, colliding, handedness, jointFromIndex, jointToIndex, ref, xr]);

  React.useEffect(() => {
    console.log(ref, api);

    // api.rotation.set(Math.PI * 0.5, 0, 0);
    // api.position.set(0, 0.5, 0);
    // api.scaleOverride([0.1, 0.1, 0.1]);
    // TODO: this changes the position on hot reloads
    // ref.current.geometry.translate(0, 0.5, 0).rotateX(Math.PI * 0.5);
  }, [ref]);
  // https://discourse.threejs.org/t/physics-body-falling-down-after-scaling/44771/6

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={args} /* args={[0.008, 0.008, .02, 8]} */ />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Plane(props) {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.5, 0],
    // material: groundMaterial,
    ...props,
  }));
  return (
    <mesh ref={ref} receiveShadow /* position={[0, -1, 0]} */>
      <planeGeometry args={[1000, 1000]} />
      <meshLambertMaterial color="lightblue" />
      {/* <shadowMaterial color="lightblue"  /> */}
    </mesh>
  );
}

function Cube({ args = [0.03, 0.03, 0.03], color, ...props }) {
  const [ref] = useBox(() => ({
    // mass: 1,
    position: [0, 0, -0.25],
    args,
    type: "static",
    // collisionResponse: false,
    ...props,
  }));
  return (
    <mesh ref={ref} receiveShadow castShadow>
      <boxGeometry args={args} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

function CannonExperiment() {
  // useContactMaterials();
  return (
    <Debug color="black" scale={1.1}>
      <Plane />
      <Cube color="hotpink" /* material={slipperyMaterial} */ />
      <Cube color="yellow" /* material={rubberMaterial} */ />
      <FingerTipCylinder handedness="left" color="wheat" />
      <FingerTipCylinder handedness="right" color="red" />
      {/* <FingerTipCylinder
        handedness="right"
        color="red"
        jointNameFrom="thumb-phalanx-distal"
        jointNameTo="thumb-tip"
      /> */}
    </Debug>
  );
}

export default function Wrapper() {
  const ref = React.useRef();
  React.useEffect(() => {
    console.log(ref);
  }, []);
  return (
    <Physics
      ref={ref}
      // frictionGravity={[3, -60, 0]}
      // gravity = {[0, -9.81, 0]}
      gravity={[0, 0, 0]}
      // gravity={[0, -.001, 0]}
      // defaultContactMaterial={{ friction: .01 }}
    >
      <CannonExperiment />
    </Physics>
  );
}
