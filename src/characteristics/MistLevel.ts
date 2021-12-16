import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import VeSyncFan, { Mode } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';

const calculateMistLevel = (device: VeSyncFan) => {
  let current_mist_level = device.mist_level;
  const total_mist_levels = device.deviceType.mistLevels;
  current_mist_level = Math.ceil(current_mist_level * 100 / total_mist_levels / 10) * 10;

  return device.isOn ? current_mist_level : 0;
};

const convertMistLevelFromPerc = (device: VeSyncFan, percentage) => {
  const total_mist_levels = device.deviceType.mistLevels;
  const mist_int = Math.round(Math.ceil(Number(percentage) / 100 *  total_mist_levels));

  return mist_int;
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
    const intVal = convertMistLevelFromPerc(this.device, value);
    await this.device.changeMistLevel(intVal);
  }
};

export default characteristic;
