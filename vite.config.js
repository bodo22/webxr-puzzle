import http from "http";
import Cache from "file-system-cache";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";
import jsconfigPaths from "vite-jsconfig-paths";

const url = "http://local-ip.co";

async function getFile(path) {
  return new Promise((resolve) => {
    let data = "";
    const uri = url + path;
    http.get(uri, (res) => {
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve(data);
      });
    });
  });
}

const cache = Cache.default({
  basePath: "./.cache", // Optional. Path where cache files are stored (default).
  // ns: "my-namespace", // Optional. A grouping namespace for items.
});

// https://vitejs.dev/config/
export default defineConfig(async () => {
  // const files = await cache.load();
  // console.log(files);

  let cert = await cache.get("cert");
  let key = await cache.get("key");

  if (!cert || !key) {
    cert = await getFile("/cert/server.pem");
    key = await getFile("/cert/server.key");
    await cache.save([
      { key: "cert", value: cert },
      { key: "key", value: key },
    ]);
    console.log("added cert & private key to cache");
  } else {
    console.log("using cert & private key from cache");
  }

  return {
    plugins: [react(), eslint(), jsconfigPaths()],
    server: {
      watch: {
        ignored: [
          "!**/node_modules/three/**",
          "!**/node_modules/@react-three/fiber/**",
          "!**/node_modules/@react-three/drei/**",
          "!**/node_modules/@react-three/xr/**",
          "!**/node_modules/three-std-lib/**",
        ],
      },
      host: true,
      https: { key, cert },
      proxy: {
        "/socket.io": {
          target: "https://localhost:3003",
          ws: true,
          secure: false,
        },
      },
    },
    optimizeDeps: {
      exclude: [
        "three",
        // "@react-three/drei",
        // "@react-three/fiber",
        // "@react-three/xr",
        // "three-stdlib",
      ],
      // include: ["react-reconciler"],
    },
  };
});
