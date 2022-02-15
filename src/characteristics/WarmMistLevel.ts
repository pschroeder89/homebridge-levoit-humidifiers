import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';
import VeSyncFan, {Mode} from '../api/VeSyncFan';

import {AccessoryThisType} from '../VeSyncAccessory';

const calculateWarmMistLevel = (device: VeSyncFan) => {
    const currentMistLevel = device.warmLevel;
    return device.isOn ? currentMistLevel : 1;
};

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();
        return calculateWarmMistLevel(this.device);
    },

    set: async function (value: CharacteristicValue) {
        await this.device.changeMode(Mode.Manual);
        await this.device.changeWarmMistLevel(Number(value));

    }
};

export default characteristic;
