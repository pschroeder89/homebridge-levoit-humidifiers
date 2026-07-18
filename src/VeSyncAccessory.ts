import { Service } from 'homebridge';

import Platform, { VeSyncPlatformAccessory } from './platform';
import CurrentState from './characteristics/CurrentState';
import Humidity from './characteristics/Humidity';
import Active from './characteristics/Active';
import VeSyncFan from './api/VeSyncFan';
import MistLevel from './characteristics/MistLevel';
import TargetState from './characteristics/TargetState';
import SleepState from './characteristics/SleepState';
import LightBrightness from './characteristics/LightBrightness';
import DisplayState from './characteristics/DisplayState';
import TargetHumidity from './characteristics/TargetHumidity';
import LightState from './characteristics/LightState';
import WarmMistLevel from './characteristics/WarmMistLevel';
import WarmActive from './characteristics/WarmActive';
import AutoProState from './characteristics/AutoProState';
import ChildLock from './characteristics/ChildLock';

const HumidifierName = 'Humidifier';
const HumiditySensorName = 'Humidity Sensor';
const MistName = 'Mist';
const CoolMistName = 'Cool Mist';
const WarmMistName = 'Warm Mist';
const NightLightName = 'Night Light';
const SleepModeName = 'Sleep Mode';
const DisplayName = 'Display';
const AutoProModeName = 'AutoPro Mode';

export type AccessoryThisType = ThisType<{
  humidifierService: Service;
  platform: Platform;
  device: VeSyncFan;
  accessory: VeSyncPlatformAccessory;
  updateAllCharacteristics: () => void;
}>;

/**
 * VeSyncAccessory represents a single Levoit humidifier device in HomeKit.
 * It manages all services and characteristics for the device, including background
 * polling to keep device state synchronized without blocking HomeKit read requests.
 */
export default class VeSyncAccessory {
  private readonly humidifierService: Service;
  private readonly humiditySensorService: Service | undefined;
  private readonly lightService: Service | undefined;
  private readonly sleepService: Service | undefined;
  private readonly displayService: Service | undefined;
  private readonly mistService: Service | undefined;
  private readonly warmMistService: Service | undefined;
  private readonly autoProService: Service | undefined;
  private readonly hasChildLock: boolean;

  /**
   * Background polling interval to keep device state fresh.
   * Defaults to 30 seconds to balance freshness with API quota limits, but can be
   * overridden via options.pollingInterval in the config for users hitting VeSync's
   * daily quota (3200 + 1500 * device count), e.g. when sharing quota with another integration.
   * Clamped to a 10-second minimum to avoid hammering the API.
   */
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLLING_INTERVAL_MS: number;

  public get UUID() {
    return this.device.uuid.toString();
  }

  private get device() {
    return this.accessory.context.device;
  }

  constructor(
    private readonly platform: Platform,
    private readonly accessory: VeSyncPlatformAccessory,
  ) {
    const config = platform.config;
    const accessories = config.accessories ? config.accessories : {};
    const configuredPollingSeconds = Number(config.options?.pollingInterval);
    this.POLLING_INTERVAL_MS =
      (Number.isFinite(configuredPollingSeconds) && configuredPollingSeconds > 0
        ? Math.max(configuredPollingSeconds, 10)
        : 30) * 1000;

    this.hasChildLock =
      !!this.device.deviceType.hasChildLock && accessories.child_lock !== false;

    this.setupAccessoryInfo();
    this.humidifierService = this.setupHumidifierService();
    this.mistService = this.setupMistService(accessories);
    this.displayService = this.setupDisplayService(accessories);
    this.humiditySensorService = this.setupHumiditySensorService(accessories);
    this.warmMistService = this.setupWarmMistService(accessories);
    this.sleepService = this.setupSleepService(accessories);
    this.lightService = this.setupLightService(accessories);
    this.autoProService = this.setupAutoProService(accessories);

    this.startPolling();
  }

  private setupAccessoryInfo(): void {
    const { manufacturer, model, mac } = this.device;
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        manufacturer,
      )
      .setCharacteristic(this.platform.Characteristic.Model, model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, mac);
  }

  private setupHumidifierService(): Service {
    let service = this.accessory.getService(HumidifierName);
    if (!service) {
      service = new this.platform.Service.HumidifierDehumidifier(
        HumidifierName,
        HumidifierName,
      );
      this.accessory.addService(service);
    }
    this.ensureConfiguredName(service, HumidifierName);
    service.setPrimaryService(true);

    service
      .getCharacteristic(this.platform.Characteristic.Active)
      .onGet(Active.get.bind(this))
      .onSet(Active.set.bind(this));

    service
      .getCharacteristic(
        this.platform.Characteristic.TargetHumidifierDehumidifierState,
      )
      .setProps({ validValues: [1] })
      .onGet(TargetState.get.bind(this));

    service
      .getCharacteristic(
        this.platform.Characteristic.CurrentHumidifierDehumidifierState,
      )
      .setProps({ validValues: [1, 2] })
      .onGet(CurrentState.get.bind(this));

    service
      .getCharacteristic(
        this.platform.Characteristic.RelativeHumidityHumidifierThreshold,
      )
      .setProps({ minStep: 1, minValue: 0, maxValue: 100 })
      .onGet(TargetHumidity.get.bind(this))
      .onSet(TargetHumidity.set.bind(this));

    service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(Humidity.get.bind(this));

    if (this.hasChildLock) {
      service
        .getCharacteristic(this.platform.Characteristic.LockPhysicalControls)
        .onGet(ChildLock.get.bind(this))
        .onSet(ChildLock.set.bind(this));
    } else if (
      service.testCharacteristic(this.platform.Characteristic.LockPhysicalControls)
    ) {
      // Remove a previously-added characteristic if child_lock was turned off
      // in config (or the cached accessory predates a device-support change).
      service.removeCharacteristic(
        service.getCharacteristic(this.platform.Characteristic.LockPhysicalControls),
      );
    }

    return service;
  }

  /**
   * Sets ConfiguredName on a service, using HAPStorage to track whether the user
   * has customized it. Only sets the default name if no override exists in storage.
   * Persists user renames via the change event.
   */
  private ensureConfiguredName(service: Service, name: string): void {
    const key = `homebridge-levoit-humidifiers-configured-name-${name.replaceAll(' ', '_')}`;
    service.addOptionalCharacteristic(
      this.platform.Characteristic.ConfiguredName,
    );
    if (!this.platform.api.hap.HAPStorage.storage().getItemSync(key)) {
      service.setCharacteristic(
        this.platform.Characteristic.ConfiguredName,
        name,
      );
    }
    service
      .getCharacteristic(this.platform.Characteristic.ConfiguredName)
      .on('change', ({ newValue }) => {
        this.platform.api.hap.HAPStorage.storage().setItemSync(key, newValue);
      });
  }

  /**
   * Gets or creates a service with ConfiguredName support.
   * Returns undefined and removes the service if the accessory config disables it.
   */
  private getOrCreateService(
    serviceType: typeof Service,
    name: string,
    enabled: boolean,
    fallbackName?: string,
  ): Service | undefined {
    if (enabled) {
      let service = this.accessory.getService(name);
      if (!service) {
        service = new serviceType(name, name);
        this.accessory.addService(service);
      }
      this.ensureConfiguredName(service, name);
      return service;
    }

    const existing =
      this.accessory.getService(name) ||
      (fallbackName ? this.accessory.getService(fallbackName) : undefined);
    if (existing) {
      this.platform.log.info(`Removing ${name} service.`);
      this.accessory.removeService(existing);
    }
    return undefined;
  }

  private setupMistService(
    accessories: Record<string, unknown>,
  ): Service | undefined {
    const enabled =
      accessories.mist !== false && accessories.cool_mist !== false;
    const service = this.getOrCreateService(
      this.platform.Service.Fan,
      MistName,
      enabled,
      CoolMistName,
    );

    if (!service) {
      return undefined;
    }

    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(Active.get.bind(this))
      .onSet(Active.set.bind(this));

    service
      .getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .setProps({ minStep: 1, minValue: 0, maxValue: 100 })
      .onGet(MistLevel.get.bind(this))
      .onSet(MistLevel.set.bind(this));

    this.humidifierService.addLinkedService(service);
    return service;
  }

  private setupDisplayService(
    accessories: Record<string, unknown>,
  ): Service | undefined {
    const service = this.getOrCreateService(
      this.platform.Service.Switch,
      DisplayName,
      accessories.display !== false,
    );

    if (!service) {
      return undefined;
    }

    this.humidifierService.addLinkedService(service);
    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(DisplayState.get.bind(this))
      .onSet(DisplayState.set.bind(this));
    return service;
  }

  private setupHumiditySensorService(
    accessories: Record<string, unknown>,
  ): Service | undefined {
    const service = this.getOrCreateService(
      this.platform.Service.HumiditySensor,
      HumiditySensorName,
      accessories.humidity_sensor !== false,
    );

    if (!service) {
      return undefined;
    }

    this.humidifierService.addLinkedService(service);
    service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(Humidity.get.bind(this));
    return service;
  }

  private setupWarmMistService(
    accessories: Record<string, unknown>,
  ): Service | undefined {
    const enabled =
      this.device.deviceType.hasWarmMode && accessories.warm_mist !== false;
    const service = this.getOrCreateService(
      this.platform.Service.Fan,
      WarmMistName,
      enabled,
    );

    if (!service) {
      return undefined;
    }

    this.humidifierService.addLinkedService(service);

    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(WarmActive.get.bind(this))
      .onSet(WarmActive.set.bind(this));

    service
      .getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .setProps({ minStep: 1, minValue: 0, maxValue: 100 })
      .onGet(WarmMistLevel.get.bind(this))
      .onSet(WarmMistLevel.set.bind(this));

    return service;
  }

  private setupSleepService(
    accessories: Record<string, unknown>,
  ): Service | undefined {
    const enabled =
      this.device.deviceType.hasSleepMode && accessories.sleep_mode !== false;
    const service = this.getOrCreateService(
      this.platform.Service.Switch,
      SleepModeName,
      enabled,
    );

    if (!service) {
      return undefined;
    }

    this.humidifierService.addLinkedService(service);
    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(SleepState.get.bind(this))
      .onSet(SleepState.set.bind(this));
    return service;
  }

  private setupLightService(
    accessories: Record<string, unknown>,
  ): Service | undefined {
    const enabled =
      this.device.deviceType.hasLight && accessories.night_light !== false;
    const service = this.getOrCreateService(
      this.platform.Service.Lightbulb,
      NightLightName,
      enabled,
    );

    if (!service) {
      return undefined;
    }

    this.humidifierService.addLinkedService(service);

    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(LightState.get.bind(this))
      .onSet(LightState.set.bind(this));

    const props = this.device.deviceType.hasColorMode
      ? { minValue: 39, maxValue: 100 }
      : {
          minStep: 25,
          minValue: 0,
          maxValue: 100,
          validValues: [0, 25, 50, 75, 100],
        };

    service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .setProps(props)
      .onGet(LightBrightness.get.bind(this))
      .onSet(LightBrightness.set.bind(this));

    return service;
  }

  private setupAutoProService(
    accessories: Record<string, unknown>,
  ): Service | undefined {
    const enabled =
      !!this.device.deviceType.hasAutoProMode && accessories.auto_pro !== false;
    const service = this.getOrCreateService(
      this.platform.Service.Switch,
      AutoProModeName,
      enabled,
    );

    if (!service) {
      return undefined;
    }

    this.humidifierService.addLinkedService(service);
    service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(AutoProState.get.bind(this))
      .onSet(AutoProState.set.bind(this));
    return service;
  }

  /**
   * Starts background polling to periodically update device state.
   * This ensures characteristics always have fresh data without blocking
   * HomeKit read requests, which prevents "slow to respond" warnings.
   */
  private startPolling(): void {
    this.device.updateInfo().catch((err) => {
      this.platform.log.debug(
        `[${this.device.name}] Initial device update failed:`,
        err instanceof Error ? err.message : String(err),
      );
    });

    this.pollingInterval = setInterval(() => {
      this.device.updateInfo().catch((err) => {
        this.platform.log.debug(
          `[${this.device.name}] Background polling update failed:`,
          err instanceof Error ? err.message : String(err),
        );
      });
    }, this.POLLING_INTERVAL_MS);
  }

  /**
   * Stops background polling.
   * Should be called when the accessory is removed to clean up resources.
   */
  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Updates all HomeKit characteristics to match current device state.
   * Call this after any device command to immediately reflect changes in HomeKit.
   */
  public updateAllCharacteristics(): void {
    const { device } = this;

    this.updateHumidifierCharacteristics(device);
    this.updateOptionalServiceCharacteristics(device);
  }

  private updateHumidifierCharacteristics(device: VeSyncFan): void {
    this.humidifierService
      .getCharacteristic(this.platform.Characteristic.Active)
      .updateValue(device.isOn ? 1 : 0);

    this.humidifierService
      .getCharacteristic(
        this.platform.Characteristic.CurrentHumidifierDehumidifierState,
      )
      .updateValue(
        device.isOn
          ? this.platform.Characteristic.CurrentHumidifierDehumidifierState
              .HUMIDIFYING
          : this.platform.Characteristic.CurrentHumidifierDehumidifierState
              .IDLE,
      );

    this.humidifierService
      .getCharacteristic(
        this.platform.Characteristic.RelativeHumidityHumidifierThreshold,
      )
      .updateValue(device.targetHumidity);

    this.humidifierService
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .updateValue(device.humidityLevel);

    if (this.hasChildLock) {
      this.humidifierService
        .getCharacteristic(this.platform.Characteristic.LockPhysicalControls)
        .updateValue(
          device.childLock
            ? this.platform.Characteristic.LockPhysicalControls
                .CONTROL_LOCK_ENABLED
            : this.platform.Characteristic.LockPhysicalControls
                .CONTROL_LOCK_DISABLED,
        );
    }
  }

  private updateOptionalServiceCharacteristics(device: VeSyncFan): void {
    if (this.humiditySensorService) {
      this.humiditySensorService
        .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
        .updateValue(device.humidityLevel);
    }

    if (this.mistService) {
      this.mistService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.isOn);
      const mistPct = device.isOn
        ? Math.round((device.mistLevel / device.deviceType.mistLevels) * 100)
        : 0;
      this.mistService
        .getCharacteristic(this.platform.Characteristic.RotationSpeed)
        .updateValue(mistPct);
    }

    if (this.warmMistService) {
      this.warmMistService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.warmEnabled);
      const maxWarm = device.deviceType.warmMistLevels ?? 0;
      const warmPct =
        device.isOn && maxWarm > 0
          ? Math.round((device.warmLevel / maxWarm) * 100)
          : 0;
      this.warmMistService
        .getCharacteristic(this.platform.Characteristic.RotationSpeed)
        .updateValue(warmPct);
    }

    if (this.lightService) {
      this.lightService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.lightOn === 'on');
      this.lightService
        .getCharacteristic(this.platform.Characteristic.Brightness)
        .updateValue(device.brightnessLevel);
    }

    if (this.displayService) {
      this.displayService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.isOn && device.displayOn);
    }

    if (this.sleepService) {
      this.sleepService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.isOn && device.mode === 'sleep');
    }

    if (this.autoProService) {
      this.autoProService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.isOn && device.mode === 'autoPro');
    }
  }
}
