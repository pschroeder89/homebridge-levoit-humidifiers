import {
  CharacteristicGetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import { AirQuality } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    switch (this.device.airQualityLevel) {
      case AirQuality.VERY_GOOD:
        return 1;
      case AirQuality.GOOD:
        return 2;
      case AirQuality.MODERATE:
        return 4;
      case AirQuality.POOR:
        return 5;
      default:
        return 0;
    }
  }
};

export default characteristic;
