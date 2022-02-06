import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';

import {AccessoryThisType} from '../VeSyncAccessory';

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();

        return !!this.device.brightnessLevel;
    },
    set: async function (bool: CharacteristicValue) {
        // If light is off and we are turning it on, turn it on to 50%.
        // Note: Turning on the device will always make brightness 50%, even if you slide to 100% when turning it on.
        if (this.device.brightnessLevel == 0 && bool == 1)
            await this.device.setBrightness(50);
        // If light is on and we are turning it off, turn it off
        if (this.device.brightnessLevel > 0 && bool == 0)
            await this.device.setBrightness(0);

    }
};

export default characteristic;
