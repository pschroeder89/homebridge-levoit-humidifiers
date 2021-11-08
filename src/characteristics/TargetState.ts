import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';
import { Mode } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory.ts';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    const { MANUAL, AUTO } =
      this.platform.Characteristic.TargetAirPurifierState;

    return this.device.mode === Mode.Auto ? AUTO : MANUAL;
  },
  set: async function (value: CharacteristicValue) {
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
