import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';
import { Mode } from '../api/VeSyncFan';
import { DevicePrefix, isLV600S } from '../api/deviceTypes';
import { debounceSet } from '../utils/debounce';
import { getErrorMessage } from '../utils/errorMessage';

/**
 * TargetHumidity characteristic handler for the Humidifier service.
 * Controls the target humidity percentage for Auto/Humidity mode.
 *
 * Features:
 * - Automatically switches to Auto/Humidity mode when setting target
 * - Handles LV600S/Oasis special cases (cannot change target in Sleep mode)
 * - Clamps values to device-specific min/max ranges
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets the current target humidity percentage.
   * Returns 0 if the device is off.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    return this.device.isOn ? this.device.targetHumidity : 0;
  },

  /**
   * Sets the target humidity percentage with debouncing.
   * Implements 300ms debounce to batch rapid slider changes from HomeKit.
   *
   * Logic:
   * - Automatically turns device on if it's off
   * - Clamps value to device-specific min/max (30-80% for most, 40-80% for LV600S/Oasis)
   * - Switches to appropriate Auto mode (Auto, AutoPro, or Humidity) if needed
   * - Handles LV600S/Oasis special case: cannot change target in Sleep mode
   */
  set: async function (humidity: CharacteristicValue) {
    const device = this.device;

    debounceSet(
      device.uuid,
      humidity,
      async (finalValue) => {
        try {
          if (finalValue <= 0) {
            await device.setPower(false);
            this.updateAllCharacteristics();
            return;
          }

          if (!device.isOn) {
            await device.setPower(true);
          }

          let h = finalValue;
          if (h < device.deviceType.minHumidityLevel)
            h = device.deviceType.minHumidityLevel;
          if (h > device.deviceType.maxHumidityLevel)
            h = device.deviceType.maxHumidityLevel;

          // Determine correct auto-like mode based on device type
          // LV600S uses "Humidity" mode, others use "Auto" or "AutoPro"
          let autoLikeMode: Mode;
          if (isLV600S(device.model)) {
            autoLikeMode = Mode.Humidity;
          } else if (device.deviceType.hasAutoProMode) {
            autoLikeMode = Mode.AutoPro;
          } else {
            autoLikeMode = Mode.Auto;
          }

          // LV600S / Oasis cannot change target humidity in Sleep mode
          const canSetTargetHumidityInSleep =
            !isLV600S(device.model) &&
            !device.model.startsWith(DevicePrefix.OASIS) &&
            !device.model.startsWith(DevicePrefix.OASIS_1000S);

          // Switch to auto-like mode if currently in Manual or Sleep (for LV600S/Oasis)
          const shouldSwitchToAutoLike =
            device.mode === Mode.Manual ||
            (device.mode === Mode.Sleep && !canSetTargetHumidityInSleep);

          if (shouldSwitchToAutoLike) {
            await device.changeMode(autoLikeMode);
          }

          // Apply the target humidity
          await device.setTargetHumidity(h);

          // Update all HomeKit characteristics immediately
          this.updateAllCharacteristics();
        } catch (err) {
          this.platform.log.debug(
            `[HUMIDITY] debounced set failed: ${getErrorMessage(err)}`,
          );
        }
      },
      (message) => this.platform.log.debug(message),
    );
  },
};

export default characteristic;
