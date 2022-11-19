import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';
import VeSyncFan from '../api/VeSyncFan';

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
        if (!this.device.warmEnabled && value > 0){
            // if from Off state and level is greater than 0, return immediately. See WarmActive for more info.
            return;
        }
        if (this.device.warmEnabled && value == 0){
            // if from On state and level is 0, return immediately
            return;
        }

        await this.device.changeWarmMistLevel(Number(value));

        this.warmMistService.updateCharacteristic(this.platform.Characteristic.RotationSpeed, value);
    }
};

export default characteristic;
