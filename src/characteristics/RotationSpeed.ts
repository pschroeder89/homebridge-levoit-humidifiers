import {
  Characteristic,
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import VeSyncFan, { Mode } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory.ts';

const calculateSpeed = (device: VeSyncFan) => {
  let speed = (device.speed + 1) * 25;
  if (device.mode === Mode.Sleep) {
    speed = 25;
  }

  return device.isOn ? speed : 0;
};

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    return calculateSpeed(this.device);
  },
  set: async function (value: CharacteristicValue) {
    const parsedValue = Math.round(parseInt(value.toString(), 10) / 25);

    if (parsedValue - 1 === this.device.speed) {
      return;
    }

    if (parsedValue === 1) {
      await this.device.changeMode(Mode.Sleep);
    } else if (parsedValue > 1) {
      await this.device.changeSpeed(parsedValue - 1);
    }
  }
};

export default characteristic;
