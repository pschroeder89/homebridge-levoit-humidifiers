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

  /**
   * Background polling interval to keep device state fresh.
   * Polls every 30 seconds to balance freshness with API quota limits.
   * The VeSync API has daily quotas (3200 + 1500 * device count), so we
   * need to be conservative with polling frequency.
   */
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLLING_INTERVAL_MS = 30000; // 30 seconds

  public get UUID() {
    return this.device.uuid.toString();
  }

  private get device() {
    return this.accessory.context.device;
  }

  /**
   * Gets the valid mist level values for the device.
   * Returns an array containing the range of values from 0 to mistLevels.
   * We add 1 to mistLevels to account for 0 as a potential level.
   *
   * @example The Classic300s has 9 mist levels, so this returns [0,1,2,3,4,5,6,7,8,9]
   */
  private get getMistValues() {
    return [...new Array(this.device.deviceType.mistLevels + 1).keys()];
  }

  /**
   * Gets the valid warm mist level values for the device.
   * Returns an array containing the range of values from 0 to warmMistLevels.
   * We add 1 to warmMistLevels to account for 0 as a potential level.
   *
   * @example The LV600s has 3 warm mist levels, so this returns [0,1,2,3]
   */
  private get getWarmMistValues() {
    return [
      ...new Array((this.device.deviceType.warmMistLevels ?? 0) + 1).keys(),
    ];
  }

  constructor(
    private readonly platform: Platform,
    private readonly accessory: VeSyncPlatformAccessory,
  ) {
    const { manufacturer, model, mac } = this.device;
    const config = platform.config;
    const accessories = config.accessories ? config.accessories : {};
    const mistAccessory =
      accessories.mist !== false && accessories.cool_mist !== false;
    const warmMistAccessory = accessories.warm_mist !== false;
    const nightLightAccessory = accessories.night_light !== false;
    const sleepModeAccessory = accessories.sleep_mode !== false;
    const displayAccessory = accessories.display !== false;
    const autoProAccessory = accessories.auto_pro !== false;
    const humiditySensor = accessories.humidity_sensor !== false;

    // Accessory info
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        manufacturer,
      )
      .setCharacteristic(this.platform.Characteristic.Model, model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, mac);

    // Humidifier service
    this.humidifierService =
      this.accessory.getService(HumidifierName) ||
      this.accessory.addService(
        this.platform.Service.HumidifierDehumidifier,
        HumidifierName,
        HumidifierName,
      );

    this.humidifierService.setPrimaryService(true);

    this.humidifierService
      .getCharacteristic(this.platform.Characteristic.Active)
      .onGet(Active.get.bind(this))
      .onSet(Active.set.bind(this));

    this.humidifierService
      .getCharacteristic(
        this.platform.Characteristic.TargetHumidifierDehumidifierState,
      )
      .setProps({
        validValues: [1],
      })
      .onGet(TargetState.get.bind(this));

    this.humidifierService
      .getCharacteristic(
        this.platform.Characteristic.CurrentHumidifierDehumidifierState,
      )
      .setProps({
        validValues: [1, 2],
      })
      .onGet(CurrentState.get.bind(this));

    this.humidifierService
      .getCharacteristic(
        this.platform.Characteristic.RelativeHumidityHumidifierThreshold,
      )
      .setProps({
        minStep: 1,
        minValue: 0,
        maxValue: 100,
      })
      .onGet(TargetHumidity.get.bind(this))
      .onSet(TargetHumidity.set.bind(this));

    this.humidifierService
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(Humidity.get.bind(this));

    // Mist service
    if (mistAccessory) {
      this.mistService = this.accessory.getService(MistName);
      if (!this.mistService) {
        this.mistService = this.accessory.addService(
          this.platform.Service.Fan,
          MistName,
          MistName,
        );
        this.mistService.setCharacteristic(
          this.platform.Characteristic.Name,
          MistName,
        );
      }

      this.mistService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(Active.get.bind(this))
        .onSet(Active.set.bind(this));

      this.mistService
        .getCharacteristic(this.platform.Characteristic.RotationSpeed)
        .setProps({
          minStep: 1,
          minValue: 0,
          maxValue: this.device.deviceType.mistLevels,
          validValues: this.getMistValues,
        })
        .onGet(MistLevel.get.bind(this))
        .onSet(MistLevel.set.bind(this));
      this.humidifierService.addLinkedService(this.mistService);
    } else {
      this.mistService =
        this.accessory.getService(MistName) ||
        this.accessory.getService(CoolMistName);
      if (this.mistService) {
        this.platform.log.info(`Removing ${MistName} service.`);
        this.accessory.removeService(this.mistService);
      }
    }

    // Display Switch service
    if (displayAccessory) {
      this.displayService = this.accessory.getService(DisplayName);
      if (!this.displayService) {
        this.displayService = this.accessory.addService(
          this.platform.Service.Switch,
          DisplayName,
          DisplayName,
        );
        this.displayService.setCharacteristic(
          this.platform.Characteristic.Name,
          DisplayName,
        );
      }

      this.humidifierService.addLinkedService(this.displayService);

      this.displayService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(DisplayState.get.bind(this))
        .onSet(DisplayState.set.bind(this));
    } else {
      this.displayService = this.accessory.getService(DisplayName);
      if (this.displayService) {
        this.platform.log.info(`Removing ${DisplayName} service.`);
        this.accessory.removeService(this.displayService);
      }
    }

    // Humidity Sensor service
    if (humiditySensor) {
      this.humiditySensorService =
        this.accessory.getService(HumiditySensorName);
      if (!this.humiditySensorService) {
        this.humiditySensorService = this.accessory.addService(
          this.platform.Service.HumiditySensor,
          HumiditySensorName,
          HumiditySensorName,
        );
        this.humiditySensorService.setCharacteristic(
          this.platform.Characteristic.Name,
          HumiditySensorName,
        );
      }

      this.humidifierService.addLinkedService(this.humiditySensorService);

      this.humiditySensorService
        .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
        .onGet(Humidity.get.bind(this));
    } else {
      this.humiditySensorService =
        this.accessory.getService(HumiditySensorName);
      if (this.humiditySensorService) {
        this.platform.log.info(`Removing ${HumiditySensorName} service.`);
        this.accessory.removeService(this.humiditySensorService);
      }
    }

    // Warm Mist service
    if (this.device.deviceType.hasWarmMode && warmMistAccessory) {
      this.warmMistService = this.accessory.getService(WarmMistName);
      if (!this.warmMistService) {
        this.warmMistService = this.accessory.addService(
          this.platform.Service.Fan,
          WarmMistName,
          WarmMistName,
        );
        this.warmMistService.setCharacteristic(
          this.platform.Characteristic.Name,
          WarmMistName,
        );
      }

      this.humidifierService.addLinkedService(this.warmMistService);

      this.warmMistService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(WarmActive.get.bind(this))
        .onSet(WarmActive.set.bind(this));

      this.warmMistService
        .getCharacteristic(this.platform.Characteristic.RotationSpeed)
        .setProps({
          minStep: 1,
          minValue: 0,
          maxValue: this.device.deviceType.warmMistLevels,
          validValues: this.getWarmMistValues,
        })
        .onGet(WarmMistLevel.get.bind(this))
        .onSet(WarmMistLevel.set.bind(this));
    } else {
      this.warmMistService = this.accessory.getService(WarmMistName);
      if (this.warmMistService) {
        this.platform.log.info(`Removing ${WarmMistName} service.`);
        this.accessory.removeService(this.warmMistService);
      }
    }

    // Sleep Mode service
    if (this.device.deviceType.hasSleepMode && sleepModeAccessory) {
      this.sleepService = this.accessory.getService(SleepModeName);
      if (!this.sleepService) {
        this.sleepService = this.accessory.addService(
          this.platform.Service.Switch,
          SleepModeName,
          SleepModeName,
        );
        this.sleepService.setCharacteristic(
          this.platform.Characteristic.Name,
          SleepModeName,
        );
      }

      this.humidifierService.addLinkedService(this.sleepService);

      this.sleepService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(SleepState.get.bind(this))
        .onSet(SleepState.set.bind(this));
    } else {
      this.sleepService = this.accessory.getService(SleepModeName);
      if (this.sleepService) {
        this.platform.log.info(`Removing ${SleepModeName} service.`);
        this.accessory.removeService(this.sleepService);
      }
    }

    // Night Light service
    if (this.device.deviceType.hasLight && nightLightAccessory) {
      this.lightService = this.accessory.getService(NightLightName);
      if (!this.lightService) {
        this.lightService = this.accessory.addService(
          this.platform.Service.Lightbulb,
          NightLightName,
          NightLightName,
        );
        this.lightService.setCharacteristic(
          this.platform.Characteristic.Name,
          NightLightName,
        );
      }

      this.humidifierService.addLinkedService(this.lightService);

      this.lightService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(LightState.get.bind(this))
        .onSet(LightState.set.bind(this));

      let props: object;
      if (this.device.deviceType.hasColorMode) {
        props = {
          minValue: 39,
          maxValue: 100,
        };
      } else {
        props = {
          minStep: 25,
          minValue: 0,
          maxValue: 100,
          validValues: [0, 25, 50, 75, 100],
        };
      }

      this.lightService
        .getCharacteristic(this.platform.Characteristic.Brightness)
        .setProps(props)
        .onGet(LightBrightness.get.bind(this))
        .onSet(LightBrightness.set.bind(this));
    } else {
      this.lightService = this.accessory.getService(NightLightName);
      if (this.lightService) {
        this.platform.log.info(`Removing ${NightLightName} service.`);
        this.accessory.removeService(this.lightService);
      }
    }
    // AutoPro Switch service
    if (this.device.deviceType.hasAutoProMode && autoProAccessory) {
      this.autoProService = this.accessory.getService(AutoProModeName);
      if (!this.autoProService) {
        this.autoProService = this.accessory.addService(
          this.platform.Service.Switch,
          AutoProModeName,
          AutoProModeName,
        );
        this.autoProService.setCharacteristic(
          this.platform.Characteristic.Name,
          AutoProModeName,
        );
      }

      this.humidifierService.addLinkedService(this.autoProService);

      this.autoProService
        .getCharacteristic(this.platform.Characteristic.On)
        .onGet(AutoProState.get.bind(this))
        .onSet(AutoProState.set.bind(this));
    } else {
      this.autoProService = this.accessory.getService(AutoProModeName);
      if (this.autoProService) {
        this.platform.log.info(`Removing ${AutoProModeName} service.`);
        this.accessory.removeService(this.autoProService);
      }
    }

    // Start background polling to keep device state fresh
    // This prevents slow read handler warnings by ensuring data is cached
    this.startPolling();
  }

  /**
   * Starts background polling to periodically update device state.
   * This ensures characteristics always have fresh data without blocking
   * HomeKit read requests, which prevents "slow to respond" warnings.
   */
  private startPolling(): void {
    // Initial update to populate cache
    this.device.updateInfo().catch((err) => {
      this.platform.log.debug(
        `[${this.device.name}] Initial device update failed:`,
        err instanceof Error ? err.message : String(err),
      );
    });

    // Set up periodic polling
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
   * Note: Currently not automatically called, but available for future cleanup needs.
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
   * This ensures the Home app shows updated values without requiring a refresh.
   */
  public updateAllCharacteristics(): void {
    const { device } = this;

    // Update humidifier service characteristics
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
      .updateValue(device.isOn ? device.targetHumidity : 0);

    this.humidifierService
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .updateValue(device.humidityLevel);

    // Update humidity sensor if it exists
    if (this.humiditySensorService) {
      this.humiditySensorService
        .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
        .updateValue(device.humidityLevel);
    }

    // Update mist service if it exists
    if (this.mistService) {
      this.mistService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.isOn);
      this.mistService
        .getCharacteristic(this.platform.Characteristic.RotationSpeed)
        .updateValue(device.mistLevel);
    }

    // Update warm mist service if it exists
    if (this.warmMistService) {
      this.warmMistService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.warmEnabled);
      this.warmMistService
        .getCharacteristic(this.platform.Characteristic.RotationSpeed)
        .updateValue(device.warmLevel);
    }

    // Update night light service if it exists
    if (this.lightService) {
      this.lightService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.lightOn === 'on');
      this.lightService
        .getCharacteristic(this.platform.Characteristic.Brightness)
        .updateValue(device.brightnessLevel);
    }

    // Update display service if it exists
    if (this.displayService) {
      this.displayService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.isOn && device.displayOn);
    }

    // Update sleep mode service if it exists
    if (this.sleepService) {
      this.sleepService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.isOn && device.mode === 'sleep');
    }

    // Update AutoPro mode service if it exists
    if (this.autoProService) {
      this.autoProService
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(device.isOn && device.mode === 'autoPro');
    }
  }
}
