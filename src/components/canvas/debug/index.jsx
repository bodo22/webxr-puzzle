import React from "react";
import { Stats, GizmoHelper, GizmoViewport, Grid } from "@react-three/drei";

export default function Debug() {
  return (
    <>
      <Stats showPanel={0} className="stats" />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={["red", "green", "blue"]}
          labelColor="black"
        />
      </GizmoHelper>
      <Grid
        cellSize={0.5}
        cellThickness={0.75}
        cellColor={"yellow"}
        sectionSize={1}
        sectionThickness={1.25}
        sectionColor={"#2080ff"}
        followCamera={true}
        infiniteGrid={true}
        fadeDistance={100}
        fadeStrength={1}
      />
      <mesh>
        <sphereGeometry args={[0.03, 64, 64]} />
        <meshStandardMaterial color={"hotpink"} />
      </mesh>
    </>
  );
}
