import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';
import { Mode } from '../api/VeSyncFan';

import { AccessoryThisType } from '../VeSyncAccessory';

/**
 * SleepState characteristic handler for the Sleep Mode service.
 * Controls whether the device is in Sleep Mode or Auto Mode.
 *
 * - Sleep Mode switches device between Sleep Mode (On) and Auto Mode (Off)
 * - Sleep Mode Target Humidity is controlled by Target Humidity slider, except on LV600s/Oasis
 * - On LV600s/Oasis, Sleep Mode Target Humidity is set by VeSync at 50–60% and cannot be changed
 * - LV600s/Oasis turns off Warm Mist by default in Sleep Mode to keep quiet
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets whether the device is in Sleep Mode.
   * Returns false if device is off (so switch displays Off).
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    // If device is off, return false so the switch displays Off
    if (!this.device.isOn) {
      return false;
    }

    return this.device.mode === Mode.Sleep;
  },

  /**
   * Sets Sleep Mode state.
   * - On: Switches to Sleep Mode
   * - Off: Switches to Humidity Mode (if supported) or Auto Mode
   */
  set: async function (value: CharacteristicValue) {
    switch (value) {
      case true:
        await this.device.changeMode(Mode.Sleep);
        this.updateAllCharacteristics();
        break;
      case false: {
        const fallback = this.device.deviceType.hasHumidityMode
          ? Mode.Humidity
          : Mode.Auto;
        await this.device.changeMode(fallback);
        this.updateAllCharacteristics();
        break;
      }
    }
  },
};

export default characteristic;
