import {
  CharacteristicGetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

/**
 * TargetState characteristic handler for the Humidifier service.
 * This is a read-only characteristic that always returns HUMIDIFIER (1),
 * as this plugin only supports humidifier mode, not dehumidifier mode.
 *
 * Note: This is a static value and requires no device state lookup.
 */
const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  /**
   * Gets the target humidifier state.
   * Always returns HUMIDIFIER since this plugin only supports humidifiers.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    const { HUMIDIFIER } =
      this.platform.Characteristic.TargetHumidifierDehumidifierState;

    return HUMIDIFIER;
  },
};

export default characteristic;
