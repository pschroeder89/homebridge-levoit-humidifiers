import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import VeSyncFan, { Mode } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';

const calculateSpeed = (device: VeSyncFan) => {
  let speed = (device.speed + 1) * device.deviceType.speedMinStep;
  if (device.mode === Mode.Sleep) {
    speed = device.deviceType.speedMinStep;
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
    const parsedValue = Math.round(
      parseInt(value.toString(), 10) / this.device.deviceType.speedMinStep
    );

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
