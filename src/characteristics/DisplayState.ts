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
        return this.device.displayOn;
    },
    set: async function (value: CharacteristicValue) {
        const dispChar =  this.displayService.getCharacteristic(this.platform.Characteristic.On);

        const boolValue = value == 1;
        await this.device.setDisplay(boolValue);
        dispChar.updateValue(boolValue);
    }
};

export default characteristic;