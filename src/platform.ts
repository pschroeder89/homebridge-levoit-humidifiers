import {
  DynamicPlatformPlugin,
  PlatformAccessory,
  PlatformConfig,
  Characteristic,
  Service,
  Logger,
  API
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import VeSyncAccessory from './VeSyncAccessory.ts';
import VeSyncFan from './api/VeSyncFan';
import VeSync from './api/VeSync';

export interface VeSyncContext {
  name: string;
  device: VeSyncFan;
}

export type VeSyncPlatformAccessory = PlatformAccessory<VeSyncContext>;

export default class Platform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic =
    this.api.hap.Characteristic;

  public readonly cachedAccessories: VeSyncPlatformAccessory[] = [];
  public readonly registeredDevices: VeSyncAccessory[] = [];

  private readonly client: VeSync;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API
  ) {
    const { email, password } = this.config ?? {};

    this.log.debug('Finished initializing platform:', this.config.name);

    this.client = new VeSync(email, password);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: VeSyncPlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.cachedAccessories.push(accessory);
  }

  async discoverDevices() {
    const { email, password } = this.config ?? {};
    if (!email || !password) {
      if (this.cachedAccessories.length > 0) {
        this.api.unregisterPlatformAccessories(
          PLUGIN_NAME,
          PLATFORM_NAME,
          this.cachedAccessories
        );
      }

      return;
    }

    this.log.info('Connecting to the servers...');
    await this.client.login();
    this.log.info('Discovering devices...');

    const devices = await this.client.getDevices();
    await Promise.all(devices.map(this.loadDevice.bind(this)));

    this.checkOldDevices();
  }

  private async loadDevice(device: VeSyncFan) {
    try {
      await device.updateInfo();
      const { uuid, name } = device;

      const existingAccessory = this.cachedAccessories.find(
        (accessory) => accessory.UUID === uuid
      );

      if (existingAccessory) {
        this.log.info(
          'Restoring existing accessory from cache:',
          existingAccessory.displayName
        );

        existingAccessory.context = {
          name,
          device
        };

        this.registeredDevices.push(
          new VeSyncAccessory(this, existingAccessory)
        );

        return;
      }

      this.log.info('Adding new accessory:', name);
      const accessory = new this.api.platformAccessory<VeSyncContext>(
        name,
        uuid
      );
      accessory.context = {
        name,
        device
      };

      this.registeredDevices.push(new VeSyncAccessory(this, accessory));
      return this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory
      ]);
    } catch (error: any) {
      this.log.error(
        `Error for device: ${device.name}:${device.uuid} | ${error.message}`
      );
      return null;
    }
  }

  private checkOldDevices() {
    this.cachedAccessories.map((accessory) => {
      const exists = this.registeredDevices.find(
        (device) => device.UUID === accessory.UUID
      );

      if (!exists) {
        this.log.info('Remove cached accessory:', accessory.displayName);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory
        ]);
      }
    });
  }
}
