import io from "socket.io-client";

// caution: changing this file in dev causes a HMR which does not kill the existing socket on
// connected dev clients, causing the network to clog up

let supported = false;
try {
  supported = await navigator.xr.isSessionSupported("immersive-vr");
} catch (err) {}
const socket = io(undefined, {
  query: `isSessionSupported=${supported}`,
  // query: `isSessionSupported=false`, OculusBrowser
  forceNew: true,
});

export default socket;
