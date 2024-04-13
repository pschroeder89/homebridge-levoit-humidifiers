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
}>;

export default class VeSyncAccessory {
  private humidifierService: Service;
  private humiditySensorService: Service | undefined;
  private lightService: Service | undefined;
  private sleepService: Service | undefined;
  private displayService: Service | undefined;
  private mistService: Service | undefined;
  private warmMistService: Service | undefined;
  private autoProService: Service | undefined;

  public get UUID() {
    return this.device.uuid.toString();
  }

  private get device() {
    return this.accessory.context.device;
  }

  private get getMistValues() {
    /*
        Determines the number of mist level values to slide through in the Mist Level slider.
        Returns an array that contains the range of values between 1 and (mistLevels + 1).
        We add 1 to mistLevels to account for 0 as a potential level.
        Example: The Classic300s has 9 mist levels, so this function returns [0,1,2,3,4,5,6,7,8,9].
         */
    const arr = [...Array(this.device.deviceType.mistLevels + 1).keys()];

    return arr;
  }

  private get getWarmMistValues() {
    /*
        Determines the number of mist level values to slide through in the Warm Mist Level slider.
        Returns an array that contains the range of values between 1 and (warmMistLevels + 1).
        We add 1 to warmMistLevels to account for 0 as a potential level.
        Example: The LV600s has 3 warm mist levels, so this function returns [0,1,2,3].
         */

    const arr = [
      ...Array((this.device.deviceType.warmMistLevels ?? 0) + 1).keys(),
    ];
    return arr;
  }

  constructor(
    private readonly platform: Platform,
    private readonly accessory: VeSyncPlatformAccessory,
  ) {
    const { manufacturer, model, mac } = this.device;
    const config = platform.config;
    const accessories = config.accessories ? config.accessories : {};
    const mistAccessory =
      accessories.mist != false && accessories.cool_mist != false;
    const warmMistAccessory = accessories.warm_mist != false;
    const nightLightAccessory = accessories.night_light != false;
    const sleepModeAccessory = accessories.sleep_mode != false;
    const displayAccessory = accessories.display != false;
    const autoProAccessory = accessories.auto_pro != false;
    const humiditySensor = accessories.humidity_sensor != false;

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
      this.mistService =
        this.accessory.getService(MistName) ||
        this.accessory.addService(
          this.platform.Service.Fan,
          MistName,
          MistName,
        );

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
      this.displayService =
        this.accessory.getService(DisplayName) ||
        this.accessory.addService(
          this.platform.Service.Switch,
          DisplayName,
          DisplayName,
        );

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
        this.accessory.getService(HumiditySensorName) ||
        this.accessory.addService(
          this.platform.Service.HumiditySensor,
          HumiditySensorName,
          HumiditySensorName,
        );

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
      this.warmMistService =
        this.accessory.getService(WarmMistName) ||
        this.accessory.addService(
          this.platform.Service.Fan,
          WarmMistName,
          WarmMistName,
        );

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
      this.sleepService =
        this.accessory.getService(SleepModeName) ||
        this.accessory.addService(
          this.platform.Service.Switch,
          SleepModeName,
          SleepModeName,
        );

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
      this.lightService =
        this.accessory.getService(NightLightName) ||
        this.accessory.addService(
          this.platform.Service.Lightbulb,
          NightLightName,
          NightLightName,
        );

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
      this.autoProService =
        this.accessory.getService(AutoProModeName) ||
        this.accessory.addService(
          this.platform.Service.Switch,
          AutoProModeName,
          AutoProModeName,
        );

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
  }
}
