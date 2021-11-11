import {
  CharacteristicGetHandler,
  CharacteristicValue,
  Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    await this.device.updateInfo();

    const { FILTER_OK, CHANGE_FILTER } =
      this.platform.Characteristic.FilterChangeIndication;

    return (this.device.filterLife ?? 0) <= 25 ? CHANGE_FILTER : FILTER_OK;
  }
};

export default characteristic;
