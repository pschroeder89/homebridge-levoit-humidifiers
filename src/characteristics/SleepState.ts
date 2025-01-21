import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';
import { Mode } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';
import { DeviceName } from '../api/deviceTypes';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    // If device is off, set the mode to null so the switch displays Off
    if (!this.device.isOn) {
      return false;
    }

    return this.device.mode === Mode.Sleep;
  },
  set: async function (value: CharacteristicValue) {
    switch (value) {
      case true:
        await this.device.changeMode(Mode.Sleep);
        break;
      case false:
        // LEH_S601S_WUS has an auto and humidity mode, we want to revert to humidity for that model since Auto has its own switch
        if (
          [DeviceName.LEH_S601S_WUS, DeviceName.LEH_S601S_WUSR].includes(
            this.device.model as DeviceName,
          )
        ) {
          await this.device.changeMode(Mode.Humidity);
          break;
        } else {
          await this.device.changeMode(Mode.Auto);
          break;
        }
    }
  },
};

export default characteristic;
