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
        //await this.device.updateInfo();

        return this.device.brightnessLevel;
    },
    set: async function (value: CharacteristicValue) {
        // If light is on, and we are applying a non-zero value, change brightness to that level.
        // Otherwise, LightState will handle on / off switching.
        await this.device.setBrightness(Number(value));
        this.lightService.updateCharacteristic(this.platform.Characteristic.Brightness,Number(value));
        this.lightService.updateCharacteristic(this.platform.Characteristic.On, true);

    }
};

export default characteristic;
