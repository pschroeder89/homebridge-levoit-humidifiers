import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

/**
 * LightState characteristic handler for the Night Light service.
 * Controls whether the night light is on or off.
 *
 * 4 brightness levels (0, 25, 50, 75, 100) for non-RGB models.
 * RGB models support continuous brightness from 39-100%.
 *
 * Behavior:
 * - Turning on always sets brightness to 50% (device limitation)
 * - Turning off sets brightness to 0%
 * - RGB models use lightOn attribute as source of truth
 * - Non-RGB models infer state from brightness level
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets whether the night light is currently on.
   * For RGB models, uses lightOn attribute. For others, infers from brightness.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    // If there is a lightOn attribute, that's the source of truth (for RGB models)
    // Otherwise, convert brightness to a bool
    if (this.device.lightOn) {
      return this.device.lightOn === 'on';
    }
    return !!this.device.brightnessLevel;
  },

  /**
   * Sets the night light on/off state.
   * Turning on always sets brightness to 50% (device limitation).
   * Turning off sets brightness to 0%.
   */
  set: async function (bool: CharacteristicValue) {
    const action: string = bool ? 'on' : 'off';
    const lightOnVal = this.device.lightOn;
    const isCurrentlyOff =
      (lightOnVal && lightOnVal === 'off') ||
      (!lightOnVal && this.device.brightnessLevel === 0);
    const isCurrentlyOn =
      (lightOnVal && lightOnVal === 'on') ||
      (!lightOnVal && this.device.brightnessLevel > 0);

    // Turning on: set to 50% brightness (device limitation)
    // Note: Turning on the device will always make brightness 50%, even if you slide to 100% when turning it on.
    if (isCurrentlyOff && bool === 1) {
      if (this.device.deviceType.hasColorMode) {
        // RGB models use setLightStatus
        await this.device.setLightStatus(action, 50);
      } else {
        // Non-RGB models use setBrightness
        await this.device.setBrightness(50);
      }
      this.updateAllCharacteristics();
    }

    // Turning off: set brightness to 0
    if (isCurrentlyOn && bool === 0) {
      if (this.device.deviceType.hasColorMode) {
        await this.device.setLightStatus('off', 50);
      } else {
        await this.device.setBrightness(0);
      }
      this.updateAllCharacteristics();
    }
  },
};

export default characteristic;
