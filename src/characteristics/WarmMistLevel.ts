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
    return device.isOn ? currentMistLevel : 0;
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
        if (!this.device.deviceType.hasWarmMode) {
            await this.device.changeMode(Mode.Manual);
        }
        await this.device.changeWarmMistLevel(Number(value));

    }
};

export default characteristic;
