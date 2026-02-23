import {
  DynamicPlatformPlugin,
  PlatformAccessory,
  PlatformConfig,
  Characteristic,
  Service,
  Logger,
  API,
  UnknownContext,
} from 'homebridge';
import * as path from 'node:path';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { getErrorMessage } from './utils/errorMessage';
import VeSyncAccessory from './VeSyncAccessory';
import VeSyncFan from './api/VeSyncFan';
import DebugMode from './debugMode';
import VeSync from './api/VeSync';

export interface VeSyncContext {
  name: string;
  device: VeSyncFan;
}

export type VeSyncPlatformAccessory = PlatformAccessory<VeSyncContext>;

/**
 * Platform class that manages the Levoit Humidifiers Homebridge plugin.
 * Handles device discovery, accessory registration, and lifecycle management.
 */
export default class Platform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic =
    this.api.hap.Characteristic;

  /** Cached accessories loaded from Homebridge's persistent storage */
  public readonly cachedAccessories: VeSyncPlatformAccessory[] = [];

  /** Currently registered and active device accessories */
  public readonly registeredDevices: VeSyncAccessory[] = [];

  public readonly debugger: DebugMode;
  private readonly client: VeSync;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    const { email, password } = this.config ?? {};
    // Support backwards compatibility: check top-level first, then options
    const enableDebugMode =
      (this.config as { enableDebugMode?: boolean }).enableDebugMode ??
      this.config.options?.enableDebugMode ??
      false;

    this.debugger = new DebugMode(!!enableDebugMode, this.log);
    this.debugger.debug('[PLATFORM]', 'Debug mode enabled');

    const storagePath = this.api.user.storagePath();
    const defaultSessionPath = path.join(
      storagePath,
      'homebridge-levoit-humidifiers.session.json',
    );
    const sessionPath = this.config.options?.sessionPath || defaultSessionPath;
    this.debugger.debug('[PLATFORM]', `Using sessionPath=${sessionPath}`);

    this.client = new VeSync(
      email,
      password,
      this.config,
      this.debugger,
      log,
      sessionPath,
    );

    this.api.on('didFinishLaunching', () => {
      this.discoverDevices();
    });
  }

  /**
   * Called by Homebridge when it loads cached accessories from persistent storage.
   * These accessories will be restored if they're still present during device discovery.
   */
  configureAccessory(accessory: PlatformAccessory<UnknownContext>) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.cachedAccessories.push(accessory as VeSyncPlatformAccessory);
  }

  /**
   * Discovers and loads all Levoit humidifier devices from VeSync.
   * Called automatically when Homebridge finishes launching.
   *
   * Process:
   * 1. Validates credentials
   * 2. Authenticates with VeSync API
   * 3. Fetches device list
   * 4. Loads/restores each device as an accessory
   * 5. Removes accessories for devices that no longer exist
   */
  async discoverDevices() {
    const { email, password } = this.config ?? {};
    if (!email || !password) {
      // If credentials are missing, remove all cached accessories
      if (this.cachedAccessories.length > 0) {
        this.debugger.debug(
          '[PLATFORM]',
          'Removing cached accessories because the email and password are not set (Count:',
          `${this.cachedAccessories.length})`,
        );
        this.api.unregisterPlatformAccessories(
          PLUGIN_NAME,
          PLATFORM_NAME,
          this.cachedAccessories,
        );
      }

      this.log.error('The email and password are not correct!');
      return;
    }

    try {
      this.log.info('Connecting to the VeSync servers...');
      const ok = await this.client.startSession();

      if (!ok) {
        this.log.error(
          'VeSync login failed – enable debug mode and check logs for [LOGIN]/[SESSION] messages.',
        );
        return;
      }

      this.log.info('Discovering devices...');

      // Fetch all devices from VeSync, apply exclusions, and load as accessories
      const allDevices = await this.client.getDevices();
      const devices = allDevices.filter((d) => !this.isDeviceExcluded(d));
      if (allDevices.length !== devices.length) {
        this.log.info(
          `Excluded ${allDevices.length - devices.length} device(s) based on config.`,
        );
      }
      await Promise.all(devices.map(this.loadDevice.bind(this)));

      // Track which device UUIDs were successfully loaded
      const loadedDeviceUUIDs = new Set(devices.map((device) => device.uuid));

      // Remove accessories for devices that no longer exist
      this.checkOldDevices(loadedDeviceUUIDs);
    } catch (err: unknown) {
      this.log.error(
        'Unexpected error during device discovery:',
        getErrorMessage(err),
      );
    }
  }

  /**
   * Loads a single device as a Homebridge accessory.
   * Either restores an existing cached accessory or creates a new one.
   *
   * @param device The VeSync device to load
   */
  private async loadDevice(device: VeSyncFan) {
    try {
      // Update device info to get current state
      await device.updateInfo();
      const { uuid, name } = device;

      // Check if this device was previously cached
      const existingAccessory = this.cachedAccessories.find(
        (accessory) => accessory.UUID === uuid,
      );

      if (existingAccessory) {
        // Restore existing accessory from cache
        this.log.info(
          'Restoring existing accessory from cache:',
          existingAccessory.displayName,
        );

        existingAccessory.context = {
          name,
          device,
        };

        // Create VeSyncAccessory instance (starts background polling)
        this.registeredDevices.push(
          new VeSyncAccessory(this, existingAccessory),
        );

        return;
      }

      // Create new accessory for newly discovered device
      this.log.info('Adding new accessory:', name);
      const accessory = new this.api.platformAccessory<VeSyncContext>(
        name,
        uuid,
      );
      accessory.context = {
        name,
        device,
      };

      // Create VeSyncAccessory instance (starts background polling) and register with Homebridge
      this.registeredDevices.push(new VeSyncAccessory(this, accessory));
      return this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
    } catch (error: unknown) {
      this.log.error(
        `Error for device: ${device.name}:${device.uuid} | ${getErrorMessage(error)}`,
      );
      return null;
    }
  }

  private isDeviceExcluded(device: VeSyncFan): boolean {
    const exclude = this.config.exclude;
    if (!exclude) {
      return false;
    }
    const names: string[] = exclude.name ?? [];
    const models: string[] = exclude.model ?? [];
    const ids: string[] = exclude.id ?? [];

    if (names.includes(device.name)) {
      return true;
    }
    if (models.some((m: string) => device.model.includes(m))) {
      return true;
    }
    if (ids.includes(device.uuid) || ids.includes(device.cid)) {
      return true;
    }
    return false;
  }

  /**
   * Removes accessories for devices that no longer exist.
   * Compares cached accessories against currently registered devices
   * and unregisters any that are no longer present.
   *
   * Note: When accessories are unregistered, their polling intervals
   * will be cleaned up automatically when the VeSyncAccessory instances
   * are garbage collected.
   *
   * @param loadedDeviceUUIDs - Set of UUIDs for devices that were successfully loaded
   */
  private checkOldDevices(loadedDeviceUUIDs: Set<string>) {
    this.cachedAccessories.forEach((accessory) => {
      const exists = loadedDeviceUUIDs.has(accessory.UUID);

      if (!exists) {
        this.log.info('Removing accessory:', accessory.displayName);
        const registered = this.registeredDevices.find(
          (d) => d.accessory.UUID === accessory.UUID,
        );
        registered?.stopPolling();
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
        const cachedIdx = this.cachedAccessories.indexOf(accessory);
        if (cachedIdx > -1) {
          this.cachedAccessories.splice(cachedIdx, 1);
        }
        if (registered) {
          const regIdx = this.registeredDevices.indexOf(registered);
          if (regIdx > -1) {
            this.registeredDevices.splice(regIdx, 1);
          }
        }
      }
    });
  }
}
