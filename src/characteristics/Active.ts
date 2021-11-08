import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory.ts';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    return this.device.isOn;
  },
  set: async function (value: CharacteristicValue) {
    const boolValue = value === 1;

    if (boolValue !== this.device.isOn) {
      this.device.setPower(boolValue);
    }
  }
};

export default characteristic;
