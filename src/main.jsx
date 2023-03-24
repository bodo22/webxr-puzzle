// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App'
import "./index.css";

// timeout needed when debugging holelens
// reason: the only hololens devtools access over the network i found
// currently works with chii, which needs to load first and initialize
// to monitor requests the app makes
// setTimeout(async () => {
const React = await import("react");
const ReactDOM = await import("react-dom/client");
const { default: App } = await import("./App");
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// }, 5000);
