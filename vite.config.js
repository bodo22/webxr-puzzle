import http from "http";
import Cache from "file-system-cache";
import ipUtil from "ip";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";
import jsconfigPaths from "vite-jsconfig-paths";
const hostname = "local-ip.co";
// const hostname = "traefik.me";
const port = 5173;

const addLocalIpLog = () => {
  return {
    name: "custom-log",
    configureServer(server) {
      const { printUrls } = server;
      server.printUrls = () => {
        const ip = ipUtil.address().replaceAll(".", "-");
        server.resolvedUrls["network"].push(
          `https://${ip}.my.${hostname}:${port}/`
          // `https://${ip}.${hostname}:${port}/`
        );
        printUrls();
      };
    },
  };
};

const watchNodeModules = () => {
  return {
    name: "watch-node-modules",
    configureServer(server) {
      console.log(server.watcher.options);
      server.watcher.options = {
        ...server.watcher.options,
        ignored: [
          "**/.git/**",
          /node_modules\/(?!three|@react-three|three-stdlib).*/,
          "**/test-results/**",
          "**/node_modules/.vite/**",
        ],
      };
      console.log(server.watcher.options);
    },
  };
};

async function getFile(path) {
  return new Promise((resolve) => {
    let data = "";
    const uri = `http://${hostname}${path}`;
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
  let cert = await cache.get("cert");
  let key = await cache.get("key");

  if (!cert || !key) {
    cert = await getFile("/cert/server.pem");
    key = await getFile("/cert/server.key");
    // cert = await getFile("/cert.pem");
    // key = await getFile("/privkey.pem");
    await cache.save([
      { key: "cert", value: cert },
      { key: "key", value: key },
    ]);
    console.log("added cert & private key to cache");
  } else {
    console.log("using cert & private key from cache");
  }

  return {
    plugins: [
      react(),
      eslint(),
      jsconfigPaths(),
      addLocalIpLog(),
      watchNodeModules(),
    ],
    server: {
      port,
      watch: {
        ignored: [
          // not working, see https://github.com/vitejs/vite/issues/8619
          // using watchNodeModules instead
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
          target: "http://localhost:3003",
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
