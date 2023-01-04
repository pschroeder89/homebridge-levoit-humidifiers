import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';

import { AccessoryThisType } from '../VeSyncAccessory';

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();
        return this.device.brightnessLevel;
    },
    set: async function (value: CharacteristicValue) {

        if (this.device.brightnessLevel > 0 && value > 0) {
            // If light is on, and we are applying a non-zero value, change brightness to that level.
            // Otherwise, LightState will handle on / off switching.

            // Handle Color Mode (RGB) devices
            let action: string;
            if (value > 0) {
                action = "on";
            } else {
                action = "off";
            }
            if (this.device.deviceType.hasColorMode) {
                await this.device.setLightStatus(action, Number(value));
            } else {
                // Other devices
                await this.device.setBrightness(Number(value));
            }
        }
    }
};

export default characteristic;
