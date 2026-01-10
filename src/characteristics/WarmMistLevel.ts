import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';
import VeSyncFan from '../api/VeSyncFan';
import { AccessoryThisType } from '../VeSyncAccessory';
import { debounceSet } from '../utils/debounce';

/**
 * Calculates the warm mist level to display.
 * Returns 0 if device is off.
 */
const calculateWarmMistLevel = (device: VeSyncFan) => {
  const currentWarmLevel = device.warmLevel;
  return device.isOn ? currentWarmLevel : 0;
};

/**
 * WarmMistLevel characteristic handler for the Warm Mist service.
 * Controls the warm mist level (0-3 typically, device-specific).
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
   * Gets the current warm mist level.
   * Returns 0 if the device is off.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    return calculateWarmMistLevel(this.device);
  },

  /**
   * Sets the warm mist level with debouncing.
   * Implements 300ms debounce to batch rapid slider changes from HomeKit.
   *
   * Logic:
   * - Clamps value to device-specific range (0 to warmMistLevels)
   * - Only updates if value actually changed to avoid unnecessary API calls
   */
  set: async function (value: CharacteristicValue) {
    const device = this.device;

    debounceSet(
      device.uuid,
      value,
      async (finalValue) => {
      // Clamp to valid range
      const max = device.deviceType.warmMistLevels ?? 0;
      const clamped = Math.max(0, Math.min(max, finalValue));

      try {
        // Avoid no-op - only update if value actually changed
        if (device.warmLevel !== clamped) {
          await device.changeWarmMistLevel(clamped);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.platform.log.debug(`[WARM] debounced set failed: ${message}`);
      }
    },
      (message) => this.platform.log.debug(message),
    );
  },
};

export default characteristic;
