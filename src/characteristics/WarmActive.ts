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
    return this.device.isOn && this.device.warmEnabled;
  },
  set: async function (value: CharacteristicValue) {
    const boolValue = value == 1;
    if (!boolValue) {
      await this.device.changeWarmMistLevel(0);
      await this.device.updateInfo();
    } else if (!this.device.warmEnabled && this.device.warmLevel == 0) {
      /*
                If turning on Warm Mode from Off state, we set it to the highest warmMistLevel value.
                 This is because we can't determine the selected slider number from the WarmMistLevel characteristic.
                 This appears like a bug (from Off, set to lowest level, but it will set to highest level instead),
                 but there's not a good way to handle this since VeSync doesn't have an on/off for Warm Mode, just
                 level selection.
                */
      await this.device.changeWarmMistLevel(
        Number(this.device.deviceType.warmMistLevels),
      );
      await this.device.updateInfo();
    }
  },
};
export default characteristic;
