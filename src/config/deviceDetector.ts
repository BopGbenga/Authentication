import DeviceDetector from "node-device-detector";
import deviceDetector from "node-device-detector";

export const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
});
