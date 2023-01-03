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
        // eslint-disable-next-line no-console
        console.log(this.device.brightnessLevel);
        return this.device.brightnessLevel;
    },
    set: async function (value: CharacteristicValue) {

        if (this.device.brightnessLevel > 0 && value > 0) {
            // Handle Color Mode (RGB) devices
            let action: string;
            if (value > 0) {
                action = "on";
            } else {
                action = "off";
            }
            if (this.device.deviceType.hasColorMode) {
                await this.device.setLightStatus(action, Number(value));
                return;
            } else {
                // Other devices
                // If light is on, and we are applying a non-zero value, change brightness to that level.
                // Otherwise, LightState will handle on / off switching.
                await this.device.setBrightness(Number(value));
            }
        }
    }
};

export default characteristic;
