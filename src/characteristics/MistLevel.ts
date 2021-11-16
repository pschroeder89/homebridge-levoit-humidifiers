import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import VeSyncFan, { Mode } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';

const calculateMistLevel = (device: VeSyncFan) => {
  let mist_level = device.mist_level;
  mist_level = Math.ceil(mist_level * 100 / 9 / 10) * 10;

  return device.isOn ? mist_level : 0;
};

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    return calculateMistLevel(this.device);
  },
  set: async function (value: CharacteristicValue) {
    const intVal = Math.round(Math.ceil(Number(value) / 100 * 9));
    // await this.device.changeMode(Mode.Manual);
    await this.device.changeMistLevel(intVal);
    return intVal;
  }
};

export default characteristic;
