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

    const { HUMIDIFYING, IDLE } =
      this.platform.Characteristic.CurrentHumidifierDehumidifierState;

    return this.device.isOn ? HUMIDIFYING : IDLE;
  }
};

export default characteristic;
