import * as React from "react";
import {
  addEffect,
  addAfterEffect,
  useThree,
  useFrame,
} from "@react-three/fiber";
import Stats from "stats-gl";
import useSocket, { useLog } from "@/stores/socket";

export function StatsGl({ className, parent, ...props }) {
  const gl = useThree((state) => state.gl);
  const log = useLog();

  const stats = React.useMemo(() => {
    const statsGl = new Stats({
      logsPerSecond: 20,
      samplesLog: 20,
      samplesGraph: 20,
      precision: 2,
      horizontal: false,
      minimal: false,
      mode: 0,
    });
    statsGl.init(gl.domElement);
    return statsGl;
  }, [gl]);
  const objectOrientation = useSocket((state) => state.objectOrientation);
  const level = useSocket((state) => state.level);

  useFrame((state, delta, xrFrame) => {
    const time = (performance || Date).now();

    if (time >= stats.prevTime + 1000) {
      const memory = performance.memory;
      log({
        type: "fps",
        frame: stats.frame,
        // averageCpu: stats.averageCpu,
        // averageGpu: stats.averageGpu,
        disjoint: stats.disjoint,
        beginTime: stats.beginTime,
        frames: stats.frames,
        logsPerSecond: stats.logsPerSecond,
        precision: stats.precision,
        prevCpuTime: stats.prevCpuTime,
        prevTime: stats.prevTime,
        samplesGraph: stats.samplesGraph,
        samplesLog: stats.samplesLog,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
        predictedDisplayTime: xrFrame?.predictedDisplayTime,
        objectOrientation,
        level,
      });
    }
  });

  React.useEffect(() => {
    if (stats) {
      const node = parent?.current || document.body;
      node?.appendChild(stats.container);
      if (className)
        stats.container.classList.add(
          ...className.split(" ").filter((cls) => cls)
        );
      const begin = addEffect(() => stats.begin());
      const end = addAfterEffect(() => stats.end());
      return () => {
        node?.removeChild(stats.container);
        begin();
        end();
      };
    }
  }, [parent, stats, className]);
  return null;
}
