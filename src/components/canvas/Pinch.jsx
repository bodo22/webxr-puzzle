import React from "react";
import { useFrame } from "@react-three/fiber";
import { useXREvent } from "@react-three/xr";
import { mergeRefs } from "react-merge-refs";
import { Matrix4, Quaternion, Vector3 } from "three";

import useInteracting, { useHandEvent } from "@/stores/interacting";
import * as handModelUtils from "@/utils";

const Pinch = React.forwardRef(
  ({ children, onChange, isColliding, ...props }, passedRef) => {
    const ref = React.useRef();
    const pinchingController = React.useRef();
    const previousTransform = React.useRef(undefined);
    const setPinchedObject = useInteracting((store) => store.setPinchedObject);

    function selectOrPinchStart({ handedness, motionController }) {
      const colliding = isColliding({ hand: motionController });

      if (colliding) {
        const transform = handModelUtils.getHandTransform(motionController);
        previousTransform.current = transform.clone();
        onChange({ isPinched: true });
        setPinchedObject(handedness, ref);
        pinchingController.current = motionController;
      }
    }

    function selectOrPinchEnd({ handedness }) {
      onChange({ isPinched: false });
      pinchingController.current = undefined;
      previousTransform.current = undefined;
      setPinchedObject(handedness, undefined);
    }

    // for inline or remote hands
    useHandEvent("pinchend", selectOrPinchEnd);

    // for inline or remote hands
    useHandEvent("pinchstart", selectOrPinchStart);

    // for XR hands
    useXREvent("selectstart", ({ nativeEvent, target }) => {
      const motionController = target.hand.children.find(
        (child) => child.constructor.name === "OculusHandModel"
      )?.motionController;
      selectOrPinchStart({
        handedness: nativeEvent.data.handedness,
        motionController,
      });
    });

    // for XR hands
    useXREvent("selectend", ({ nativeEvent }) => {
      selectOrPinchEnd({ handedness: nativeEvent.data.handedness });
    });

    useFrame(() => {
      const { pinchedObjects } = useInteracting.getState();
      const pinchingThisObject = Object.values(pinchedObjects).some(
        (pinchedObject) =>
          pinchedObject?.current && pinchedObject.current === ref.current
      );
      if (
        !pinchingController.current ||
        !pinchingThisObject ||
        !previousTransform.current
      ) {
        return;
      }
      let transform = handModelUtils.getHandTransform(
        pinchingController.current
      );
      // apply previous transform
      ref.current.applyMatrix4(previousTransform.current.clone().invert());

      // get quaternion from previous matrix
      const previousQuaternion = new Quaternion();
      previousTransform.current.decompose(
        new Vector3(),
        previousQuaternion,
        new Vector3(1, 1, 1)
      );
      // get quaternion from current matrix
      const currentQuaternion = new Quaternion();
      transform.decompose(
        new Vector3(),
        currentQuaternion,
        new Vector3(1, 1, 1)
      );
      // slerp to current quaternion
      previousQuaternion.slerp(currentQuaternion, 0.1);
      const position = handModelUtils.getHandPosition(
        pinchingController.current
      );
      transform = new Matrix4().compose(
        position,
        previousQuaternion,
        new Vector3(1, 1, 1)
      );

      ref.current.applyMatrix4(transform);
      ref.current.updateWorldMatrix(false, true);
      previousTransform.current = transform.clone();
      // TODO send transform via socket
    });

    return (
      <group ref={mergeRefs([passedRef, ref])} {...props}>
        {children}
      </group>
    );
  }
);

export default Pinch;
