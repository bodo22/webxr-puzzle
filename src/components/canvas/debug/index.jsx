import React from "react";
import { Group, Matrix4 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Stats, GizmoHelper, GizmoViewport, Grid } from "@react-three/drei";
import { useXR } from "@react-three/xr";
import { HTMLMesh } from "three-stdlib";
import { useDebug } from "@/stores/socket";

export default function Debug() {
  const state = useThree((state) => state);
  const session = useXR((state) => state.session);
  const [statsMesh, setStatsMesh] = React.useState();
  const refSpace = React.useRef();
  const { stats, grid, gizmo, center } = useDebug();

  useFrame((_, __, frame) => {
    statsMesh?.material?.map?.update();
    const viewerPose =
      refSpace.current && frame?.getViewerPose(refSpace.current);
    if (statsMesh && viewerPose?.transform?.matrix) {
      const obj = statsMesh.parent;
      obj.matrix = new Matrix4();
      obj.matrix.elements = viewerPose.transform.matrix;
      obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
      obj.updateWorldMatrix(false, true);
    }
  });

  React.useEffect(() => {
    async function addStatsMesh() {
      const statsElement = document.getElementsByClassName("stats")[0];
      if (session && statsElement && !state.scene.getObjectByName("stats")) {
        const statsMesh = new HTMLMesh(statsElement);
        statsMesh.name = "stats";
        const group = new Group();
        group.add(statsMesh);
        state.scene.add(group);
        setStatsMesh(statsMesh);
        const xrReferenceSpace = await session.requestReferenceSpace("local");
        refSpace.current = xrReferenceSpace;
      }
    }
    addStatsMesh();
  }, [state, session]);

  if (statsMesh) {
    statsMesh.position.x = -0.07;
    statsMesh.position.y = 0.07;
    statsMesh.position.z = -0.3;
    statsMesh.material.depthTest = false;
    statsMesh.material.opacity = stats ? 1 : 0;
    statsMesh.material.tansparency = true;
  }

  return (
    <>
      {stats && <Stats showPanel={0} className="stats" />}
      {gizmo && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={["red", "green", "blue"]}
            labelColor="black"
          />
        </GizmoHelper>
      )}
      {grid && (
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
      )}
      {center && (
        <mesh>
          <sphereGeometry args={[0.03, 64, 64]} />
          <meshStandardMaterial color={"hotpink"} />
        </mesh>
      )}
    </>
  );
}
