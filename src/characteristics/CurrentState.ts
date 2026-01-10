import {
  CharacteristicGetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';
import { Mode } from '../api/VeSyncFan';

/**
 * CurrentState characteristic handler for the Humidifier service.
 * Indicates whether the humidifier is currently humidifying or idle.
 *
 * Returns:
 * - IDLE: Device is off, target reached, or in Manual mode
 * - HUMIDIFYING: Device is on and actively humidifying (in Auto/Humidity/Sleep mode)
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  /**
   * Gets the current humidifier state (IDLE or HUMIDIFYING).
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    const { HUMIDIFYING, IDLE } =
      this.platform.Characteristic.CurrentHumidifierDehumidifierState;

    // Device is idle if:
    // - Target humidity has been reached
    // - Device is off
    // - Device is in Manual mode
    if (
      this.device.targetReached ||
      !this.device.isOn ||
      this.device.mode == Mode.Manual
    ) {
      return IDLE;
    } else {
      return HUMIDIFYING;
    }
  },
};

export default characteristic;
