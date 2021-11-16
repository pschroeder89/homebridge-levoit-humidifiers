import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    return this.device.isOn;
  },
  set: async function (value: CharacteristicValue) {
    const boolValue = value === 1;

    if (boolValue !== this.device.isOn) {
      await this.device.setPower(boolValue);
    }
  }
};

export default characteristic;
