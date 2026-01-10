import {
  CharacteristicGetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

/**
 * Humidity characteristic handler.
 * Returns the current relative humidity percentage detected by the device.
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 * The device state is kept fresh by periodic polling in VeSyncAccessory.
 */
const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  /**
   * Gets the current relative humidity percentage.
   * Returns 0 if humidity level is not a valid number.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    if (typeof this.device.humidityLevel !== 'number') {
      return 0;
    }
    return this.device.humidityLevel;
  },
};

export default characteristic;
