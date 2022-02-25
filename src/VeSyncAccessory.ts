import {Service} from 'homebridge';

import Platform, {VeSyncPlatformAccessory} from './platform';
import CurrentState from './characteristics/CurrentState';
import Humidity from './characteristics/Humidity';
import Active from './characteristics/Active';
import VeSyncFan from './api/VeSyncFan';
import MistLevel from "./characteristics/CoolMistLevel";
import TargetState from "./characteristics/TargetState";
import SleepState from "./characteristics/SleepState";
import LightBrightness from "./characteristics/LightBrightness";
import DisplayState from "./characteristics/DisplayState";
import TargetHumidity from "./characteristics/TargetHumidity";
import LightState from "./characteristics/LightState";
import WarmMistLevel from "./characteristics/WarmMistLevel";
import WarmActive from "./characteristics/WarmActive";

export type AccessoryThisType = ThisType<{
    humidifierService: Service;
    platform: Platform;
    device: VeSyncFan;
}>;

export default class VeSyncAccessory {
    private humidifierService: Service;
    private humiditySensorService: Service;
    private nightLight: Service | undefined;
    private sleepSwitch: Service | undefined;
    private displaySwitch: Service;
    private coolMistService: Service;
    private warmMistService: Service | undefined;


    public get UUID() {
        return this.device.uuid.toString();
    }

    private get device() {
        return this.accessory.context.device;
    }

    private get getCoolMistValues() {
        /*
        Determines the number of mist level values to slide through in the Cool Mist Level slider.
        Returns an array that contains the range of values between 1 and (coolMistLevels + 1).
        We add 1 to coolMistLevels to account for 0 as a potential level.
        Example: The Classic300s has 9 cool mist levels, so this function returns [0,1,2,3,4,5,6,7,8,9].
         */
        const arr = [...Array(this.device.deviceType.coolMistLevels + 1).keys()];
        return arr;
    }

    private get getWarmMistValues() {
        /*
        Determines the number of mist level values to slide through in the Warm Mist Level slider.
        Returns an array that contains the range of values between 1 and (warmMistLevels + 1).
        We add 1 to warmMistLevels to account for 0 as a potential level.
        Example: The LV600s has 3 warm mist levels, so this function returns [0,1,2,3].
         */
        if (!this.device.deviceType.warmMistLevels) {
            return [];
        }
        const arr = [...Array(this.device.deviceType.warmMistLevels + 1).keys()];
        return arr;
    }

    constructor(
        private readonly platform: Platform,
        private readonly accessory: VeSyncPlatformAccessory
    ) {
        const {manufacturer, model, mac} = this.device;

        // Accessory info
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(
                this.platform.Characteristic.Manufacturer,
                manufacturer
            )
            .setCharacteristic(this.platform.Characteristic.Model, model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, mac);

        // Humidifier service
        this.humidifierService =
            this.accessory.getService("Humidifier") ||
            this.accessory.addService(this.platform.Service.HumidifierDehumidifier, "Humidifier", "Humidifier");

        this.humidifierService.setPrimaryService(true);

        this.humidifierService
            .getCharacteristic(this.platform.Characteristic.Active)
            .onGet(Active.get.bind(this))
            .onSet(Active.set.bind(this));

        this.humidifierService
            .getCharacteristic(this.platform.Characteristic.TargetHumidifierDehumidifierState)
            .setProps({
                validValues: [1],
            })
            .onGet(TargetState.get.bind(this));

        this.humidifierService
            .getCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState)
            .setProps({
                validValues: [1, 2],
            })
            .onGet(CurrentState.get.bind(this));

        this.humidifierService
            .getCharacteristic(this.platform.Characteristic.RelativeHumidityHumidifierThreshold)
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

        // Cool Mist service
        this.coolMistService =
            this.accessory.getService("Cool Mist") ||
            this.accessory.addService(this.platform.Service.Fan, "Cool Mist", "Cool Mist");

        this.coolMistService
            .getCharacteristic(this.platform.Characteristic.On)
            .onGet(Active.get.bind(this))
            .onSet(Active.set.bind(this));

        this.coolMistService
            .getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .setProps({
                minStep: 1,
                minValue: 0,
                maxValue: this.device.deviceType.coolMistLevels,
                validValues: this.getCoolMistValues,

            })
            .onGet(MistLevel.get.bind(this))
            .onSet(MistLevel.set.bind(this));
        this.humidifierService.addLinkedService(this.coolMistService);


        // Display Switch service
        this.displaySwitch =
            this.accessory.getService("Display") ||
            this.accessory.addService(this.platform.Service.Switch, "Display", "Display");

        this.humidifierService.addLinkedService(this.displaySwitch);

        this.displaySwitch
            .getCharacteristic(this.platform.Characteristic.On)
            .onGet(DisplayState.get.bind(this))
            .onSet(DisplayState.set.bind(this));

        // Humidity Sensor service
        this.humiditySensorService =
            this.accessory.getService("Humidity Sensor") ||
            this.accessory.addService(this.platform.Service.HumiditySensor, "Humidity Sensor", "Humidity Sensor");

        this.humidifierService.addLinkedService(this.humiditySensorService);

        this.humiditySensorService
            .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(Humidity.get.bind(this));

        // Warm Mist service
        if (this.device.deviceType.hasWarmMode) {
            this.warmMistService =
                this.accessory.getService("Warm Mist") ||
                this.accessory.addService(this.platform.Service.Fan, "Warm Mist", "Warm Mist");

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
        }

        // Sleep Mode service
        if (this.device.deviceType.hasSleepMode) {
            this.sleepSwitch =
                this.accessory.getService("Sleep Mode") ||
                this.accessory.addService(this.platform.Service.Switch, "Sleep Mode", "Sleep Mode");

            this.humidifierService.addLinkedService(this.sleepSwitch);

            this.sleepSwitch
                .getCharacteristic(this.platform.Characteristic.On)
                .onGet(SleepState.get.bind(this))
                .onSet(SleepState.set.bind(this));
        }

        // Night Light service
        if (this.device.deviceType.hasLight) {
            this.nightLight =
                this.accessory.getService("Night Light") ||
                this.accessory.addService(this.platform.Service.Lightbulb, "Night Light", "Night Light");

            this.humidifierService.addLinkedService(this.nightLight);

            this.nightLight
                .getCharacteristic(this.platform.Characteristic.On)
                .onGet(LightState.get.bind(this))
                .onSet(LightState.set.bind(this));

            this.nightLight
                .getCharacteristic(this.platform.Characteristic.Brightness)
                .setProps({
                    minStep: 25,
                    minValue: 0,
                    maxValue: 100,
                    validValues: [0, 25, 50, 75, 100]
                })
                .onGet(LightBrightness.get.bind(this))
                .onSet(LightBrightness.set.bind(this));
        }
    }
}
