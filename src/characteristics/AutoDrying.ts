import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

/**
 * AutoDrying characteristic handler for the Auto Dry switch.
 * Controls whether the device automatically dries its wick filter after it
 * turns off (prevents mold/odor in evaporative models).
 *
 * Like child lock, this is a persistent device setting independent of power
 * state - the switch reflects the setting even while the device is off.
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets whether automatic drying is enabled.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    return this.device.autoDrying;
  },

  /**
   * Enables or disables automatic drying.
   */
  set: async function (value: CharacteristicValue) {
    await this.device.changeAutoDrying(value as boolean);
    this.updateAllCharacteristics();
  },
};

export default characteristic;
