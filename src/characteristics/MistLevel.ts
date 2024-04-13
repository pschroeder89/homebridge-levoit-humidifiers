import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';
import { Mode } from '../api/VeSyncFan';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();
    return this.device.isOn ? this.device.mistLevel : 0;
  },

  set: async function (value: CharacteristicValue) {
    if (value == 0) {
      await this.device.setPower(false);
    } else {
      if (
        !this.device.deviceType.hasWarmMode ||
        this.device.model.includes('LUH-O601S') // This model has a Warm Mode, but it doesn't support changing mist levels in sleep mode
      ) {
        await this.device.changeMode(Mode.Manual);
      }
      await this.device.changeMistLevel(Number(value));
    }
  },
};

export default characteristic;
