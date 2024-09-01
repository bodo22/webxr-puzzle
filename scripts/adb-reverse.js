// from https://gist.github.com/jamsch/4f335a879429a6490c88c0dd212ea61f
import { execSync } from "child_process";

// run "adb devices"
// execSync(`adb kill-server`);
const result = execSync(`adb devices`);

// Function to extract IP addresses from the command output
function extractIPAddresses(text) {
  // Regular expression to match IPv4 and IPv6 addresses
  const ipRegex =
    /\b(?:\d{1,3}\.){3}\d{1,3}\b|(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}\b/g;
  const ips = text.match(ipRegex);
  return ips || []; // Return the IPs or an empty array if none are found
}

// Parse device ids from result
const devices = result
  .toString("utf8")
  .split("\n")
  .slice(1)
  .map((line) => line.split("\t")[0])
  .filter((line) => line && line.length > 0);
// Go through each device and reverse the port
for (const device of devices) {
  for (const port of [5173]) {
    // check if device is an ip
    let ip;
    if (!device.includes(":")) {
      console.log(device, "not connected via IP");
      console.log(`Reversing port ${port} on device: ${device}`);
      execSync(`adb -s ${device} reverse tcp:${port} tcp:${port}`);
      const ipAddrCmd = `adb -s ${device} shell ip addr show wlan0`;
      const string = execSync(ipAddrCmd).toString("utf8");
      [ip] = extractIPAddresses(string);
      execSync(`adb -s ${device} tcpip 5555`);
      if (ip) {
        ip = `${ip}:5555`;
        console.log("connecting via IP", ip);
        execSync(`adb -s ${device} connect ${ip}`);
      }
    } else {
      ip = device;
    }
    console.log("IP Address:", device, ip);
    if (ip) {
      setTimeout(() => {
        const resultt = execSync(`adb devices`);
        const devicess = resultt.toString("utf8");
        console.log(devicess);
        console.log("reversing tcp for ip", ip, "port", port);
        execSync(`adb -s ${ip} reverse tcp:${port} tcp:${port}`);
      }, 1000)
    }
  }
}
