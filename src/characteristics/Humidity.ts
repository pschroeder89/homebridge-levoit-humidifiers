import {
  CharacteristicGetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();
    if (typeof this.device.humidityLevel !== 'number') {
      return 0;
    }
    return this.device.humidityLevel;
  },
};

export default characteristic;
