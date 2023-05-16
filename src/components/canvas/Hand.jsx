import React from "react";
import { OculusHandModel } from "three-stdlib";
import { extend, createPortal } from "@react-three/fiber";

import useSocket, { useDebug } from "@/stores/socket";
import useInteracting from "@/stores/interacting";

import Axes from "@/components/canvas/debug/Axes";

extend({ OculusHandModel });

export default function Hand({ target, color, handedness, localHand, userId }) {
  const handModelRef = React.useRef();
  const handMeshModelRef = React.useRef();
  const { hands } = useDebug();
  const socket = useSocket((state) => state.socket);
  const gesture = useInteracting((state) => state.gestures[handedness]);
  const { r, g, b } = color;
  const { hand, blob } = target;

  const setColor = React.useCallback(
    (color) => {
      if (!color) {
        blob.material.color.setRGB(r, g, b);
        handMeshModelRef?.current?.material.color.setRGB(r, g, b);
      } else {
        blob.material.color.set(color);
        handMeshModelRef?.current?.material.color.set(color);
      }
    },
    [r, g, b, blob]
  );

  React.useLayoutEffect(() => {
    const handModel = handModelRef.current;
    if (handModel) {
      function childAdded(event) {
        const mesh = event.child.getObjectByProperty("type", "SkinnedMesh");
        handMeshModelRef.current = mesh;
        setColor();
      }
      handModel.addEventListener("childadded", childAdded);
      setColor();
      return () => {
        handModel.removeEventListener("childadded", childAdded);
      };
    }
  }, [setColor]);

  const updateColor = React.useCallback(
    (gesture) => {
      switch (gesture) {
        case "pinch":
          setColor("green");
          break;
        case "fist":
          setColor("red");
          break;
        case "point":
          setColor("pink");
          break;
        default:
          setColor();
          break;
      }
    },
    [setColor]
  );

  // local hands
  React.useEffect(() => {
    if (localHand) {
      updateColor(gesture);
    }
  }, [localHand, gesture, updateColor]);

  // remote hands
  React.useEffect(() => {
    function onHandData(data) {
      if (data.userId === userId && !!data?.gestures?.[handedness]) {
        updateColor(data.gestures[handedness]);
      }
    }
    socket.on("handData", onHandData);
    return () => socket.off("handData", onHandData);
  }, [socket, handedness, userId, updateColor]);

  const setHand = useInteracting((state) => state.setHand);
  React.useEffect(() => {
    if (localHand) {
      setHand(handedness, hand);
    }
    return () => {
      if (localHand) {
        setHand(handedness, undefined);
      }
    };
  }, [setHand, hand, handedness, localHand]);

  return (
    <>
      {createPortal(<oculusHandModel ref={handModelRef} args={[hand]} />, hand)}
      {hands && localHand && (
        <Axes model={handModelRef.current?.motionController} />
      )}
      <primitive object={blob} />
    </>
  );
}
