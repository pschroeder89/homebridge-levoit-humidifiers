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
 * In Auto/Humidity/Sleep modes, compares current vs target humidity to determine
 * HUMIDIFYING (actively misting) vs IDLE (target reached). In Manual mode, always
 * reports HUMIDIFYING while the device is on.
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
} & AccessoryThisType = {
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    const { HUMIDIFYING, IDLE } =
      this.platform.Characteristic.CurrentHumidifierDehumidifierState;

    if (!this.device.isOn) {
      return IDLE;
    }

    if (this.device.mode === Mode.Manual) {
      return HUMIDIFYING;
    }

    // In auto-like modes, check if target has been reached
    if (
      this.device.targetReached ||
      this.device.humidityLevel >= this.device.targetHumidity
    ) {
      return IDLE;
    }

    return HUMIDIFYING;
  },
};

export default characteristic;
