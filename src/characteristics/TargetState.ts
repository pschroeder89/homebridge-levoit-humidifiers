import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import { Mode } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    const { HUMIDIFIER } =
      this.platform.Characteristic.TargetHumidifierDehumidifierState;

    return HUMIDIFIER;
  }
};

export default characteristic;
