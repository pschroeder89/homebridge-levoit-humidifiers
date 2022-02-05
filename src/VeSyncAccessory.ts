import {Service} from 'homebridge';

import Platform, {VeSyncPlatformAccessory} from './platform';
import CurrentState from './characteristics/CurrentState';
import Humidity from './characteristics/Humidity';
import Active from './characteristics/Active';
import VeSyncFan from './api/VeSyncFan';
import MistLevel from "./characteristics/MistLevel";
import TargetState from "./characteristics/TargetState";
import SleepState from "./characteristics/SleepState";
import LightState from "./characteristics/LightState";
import DisplayState from "./characteristics/DisplayState";
import TargetHumidity from "./characteristics/TargetHumidity";

export type AccessoryThisType = ThisType<{
    humidifierService: Service;
    platform: Platform;
    device: VeSyncFan;
}>;

export default class VeSyncAccessory {
    private humiditySensorService: Service;
    private humidifierService: Service;
    private nightLight: Service | undefined;
    private sleepSwitch: Service;
    private displaySwitch: Service;
    private mistService: Service;

    public get UUID() {
        return this.device.uuid.toString();
    }

    private get device() {
        return this.accessory.context.device;
    }

    private get getValues() {
        /*
        Determines the number of mist level values to slide through in the Humidify slider.
        Returns an array that contains the range of values between 0 and (mistLevels + 1).
        We add 1 to mistLevels to account for 0 as a potential level.
        Example: The Classic300s has 9 mist levels, so this function returns [0,1,2,3,4,5,6,7,8,9].
         */
        const arr = [...Array(this.device.deviceType.mistLevels + 1).keys()];
        return arr;
    }

    constructor(
        private readonly platform: Platform,
        private readonly accessory: VeSyncPlatformAccessory
    ) {
        const {manufacturer, model, mac} = this.device;

        this.accessory
            .getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(
                this.platform.Characteristic.Manufacturer,
                manufacturer
            )
            .setCharacteristic(this.platform.Characteristic.Model, model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, mac);

        this.humidifierService =
            this.accessory.getService("Target Humidity") ||
            this.accessory.addService(this.platform.Service.HumidifierDehumidifier, "Target Humidity", "Target Humidity");


        this.mistService =
            this.accessory.getService("Mist Level") ||
            this.accessory.addService(this.platform.Service.Fan, "Mist Level", "Mist Level");

        this.sleepSwitch =
            this.accessory.getService("Sleep Mode") ||
            this.accessory.addService(this.platform.Service.Switch, "Sleep Mode", "Sleep Mode");

        this.displaySwitch =
            this.accessory.getService("Display") ||
            this.accessory.addService(this.platform.Service.Switch, "Display", "Display");

        this.humiditySensorService =
            this.accessory.getService("Humidity Sensor") ||
            this.accessory.addService(this.platform.Service.HumiditySensor, "Humidity Sensor", "Humidity Sensor");

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
                maxValue: 80, // 80 is the max humidity level in VeSync
            })
            .onGet(TargetHumidity.get.bind(this))
            .onSet(TargetHumidity.set.bind(this));

        this.humidifierService
            .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(Humidity.get.bind(this));

        this.mistService
            .getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .setProps({
                minStep: 1,
                minValue: 0,
                maxValue: this.device.deviceType.mistLevels,
                validValues: this.getValues
            })
            .onGet(MistLevel.get.bind(this))
            .onSet(MistLevel.set.bind(this));

        this.sleepSwitch
            .getCharacteristic(this.platform.Characteristic.On)
            .onGet(SleepState.get.bind(this))
            .onSet(SleepState.set.bind(this));

        this.displaySwitch
            .getCharacteristic(this.platform.Characteristic.On)
            .onGet(DisplayState.get.bind(this))
            .onSet(DisplayState.set.bind(this));

        this.humiditySensorService
            .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(Humidity.get.bind(this));

        if (this.device.deviceType.hasLight) {
            this.nightLight =
                this.accessory.getService("Night Light") ||
                this.accessory.addService(this.platform.Service.Lightbulb, "Night Light", "Night Light");

            this.nightLight
                .getCharacteristic(this.platform.Characteristic.Brightness)
                .setProps({
                    minStep: 25,
                    minValue: 0,
                    maxValue: 100,
                    validValues: [0, 25, 50, 75, 100]
                })
                .onGet(LightState.get.bind(this))
                .onSet(LightState.set.bind(this));
        }

        // Link Services
        this.humidifierService.setPrimaryService(true);
        if (this.nightLight) {
            this.humidifierService.addLinkedService(this.nightLight);
        }
        this.humidifierService.addLinkedService(this.sleepSwitch);
        this.humidifierService.addLinkedService(this.mistService);
        this.humidifierService.addLinkedService(this.displaySwitch);
        this.humidifierService.addLinkedService(this.humiditySensorService);
    }
}
