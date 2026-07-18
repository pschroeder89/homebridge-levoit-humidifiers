import {
  CharacteristicGetHandler,
  CharacteristicSetHandler,
  CharacteristicValue,
  Nullable,
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

/**
 * ChildLock characteristic handler for the Humidifier service's
 * LockPhysicalControls characteristic.
 * Controls the device's physical child lock (locks the buttons on the unit
 * itself; does not affect control from HomeKit or the VeSync app).
 *
 * Unlike other toggles (display, sleep, AutoPro), child lock state is
 * independent of power state - it isn't reset when the device turns off.
 *
 * Note: Uses cached device state from background polling to avoid slow read warnings.
 */
const characteristic: {
  get: CharacteristicGetHandler;
  set: CharacteristicSetHandler;
} & AccessoryThisType = {
  /**
   * Gets whether the physical child lock is currently enabled.
   * Uses cached state to ensure fast response times.
   */
  get: async function (): Promise<Nullable<CharacteristicValue>> {
    // Use cached state - background polling keeps this fresh
    return this.device.childLock
      ? this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
      : this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED;
  },

  /**
   * Sets the physical child lock state.
   */
  set: async function (value: CharacteristicValue) {
    const locked =
      value ===
      this.platform.Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED;
    await this.device.changeChildLock(locked);
    this.updateAllCharacteristics();
  },
};

export default characteristic;
