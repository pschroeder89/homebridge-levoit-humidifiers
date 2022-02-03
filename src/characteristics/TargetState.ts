import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import { Mode } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // @ts-ignore
    const { HUMIDIFIER, AUTO } =
      this.platform.Characteristic.TargetHumidifierDehumidifierState;

    if (!this.device.deviceType.hasAutoMode) {
      return HUMIDIFIER;
    }

    await this.device.updateInfo();

    return this.device.mode === Mode.Auto ? AUTO : HUMIDIFIER;
  },
  set: async function (value: CharacteristicValue) {
    if (!this.device.deviceType.hasAutoMode) {
      return;
    }

    const { HUMIDIFIER , AUTO } =
      this.platform.Characteristic.TargetHumidifierDehumidifierState;

    switch (value) {
      case AUTO:
        if (this.device.mode !== Mode.Auto) {
          await this.device.changeMode(Mode.Auto);
        }
        break;
      case HUMIDIFIER:
        if (this.device.mode !== Mode.Manual) {
          await this.device.changeMode(Mode.Manual);
        }
        break;
    }
  }
};

export default characteristic;
