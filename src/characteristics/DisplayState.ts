import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();
    if (this.device.displayOn) {
      return true;
    } else {
      return false;
    }
  },
  set: async function (value: CharacteristicValue) {
    const boolValue = value == 1;
    await this.device.setDisplay(boolValue);
  },
};

export default characteristic;
