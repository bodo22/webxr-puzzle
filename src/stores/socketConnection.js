import io from "socket.io-client";

// caution: changing this file in dev causes a HMR which does not kill the existing socket on
// connected dev clients, causing the network to clog up

// https://localhost:5173/?overrideEnv=AR&overrideDebug=all&spectator=true
const { searchParams } = new URL(document.location);

const query = {};
for (let p of searchParams) {
  query[p[0]] = p[1];
}
if (!query.env) {
  query.env = navigator.userAgent.includes("OculusBrowser") ? "VR" : "AR";
}

let supported = false;
try {
  supported = await navigator.xr.isSessionSupported("immersive-vr");
} catch (err) {}
query.isSessionSupported = supported;
const queryString = Object.entries(query).reduce((acc, [key, value]) => {
  acc += `${key}=${value}&`;
  return acc;
}, "");
const socket = io(undefined, {
  query: queryString,
  forceNew: true,
});

export default socket;
