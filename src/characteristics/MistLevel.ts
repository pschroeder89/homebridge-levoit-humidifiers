import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';
import { Mode } from '../api/VeSyncFan';
import { DevicePrefix } from '../api/deviceTypes';
import { debounceSet } from '../utils/debounce';
import { getErrorMessage } from '../utils/errorMessage';
import { levelToPercent, percentToLevel } from '../utils/levelPercent';

/**
 * MistLevel characteristic handler for the Mist service.
 * Controls the cool mist level (0-9 typically, device-specific).
 *
 * HomeKit displays this as a percentage (0-100%), which we convert to/from
 * device-specific levels (e.g., 0-9 for most models).
 *
 * Features:
 * - Level 0 turns the device off
 * - Automatically switches to Manual mode when setting mist level (unless device supports changing in Auto)
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets the current mist level as a percentage (0-100).
   * Converts from device level (0-9) to percentage.
   * Returns 0 if the device is off.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    if (!this.device.isOn) {
      return 0;
    }
    return levelToPercent(this.device.mistLevel, this.device.deviceType.mistLevels);
  },

  /**
   * Sets the mist level from a percentage (0-100) with debouncing.
   * Implements 300ms debounce to batch rapid slider changes from HomeKit.
   *
   * Logic:
   * - Percentage 0 turns the device off
   * - Converts percentage to device level (0-9)
   * - Switches to Manual mode if needed (unless device supports changing mist in Auto mode)
   * - Only updates if the value actually changed
   */
  set: async function (value: CharacteristicValue) {
    const device = this.device;

    debounceSet(
      device.uuid,
      value,
      async (finalValue) => {
        const clamped = percentToLevel(finalValue, device.deviceType.mistLevels);

        try {
          // Level 0 turns device off
          if (clamped === 0) {
            await device.setPower(false);
            this.updateAllCharacteristics();
            return;
          }

          // Most devices need Manual mode, but some (with warm mode, except O601S) can change in Auto
          const needsManual =
            (!device.deviceType.hasWarmMode ||
              device.model.startsWith(DevicePrefix.O601S)) &&
            device.mode !== Mode.Manual;

          if (needsManual) {
            await device.changeMode(Mode.Manual);
          }

          // Only update if value actually changed
          if (device.mistLevel !== clamped) {
            await device.changeMistLevel(clamped);
          }

          // Update all HomeKit characteristics immediately
          this.updateAllCharacteristics();
        } catch (err) {
          // Don't crash the plugin on timer errors; log for debugging
          this.platform.log.debug(
            `[MIST] debounced set failed: ${getErrorMessage(err)}`,
          );
        }
      },
      (message) => this.platform.log.debug(message),
    );
  },
};

export default characteristic;
