import React from "react";
import { useXREvent } from "@react-three/xr";
import useSound from "use-sound";

import useSocket, { useLog } from "@/stores/socket";
// import { useHandEvent } from "@/stores/interacting";
import { usePinch } from "./hooks/pinch/pinch";

import lockSfx from "@/assets/sounds/lock.mp3";
import trashSfx from "@/assets/sounds/trash.mp3";
import useListenForRemotePinch from "./hooks/pinch/useListenForRemotePinch";
import useUpdateGroup from "./hooks/pinch/useUpdateGroup";

const Pinch = React.forwardRef(({ children, ignore, ...props }, ref) => {
  const { selectOrPinchEnd, selectOrPinchStart } = usePinch({ ...props, ignore, ref });
  const [playLock] = useSound(lockSfx);
  const [playTrash] = useSound(trashSfx);
  const updatePiece = useSocket((state) => state.updatePiece);
  const pieces = useSocket((state) => state.pieces);
  const { selectOnCollision } = useSocket((state) => state.level);
  const log = useLog();
  // for XR hands
  useXREvent("selectstart", ({ nativeEvent }) => {
    if (ignore || selectOnCollision) {
      return;
    }
    const handedness = nativeEvent.data.handedness;
    selectOrPinchStart({ handedness });
  });

  // for XR hands
  useXREvent("selectend", ({ nativeEvent }) => {
    if (ignore || selectOnCollision) {
      return;
    }
    const handedness = nativeEvent.data.handedness;
    selectOrPinchEnd({ handedness });
  });

  // for inline or remote hands, only for testing
  // useHandEvent("pinchstart", selectOrPinchStart);
  // useHandEvent("pinchend", selectOrPinchEnd);

  useUpdateGroup(ref, props);
  useListenForRemotePinch(ref, selectOrPinchEnd, props);

  React.useEffect(() => {
    const group = ref.current;
    function handleGoalReached({ target, ...e }) {
      log(e);
      updatePiece(props.name, "success", true);
      selectOrPinchEnd({ handedness: e.handedness });
      playLock();
    }
    group.addEventListener("goalReached", handleGoalReached);
    return () => {
      group.removeEventListener("goalReached", handleGoalReached);
    };
  }, [
    playLock,
    props.name,
    props.trash,
    updatePiece,
    selectOrPinchEnd,
    ref,
    log,
  ]);

  const lastSuccess =
    pieces.filter(({ success }) => success === true).length + 1 ===
    pieces.length;

  React.useEffect(() => {
    const group = ref.current;
    function handleEvent({ target, ...e }) {
      log(e);
      const trashed = e.type === "insideTrash";
      updatePiece(props.name, "trashed", trashed);
      if (props.trash) {
        updatePiece(props.name, "success", trashed);
        if (trashed === true && lastSuccess) {
          selectOrPinchEnd({ handedness: e.handedness });
        }
      }

      trashed && playTrash();
    }
    group.addEventListener("insideTrash", handleEvent);
    group.addEventListener("outsideTrash", handleEvent);
    return () => {
      group.removeEventListener("insideTrash", handleEvent);
      group.removeEventListener("outsideTrash", handleEvent);
    };
  }, [
    playTrash,
    props.name,
    props.trashed,
    props.trash,
    updatePiece,
    lastSuccess,
    ref,
    selectOrPinchEnd,
    log,
  ]);

  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
});

export default Pinch;
