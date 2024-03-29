import React from "react";
import { Group, Matrix4, Vector3 } from "three";
import { useFrame, useThree, createPortal } from "@react-three/fiber";
import { Stats, GizmoHelper, GizmoViewport, Grid } from "@react-three/drei";
import { useXR } from "@react-three/xr";
import { HTMLMesh } from "three-stdlib";
import { useDebug } from "@/stores/socket";
import { StatsGl } from "./StatsGl";

export default function Debug() {
  const state = useThree((state) => state);
  const session = useXR((state) => state.session);
  const [statsMesh, setStatsMesh] = React.useState();
  const refSpace = React.useRef();
  const ref = React.useRef();
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
      let group;
      if (session && statsElement) {
        const statsMesh = new HTMLMesh(statsElement);
        statsMesh.name = "stats";
        group = new Group();
        group.add(statsMesh);
        state.scene.add(group);
        setStatsMesh(statsMesh);
        const xrReferenceSpace = await session.requestReferenceSpace("local");
        refSpace.current = xrReferenceSpace;
      }
      return () => {
        if (group) {
          group.removeFromParent();
          group?.dispose();
        }
      };
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
    statsMesh.material.color.set("red");
  }

  return (
    <>
      {/* <Stats showPanel={stats ? 0 : -1} className="stats" /> */}
      <StatsGl 
      />
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
      {center &&
        createPortal(
          <mesh ref={ref} name="pinkCenterBall">
            <sphereGeometry args={[0.03, 64, 64]} />
            <meshStandardMaterial color={"hotpink"} />
          </mesh>,
          state.scene
        )}
    </>
  );
}
