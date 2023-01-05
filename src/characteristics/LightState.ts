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
        // If there is a lightOn attribute, that's the source of truth (for RGB models)
        // Otherwise, convert brightness to a bool
        if (this.device.lightOn) {
            if (this.device.lightOn === "on") {
              return true;
            } else {
                return false;
            }
        }
        return !!this.device.brightnessLevel;
    },
    set: async function (bool: CharacteristicValue) {
        let action: string;
        if (bool) {
            action = "on";
        } else {
            action = "off";
        }

        const lightOnVal = this.device.lightOn;
        // If light is off and we are turning it on, turn it on to 50% brightness.
        // Note: Turning on the device will always make brightness 50%, even if you slide to 100% when turning it on.
        if ((lightOnVal && lightOnVal == "off" || !lightOnVal && this.device.brightnessLevel == 0) && bool == 1) {
            // If device has color mode (RGB), set on / off and set brightness to 50
            if (this.device.deviceType.hasColorMode) {
                await this.device.setLightStatus(action, 50);
            } else {
                await this.device.setBrightness(50);
            }
        }
        if ((lightOnVal && lightOnVal == "on" || !lightOnVal &&  this.device.brightnessLevel > 0) && bool == 0)
            if (this.device.deviceType.hasColorMode) {
                await this.device.setLightStatus("off", 50);
            } else {
                // If light is on and we are turning it off, set to 0
                await this.device.setBrightness(0);
            }
    }
};

export default characteristic;
