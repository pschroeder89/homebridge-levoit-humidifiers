import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';
import { Mode } from '../api/VeSyncFan';
import { DeviceName, NewDevices } from '../api/deviceTypes';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();
    if (this.device.isOn) {
      return this.device.targetHumidity;
    } else {
      return 0;
    }
  },
  set: async function (humidity: CharacteristicValue) {
    if (!this.device.isOn) {
      await this.device.setPower(true);
    }
    if (NewDevices.includes(this.device.name as DeviceName)) {
      await this.device.changeMode(Mode.Humidity);
    } else if (
      this.device.mode == Mode.Manual ||
      (this.device.deviceType.hasWarmMode && this.device.mode == Mode.Sleep)
    ) {
      await this.device.changeMode(Mode.Auto);
    }
    switch (true) {
      case Number(humidity) < this.device.deviceType.minHumidityLevel:
        humidity = this.device.deviceType.minHumidityLevel;
        break;
      case Number(humidity) > this.device.deviceType.maxHumidityLevel:
        humidity = this.device.deviceType.maxHumidityLevel;
        break;
    }
    await this.device.setTargetHumidity(Number(humidity));
  },
};

export default characteristic;
