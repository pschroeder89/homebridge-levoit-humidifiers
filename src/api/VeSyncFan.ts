import AsyncLock from 'async-lock';
import deviceTypes, { DeviceName, DeviceType } from './deviceTypes';

import VeSync, { BypassMethod } from './VeSync';

export enum Mode {
    Manual = 'manual',
    Sleep = 'sleep',
    Auto = 'auto',
    Humidity = 'humidity'
}

export default class VeSyncFan {
    private lock: AsyncLock = new AsyncLock();
    public readonly deviceType: DeviceType;
    private lastCheck = 0;

    private _displayOn = true;

    public readonly manufacturer = 'Levoit';

    public expectedWarmLevel: any;

    public get humidityLevel() {
        return this._humidityLevel;
    }

    public get targetHumidity() {
        return this._targetHumidity;
    }

    public get displayOn() {
        return this._displayOn;
    }

    public get brightnessLevel() {
        return this._brightnessLevel;
    }

    public get mistLevel() {
        return this._mistLevel;
    }

    public get warmLevel() {
        return this._warmLevel;
    }

    public get warmEnabled() {
        return this._warmEnabled;
    }

    public get lightOn() {
        return this._lightOn;
    }

    public get mode() {
        return this._mode;
    }

    public get targetReached() {
        return this._targetReached;
    }

    public get isOn() {
        return this._isOn;
    }

    public get getBlue() {
        return this._blue;
    }

    public get getGreen() {
        return this._green;
    }

    public get getColorMode() {
        return this._colorMode;
    }

    public get getColorSliderLocation() {
        return this._colorSliderLocation;
    }

    public get getLightSpeed() {
        return this._lightSpeed;
    }

    public get getRed() {
        return this._red;
    }

    constructor(
        private readonly client: VeSync,
        public readonly name: string,
        private _mode: Mode,
        private _isOn: boolean,
        private _mistLevel: number,
        private _warmLevel: number,
        private _warmEnabled: boolean,
        private _brightnessLevel: number,
        private _humidityLevel: number,
        private _targetHumidity: number,
        private _targetReached: boolean,
        private _lightOn: boolean,
        private _lightSpeed: number,
        private _red: number,
        private _blue: number,
        private _green: number,
        private _colorMode: string,
        private _colorSliderLocation: number,
        public readonly configModule: string,
        public readonly cid: string,
        public readonly region: string,
        public readonly model: string,
        public readonly mac: string,
        public readonly uuid: string,

    ) {
        this.deviceType = deviceTypes.find(({ isValid }) => isValid(this.model))!;
    }

    public async setPower(power: boolean): Promise<boolean> {
        this.client.log.info("Setting Power to " + power);

        const success = await this.client.sendCommand(this, BypassMethod.SWITCH, {
            enabled: power,
            id: 0
        });

        if (success) {
            this._isOn = power;
            if (!this._isOn) {
                this._humidityLevel = 0;
                this._targetHumidity = 0;
                this._mistLevel = 0;
                this._warmLevel = 0;
            }
        } else {
            this.client.log.error("Failed to setPower due to unreachable device.");
            if (this.client.config.options.showOffWhenDisconnected) {
                this._isOn = false;
                this._humidityLevel = 0;
                this._targetHumidity = 0;
                this._displayOn = false;
                this._mistLevel = 0;
                this._warmLevel = 0;
                this._brightnessLevel = 0;
                this._lightOn = false;
            } else {
                return false;
            }
        }

        return success;
    }

    public async setTargetHumidity(level: number): Promise<boolean> {
        this.client.log.info("Setting Target Humidity to " + level);

        const success = await this.client.sendCommand(this, BypassMethod.HUMIDITY, {
            "target_humidity": level,
            id: 0
        });

        if (success) {
            this._targetHumidity = level;
        }

        return success;
    }

    public async changeMode(mode: Mode): Promise<boolean> {
        // LV600s and Oasis models use "Humidity" mode instead of "Auto"
        const humidity_models = [
            DeviceName.LV600S,
            DeviceName.LV600S_REMOTE,
            DeviceName.LV600S_EU,
            DeviceName.LV600S_UK,
            DeviceName.LV600S_JP,
            DeviceName.OASIS,
            DeviceName.OASIS_EU,
            DeviceName.OASIS_JP,
            DeviceName.OASIS_UK
        ];
        if (humidity_models.includes(<DeviceName>this.model) && mode == Mode.Auto) {
            mode = Mode.Humidity;
        }
        let success: boolean;
        // Don't change the mode if we are already in that mode
        if (this._mode == mode) {
            success = true;
        } else {
            this.client.log.info("Changing Mode to " + mode);
            success = await this.client.sendCommand(this, BypassMethod.MODE, {
                mode: mode.toString()
            });

        }
        if (success) {
            this._mode = mode;
        }

        return success;
    }

    public async setBrightness(brightness: number): Promise<boolean> {
        this.client.log.info("Setting Night Light to " + brightness);

        const success = await this.client.sendCommand(this, BypassMethod.NIGHT_LIGHT_BRIGHTNESS, {
            "night_light_brightness": brightness
        });


        if (success) {
            this._brightnessLevel = brightness;
        }

        return success;
    }

    public async setDisplay(power: boolean): Promise<boolean> {
        this.client.log.info("Setting Display to " + power);
        const success = await this.client.sendCommand(this, BypassMethod.DISPLAY, {
            state: power
        });

        if (success) {
            this._displayOn = power;
        }

        return success;
    }

    public async changeCoolMistLevel(coolMistLevel: number): Promise<boolean> {
        if (coolMistLevel > this.deviceType.coolMistLevels || coolMistLevel < 1) {
            return false;
        }

        this.client.log.info("Setting Mist Level to " + coolMistLevel);

        const success = await this.client.sendCommand(this, BypassMethod.MIST_LEVEL, {
            level: coolMistLevel,
            type: 'mist',
            id: 0
        });

        if (success) {
            this._mistLevel = coolMistLevel;
        }

        return success;
    }

    public async changeWarmMistLevel(warmMistLevel: number): Promise<boolean> {
        if (!this.deviceType.warmMistLevels) {
            this.client.log.error("Error: Attempted to set warm level on device without warmMistLevels field.");
            return false;
        }

        if (warmMistLevel > this.deviceType.warmMistLevels || warmMistLevel < 0) {
            return false;
        }

        this.client.log.info("Setting Warm Level to " + warmMistLevel);

        const success = await this.client.sendCommand(this, BypassMethod.LEVEL, {
            level: warmMistLevel,
            type: 'warm',
            id: 0
        });

        if (success) {
            this._warmLevel = warmMistLevel;
            if (this._warmLevel == 0) {
                this._warmEnabled = false;
                this.expectedWarmLevel = this.deviceType.warmMistLevels;
            }
            {
                this._warmEnabled = true;
            }
        }

        return success;
    }

    public async setLightStatus(action: string, brightness: number): Promise<boolean> {
        const lightJson = {
            "action": action,
            "speed": this.getLightSpeed,
            "green": this.getGreen,
            "blue": this.getBlue,
            "red": this.getRed,
            "brightness": brightness,
            "colorMode": this.getColorMode,
            "colorSliderLocation": this.getColorSliderLocation
        };
        this.client.log.info("Setting Night Light Status to " + JSON.stringify(lightJson));

        const success = await this.client.sendCommand(this, BypassMethod.LIGHT_STATUS, lightJson);


        if (success) {
            this._brightnessLevel = brightness;
        }

        return success;
    }

    public async updateInfo(): Promise<void> {
        return this.lock.acquire('update-info', async () => {
            try {
                if (Date.now() - this.lastCheck < 5 * 1000) {
                    return;
                }

                const data = await this.client.getDeviceInfo(this);

                this.lastCheck = Date.now();
                if (!data?.result?.result && this.client.config.options.showOffWhenDisconnected) {
                    this._isOn = false;
                    this._humidityLevel = 0;
                    this._targetHumidity = 0;
                    this._displayOn = false;
                    this._mistLevel = 0;
                    this._warmLevel = 0;
                    this._brightnessLevel = 0;
                    return;
                } else if (!data?.result?.result) {
                    return;
                }

                const result = data?.result?.result;
                this._humidityLevel = result.humidity;
                this._targetHumidity = result.configuration.auto_target_humidity;
                this._targetReached = result.automatic_stop_reach_target;
                this._displayOn = result.display;
                this._isOn = result.enabled;
                this._mistLevel = result.mist_virtual_level;
                this._warmLevel = result.warm_level;
                this._warmEnabled = result.warm_enabled;
                this._mode = result.mode;
                this._brightnessLevel = result.night_light_brightness ?? result.rgbNightLight?.brightness;
                // RGB Light Devices Only:
                this._lightOn = result.rgbNightLight?.action;
                this._blue = result.rgbNightLight?.blue;
                this._green = result.rgbNightLight?.green;
                this._red = result.rgbNightLight?.red;
                this._colorMode = result.rgbNightLight?.colorMode;
                this._lightSpeed = result.rgbNightLight?.speed;
                this._colorSliderLocation = result.rgbNightLight?.colorSliderLocation;


            } catch (err: any) {
                this.client.log.error("Failed to updateInfo due to unreachable device: " + err?.message);
                if (this.client.config.options.showOffWhenDisconnected) {
                    this._isOn = false;
                    this._humidityLevel = 0;
                    this._targetHumidity = 0;
                    this._displayOn = false;
                    this._mistLevel = 0;
                    this._warmLevel = 0;
                    this._brightnessLevel = 0;
                } else {
                    throw new Error("Device was unreachable. Ensure it is plugged in and connected to WiFi.");
                }
            }
        });
    }

    public static fromResponse =
        (client: VeSync) =>
            ({
                deviceName,
                mode,
                deviceStatus,
                mistLevel,
                warmLevel,
                warmEnabled,
                brightnessLevel,
                humidity,
                targetHumidity,
                targetReached,
                lightOn,
                lightSpeed,
                red,
                blue,
                green,
                colorMode,
                colorSliderLocation,
                configModule,
                cid,
                deviceRegion,
                deviceType,
                macID,
                uuid

            }) =>
                new VeSyncFan(
                    client,
                    deviceName,
                    mode,
                    deviceStatus,
                    mistLevel,
                    warmLevel,
                    warmEnabled,
                    brightnessLevel,
                    humidity,
                    targetHumidity,
                    targetReached,
                    lightOn,
                    lightSpeed,
                    red,
                    blue,
                    green,
                    colorMode,
                    colorSliderLocation,
                    configModule,
                    cid,
                    deviceRegion,
                    deviceType,
                    macID,
                    uuid,

                );
}
