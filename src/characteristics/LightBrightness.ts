import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from "homebridge";

import { AccessoryThisType } from "../VeSyncAccessory";

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();
    return this.device.brightnessLevel;
  },
  set: async function (value: CharacteristicValue) {
    if (this.device.brightnessLevel > 0 && value > 0) {
      // If light is on, and we are applying a non-zero value, change brightness to that level.
      // Otherwise, LightState will handle on / off switching.

      // We allow 39 as a value so 40 doesn't turn off the device.
      // So never set the device to 39, since that's not actually supported
      if (value === 39) {
        value + 1;
      }
      let action: string;
      if (value >= 40) {
        action = "on";
      } else {
        action = "off";
      }
      // Handle Color Mode (RGB) devices
      if (this.device.deviceType.hasColorMode) {
        await this.device.setLightStatus(action, Number(value));
      } else {
        // Other devices
        await this.device.setBrightness(Number(value));
      }
    }
  },
};

export default characteristic;
