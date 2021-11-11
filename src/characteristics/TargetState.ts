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
    const { MANUAL, AUTO } =
      this.platform.Characteristic.TargetAirPurifierState;

    if (!this.device.deviceType.hasAutoMode) {
      return MANUAL;
    }

    await this.device.updateInfo();

    return this.device.mode === Mode.Auto ? AUTO : MANUAL;
  },
  set: async function (value: CharacteristicValue) {
    if (!this.device.deviceType.hasAutoMode) {
      return;
    }

    const { MANUAL, AUTO } =
      this.platform.Characteristic.TargetAirPurifierState;

    switch (value) {
      case AUTO:
        if (this.device.mode !== Mode.Auto) {
          this.device.changeMode(Mode.Auto);
        }
        break;
      case MANUAL:
        if (this.device.mode !== Mode.Manual) {
          this.device.changeMode(Mode.Manual);
        }
        break;
    }
  }
};

export default characteristic;
