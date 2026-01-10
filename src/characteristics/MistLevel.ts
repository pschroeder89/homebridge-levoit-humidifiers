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

/**
 * MistLevel characteristic handler for the Mist service.
 * Controls the cool mist level (0-9 typically, device-specific).
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
   * Gets the current mist level.
   * Returns 0 if the device is off.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    return this.device.isOn ? this.device.mistLevel : 0;
  },

  /**
   * Sets the mist level with debouncing.
   * Implements 300ms debounce to batch rapid slider changes from HomeKit.
   *
   * Logic:
   * - Level 0 turns the device off
   * - Switches to Manual mode if needed (unless device supports changing mist in Auto mode)
   * - Only updates if the value actually changed
   */
  set: async function (value: CharacteristicValue) {
    const device = this.device;

    debounceSet(
      device.uuid,
      value,
      async (finalValue) => {
      // Clamp to valid range
      const max = device.deviceType.mistLevels;
      const clamped = Math.max(0, Math.min(max, finalValue));

      try {
        // Level 0 turns device off
        if (clamped === 0) {
          await device.setPower(false);
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
      } catch (err) {
        // Don't crash the plugin on timer errors; log for debugging
        const message = err instanceof Error ? err.message : String(err);
        this.platform.log.debug(`[MIST] debounced set failed: ${message}`);
      }
    },
      (message) => this.platform.log.debug(message),
    );
  },
};

export default characteristic;
