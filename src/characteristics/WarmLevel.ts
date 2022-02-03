import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';
import VeSyncFan from '../api/VeSyncFan';

import {AccessoryThisType} from '../VeSyncAccessory';

const calculateWarmLevel = (device: VeSyncFan) => {
    const currentWarmLevel = device.warmLevel;
    return device.isOn ? currentWarmLevel : 0;
};

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();
        return calculateWarmLevel(this.device);
    },

    set: async function (value: CharacteristicValue) {

            await this.device.changeWarmLevel(Number(value));

    }
};

export default characteristic;
