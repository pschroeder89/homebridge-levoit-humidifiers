import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';
import { debounceSet } from '../utils/debounce';

/**
 * LightBrightness characteristic handler for the Night Light service.
 * Controls the brightness level of the night light (0-100%).
 *
 * Features:
 * - Non-RGB models: 4 levels (0, 25, 50, 75, 100)
 * - RGB models: Continuous range (39-100%, minimum 40% to keep light on)
 * - Only adjusts brightness if light is already on and target is non-zero
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets the current brightness level (0-100%).
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    return this.device.brightnessLevel;
  },

  /**
   * Sets the brightness level with debouncing.
   * Implements 300ms debounce to batch rapid slider changes from HomeKit.
   *
   * Logic:
   * - Only adjusts brightness if light is already on and target is non-zero
   * - LightState characteristic handles turning light on/off
   * - RGB models: Minimum 40% to keep light on (39% is clamped to 40%)
   * - Non-RGB models: Uses discrete levels (0, 25, 50, 75, 100)
   */
  set: async function (value: CharacteristicValue) {
    const device = this.device;

    debounceSet(
      device.uuid,
      value,
      async (finalValue) => {
        // Clamp to HomeKit brightness bounds (0-100)
        let v = Math.max(0, Math.min(100, finalValue));

        try {
          // Only adjust brightness if the light is already on and target is non-zero.
          // LightState handles on/off, so we don't change brightness when turning off.
          if (!(device.brightnessLevel > 0 && v > 0)) return;

          // RGB models: We allow 39 in UI so 40 doesn't turn off the device,
          // but never send 39 to device - clamp to 40
          if (v === 39) v = 40;

          // Determine action based on brightness level
          const action = v >= 40 ? 'on' : 'off';

          if (device.deviceType.hasColorMode) {
            // RGB models use setLightStatus
            await device.setLightStatus(action, v);
          } else {
            // Non-RGB models use setBrightness
            await device.setBrightness(v);
          }

          // Update all HomeKit characteristics immediately
          this.updateAllCharacteristics();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.platform.log.debug(
            `[LIGHT] debounced brightness set failed: ${message}`,
          );
        }
      },
      (message) => this.platform.log.debug(message),
    );
  },
};

export default characteristic;
