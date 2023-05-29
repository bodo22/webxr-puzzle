import { Vector3, MathUtils } from "three";
import useSocket, { useUsers } from "@/stores/socket";

export default function usePlayerTransform({ index, pizzaPositions, userId }) {
  const handView = useSocket((state) => state.handView);
  const { studyMode } = useSocket((state) => state.level);
  const users = useUsers();
  const userIdIndex = useSocket((state) => state.userIdIndex);
  const userIdSelf = useSocket((state) => state.userId);
  const i = index ?? userIdIndex;
  const uId = userId ?? userIdSelf;

  const questTransform = uId === "VR";

  let rotationY = 0;
  let position = new Vector3();
  if (studyMode === true && pizzaPositions.length > 1) {
    if (questTransform) {
      // on quest
      position = pizzaPositions[1];
      rotationY = MathUtils.degToRad(180);
    } else {
      // on hololens or inline (test / dev)
      position = pizzaPositions[0];
    }
  } else {
    if (handView === "Pizza" && pizzaPositions[i]) {
      position = pizzaPositions[i];
      const rotateSegments = users.length;
      // absolute i of userId of hands in users array
      const rotationDeg = i * -(360 / rotateSegments);
      rotationY = MathUtils.degToRad(rotationDeg);
    }
  }

  return {
    position,
    "rotation-y": rotationY,
  };
}
