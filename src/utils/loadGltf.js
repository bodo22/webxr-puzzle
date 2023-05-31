import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Instantiate a loader
const loader = new GLTFLoader();

// Optional: Provide a DRACOLoader instance to decode compressed mesh data

export default function loadGltf(path, cb) {
  loader.load(
    path,
    // called when the resource is loaded
    function (gltf) {
      cb(gltf);
    },
    // called while loading is progressing
    function (xhr) {
      // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    // called when loading has errors
    function (error) {
      console.log("An error happened");
    }
  );
}
