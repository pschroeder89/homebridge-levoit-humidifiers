import {
  CharacteristicGetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    const { PURIFYING_AIR, INACTIVE } =
      this.platform.Characteristic.CurrentAirPurifierState;

    return this.device.isOn ? PURIFYING_AIR : INACTIVE;
  }
};

export default characteristic;
