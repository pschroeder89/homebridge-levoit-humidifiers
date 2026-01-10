import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

/**
 * Active characteristic handler for the Humidifier service.
 * Controls the power state of the humidifier (On/Off).
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 * The device state is kept fresh by periodic polling in VeSyncAccessory.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets the current power state of the humidifier.
   * Returns true if the device is on, false if off.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    return this.device.isOn;
  },

  /**
   * Sets the power state of the humidifier.
   * Only sends command if the state is actually changing to avoid unnecessary API calls.
   */
  set: async function (value: CharacteristicValue) {
    const boolValue = value == 1;

    // Only update if state is changing
    if (boolValue !== this.device.isOn) {
      await this.device.setPower(boolValue);
    }
  },
};

export default characteristic;
