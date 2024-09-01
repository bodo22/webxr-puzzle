import {
  BoxGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from "three";

// part of  three.js in higher three.js versions
export default class XRPlanes extends Object3D {
  constructor(renderer) {
    super();

    const matrix = new Matrix4();

    const currentPlanes = new Map();

    const xr = renderer.xr;

    xr.addEventListener("planesdetected", (event) => {
      const frame = event.data;
      const planes = frame.detectedPlanes;

      const referenceSpace = xr.getReferenceSpace();

      let planeschanged = false;

      for (const [plane, mesh] of currentPlanes) {
        if (planes.has(plane) === false) {
          mesh.geometry.dispose();
          mesh.material.dispose();
          this.remove(mesh);

          currentPlanes.delete(plane);

          planeschanged = true;
        }
      }
      let plane = planes[0];
      let currentPosition;
      for (const currPlane of planes) {
        const pose = frame.getPose(currPlane.planeSpace, referenceSpace);
        matrix.fromArray(pose.transform.matrix);
        const position = new Vector3().setFromMatrixPosition(matrix);
        if (!currentPosition) {
          currentPosition = position;
        }
        if (
          new Vector3().distanceTo(position) <
          new Vector3().distanceTo(currentPosition)
        ) {
          currentPosition = position;
          plane = currPlane;
        }
      }

      //   for (const plane of planes) {
      if (plane && currentPlanes.has(plane) === false) {
        const pose = frame.getPose(plane.planeSpace, referenceSpace);
        matrix.fromArray(pose.transform.matrix);

        const polygon = plane.polygon;

        let minX = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let minZ = Number.MAX_SAFE_INTEGER;
        let maxZ = Number.MIN_SAFE_INTEGER;

        for (const point of polygon) {
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          minZ = Math.min(minZ, point.z);
          maxZ = Math.max(maxZ, point.z);
        }

        const width = maxX - minX;
        const height = maxZ - minZ;

        const geometry = new BoxGeometry(width, 0.01, height);
        const material = new MeshBasicMaterial({
          color: 0xffffff * Math.random(),
        });

        const mesh = new Mesh(geometry, material);
        mesh.position.setFromMatrixPosition(matrix);
        mesh.quaternion.setFromRotationMatrix(matrix);
        this.add(mesh);

        currentPlanes.set(plane, mesh);

        planeschanged = true;
      }
      //   }

      if (planeschanged) {
        this.dispatchEvent({ type: "planeschanged" });
      }
    });
  }
}
