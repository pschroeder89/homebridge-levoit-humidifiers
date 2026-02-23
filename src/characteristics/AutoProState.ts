import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';
import { Mode } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';

/**
 * AutoProState characteristic handler for the AutoPro Mode service.
 * Controls whether the device is in AutoPro Mode.
 *
 * AutoPro Mode is available on certain models (e.g., Superior 6000S) and provides
 * fully automatic humidity control (device chooses both target and fan speed).
 *
 * Behavior:
 * - On: Switches to AutoPro Mode
 * - Off: Switches to Humidity Mode (if supported) or Manual Mode
 * - Returns false if device is off (so switch displays Off)
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets whether the device is in AutoPro Mode.
   * Returns false if device is off (so switch displays Off).
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    // If device is off, return false so the switch displays Off
    if (!this.device.isOn) {
      return false;
    }

    return this.device.mode === Mode.AutoPro;
  },

  /**
   * Sets AutoPro Mode state.
   * - On: Switches to AutoPro Mode (device controls everything)
   * - Off: Switches to Humidity Mode (user target, smart fan) if available,
   *        otherwise Manual Mode
   */
  set: async function (value: CharacteristicValue) {
    switch (value) {
      case true:
        await this.device.changeMode(Mode.AutoPro);
        this.updateAllCharacteristics();
        break;
      case false: {
        const fallback = this.device.deviceType.hasHumidityMode
          ? Mode.Humidity
          : Mode.Manual;
        await this.device.changeMode(fallback);
        this.updateAllCharacteristics();
        break;
      }
    }
  },
};

export default characteristic;
