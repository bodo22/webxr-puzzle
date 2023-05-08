import React from "react";
import { selectionContext } from "@react-three/postprocessing";

export default function useSelected() {
  const { selected } = React.useContext(selectionContext);
  return selected;
}
