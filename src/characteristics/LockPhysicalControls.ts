import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    const { CONTROL_LOCK_DISABLED, CONTROL_LOCK_ENABLED } =
      this.platform.Characteristic.LockPhysicalControls;

    return this.device.childLock ? CONTROL_LOCK_ENABLED : CONTROL_LOCK_DISABLED;
  },
  set: async function (value: CharacteristicValue) {
    const boolValue = value === 1;

    if (boolValue === this.device.childLock) {
      return;
    }

    await this.device.setChildLock(boolValue);
  }
};

export default characteristic;
