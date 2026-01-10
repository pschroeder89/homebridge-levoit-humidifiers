import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

/**
 * WarmActive characteristic handler for the Warm Mist service.
 * Controls whether warm mist is enabled (on/off).
 *
 * Behavior:
 * - Turning off sets warm mist level to 0
 * - Turning on from off state sets to highest level (device limitation - VeSync doesn't have separate on/off)
 * - This may appear like a bug (turning on sets to highest instead of lowest), but it's a VeSync API limitation
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets whether warm mist is currently enabled.
   * Returns true only if device is on AND warm mist is enabled.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    return this.device.isOn && this.device.warmEnabled;
  },

  /**
   * Sets warm mist on/off state.
   * - Off: Sets warm mist level to 0
   * - On: Sets warm mist level to maximum (device limitation - VeSync API doesn't have separate on/off)
   */
  set: async function (value: CharacteristicValue) {
    const boolValue = value == 1;

    if (!boolValue) {
      // Turning off: set warm mist level to 0
      await this.device.changeWarmMistLevel(0);
    } else if (!this.device.warmEnabled && this.device.warmLevel === 0) {
      // Turning on from Off state: set to highest warmMistLevel value
      // This is because we can't determine the selected slider number from the WarmMistLevel characteristic.
      // This appears like a bug (from Off, set to lowest level, but it will set to highest level instead),
      // but there's not a good way to handle this since VeSync doesn't have an on/off for Warm Mode, just
      // level selection.
      await this.device.changeWarmMistLevel(
        Number(this.device.deviceType.warmMistLevels),
      );
    }
  },
};

export default characteristic;
