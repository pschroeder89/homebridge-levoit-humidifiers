import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

/**
 * DisplayState characteristic handler for the Display service.
 * Controls whether the device's display screen is on or off.
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets whether the display is currently on.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    return this.device.displayOn;
  },

  /**
   * Sets the display state (on/off).
   */
  set: async function (value: CharacteristicValue) {
    const boolValue = value == 1;
    await this.device.setDisplay(boolValue);
  },
};

export default characteristic;
