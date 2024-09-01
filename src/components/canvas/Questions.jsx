import React from "react";
import { Text, Torus } from "@react-three/drei";
import usePlayerTransform from "./hooks/usePlayerTransform";
import { useFrame } from "@react-three/fiber";
import useInteracting from "@/stores/interacting";
import { Box3, Vector3 } from "three";
import { useLog } from "@/stores/socket";

const ringOuterRadius = 0.03;
const ringInnerRadius = 0.01;
const answerIndices = [0, 1, 2, 3, 4, 5, 6];
function Answer({ index, answer, answers, select, color, disable }) {
  const ref = React.useRef();
  const boxRef = React.useRef();
  const motionController = useInteracting(
    (state) => state.motionControllers.right
  );
  React.useEffect(() => {
    ref.current.geometry.computeBoundingBox();
    boxRef.current = new Box3();
  }, []);
  useFrame(() => {
    if (disable) {
        return;
    }
    if (boxRef.current) {
      boxRef.current
        .copy(ref.current.geometry.boundingBox)
        .applyMatrix4(ref.current.matrixWorld);
    }

    if (motionController?.bones?.[9]) {
      const indexFingerTipBone = new Vector3();
      motionController.bones[9].getWorldPosition(indexFingerTipBone);
      const containsPoint = boxRef.current.containsPoint(indexFingerTipBone);
      if (containsPoint) {
        select(index, answer);
      }
    }
  });

  return (
    <group
      position={[-.3, 0.1, -0.25]}
    >
      <group position={[index / 10, 0, 0]}>
        <Text
          color={color}
          material-transparent={true}
          material-opacity={0.6}
          anchorX="center"
          anchorY="middle"
          fontSize={0.03}
        >
          {answer}
        </Text>
        <Torus
          ref={ref}
          args={[ringOuterRadius, ringInnerRadius, 12, 48]}
          material-color={color}
        />
      </group>
    </group>
  );
}

export default function Questions() {
  const playerTransform = usePlayerTransform();
  const [selected, setSelected] = React.useState();
  const log = useLog();
  const select = React.useCallback((index, answer) => {
    setSelected(index);
    log({ type: "howComfortable", answer, });
  }, [log]);

  return (
      <group {...playerTransform}>
    <group position={[0,0,-.2]}>
        <group position={[0, 0, -.3]}>
          <Text
            material-transparent={true}
            material-opacity={0.6}
            anchorX="center"
            anchorY="middle"
            fontSize={.02}
          >
            {`How comfortable was it for you
    to perform the handover?`}
          </Text>
        </group>
        <group position={[0, .04, -.25]}>
          <Text
            material-transparent={true}
            material-opacity={0.6}
            anchorX="center"
            anchorY="middle"
            fontSize={.015}
          >
            {`Very Uncomfortable                                                                                                    Very Comfortable`}
          </Text>
        </group>
        {answerIndices.map((index) => (
          <Answer
            disable={selected !== undefined}
            key={`answer-${index}`}
            index={index}
            answer={index + 1}
            answers={answerIndices.length}
            select={select}
            color={selected === index ? "green" : "white"}
          />
        ))}
      </group>
    </group>
  );
}
