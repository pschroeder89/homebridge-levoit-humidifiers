import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import { AirQuality } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory.ts';

const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    return this.device.pm25;
  }
};

export default characteristic;
