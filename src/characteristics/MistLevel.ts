import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import VeSyncFan from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';

const calculateMistLevel = (device: VeSyncFan) => {
  let currentMistLevel = device.mistLevel;
  const totalMistLevels = device.deviceType.mistLevels;
  currentMistLevel = currentMistLevel * 100 / totalMistLevels;

  return device.isOn ? currentMistLevel : 0;
};

const convertMistLevelFromPerc = (device: VeSyncFan, percentage) => {
  const totalMistLevels = device.deviceType.mistLevels;
  const mistInt = Math.round(Math.ceil(Number(percentage) / 100 *  totalMistLevels));

  return mistInt;
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
