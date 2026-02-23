import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';
import { AccessoryThisType } from '../VeSyncAccessory';
import { debounceSet } from '../utils/debounce';
import { getErrorMessage } from '../utils/errorMessage';
import { levelToPercent, percentToLevel } from '../utils/levelPercent';

/**
 * WarmMistLevel characteristic handler for the Warm Mist service.
 * Controls the warm mist level (0-3 typically, device-specific).
 *
 * HomeKit displays this as a percentage (0-100%), which we convert to/from
 * device-specific levels (e.g., 0-3 for most models).
 *
 * Features:
 * - Returns 0 if device is off.
 * - Only updates if value actually changed
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets the current warm mist level as a percentage (0-100).
   * Converts from device level (0-3) to percentage.
   * Returns 0 if the device is off.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    if (!this.device.isOn) {
      return 0;
    }
    return levelToPercent(
      this.device.warmLevel,
      this.device.deviceType.warmMistLevels ?? 0,
    );
  },

  /**
   * Sets the warm mist level from a percentage (0-100) with debouncing.
   * Implements 300ms debounce to batch rapid slider changes from HomeKit.
   *
   * Logic:
   * - Converts percentage to device level (0-3)
   * - Clamps value to device-specific range (0 to warmMistLevels)
   * - Only updates if value actually changed to avoid unnecessary API calls
   */
  set: async function (value: CharacteristicValue) {
    const device = this.device;

    debounceSet(
      device.uuid,
      value,
      async (finalValue) => {
        const clamped = percentToLevel(
          finalValue,
          device.deviceType.warmMistLevels ?? 0,
        );

        try {
          // Avoid no-op - only update if value actually changed
          if (device.warmLevel !== clamped) {
            await device.changeWarmMistLevel(clamped);
          }

          // Update all HomeKit characteristics immediately
          this.updateAllCharacteristics();
        } catch (err) {
          this.platform.log.debug(
            `[WARM] debounced set failed: ${getErrorMessage(err)}`,
          );
        }
      },
      (message) => this.platform.log.debug(message),
    );
  },
};

export default characteristic;
