import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';
import VeSyncFan from '../api/VeSyncFan';

import {AccessoryThisType} from '../VeSyncAccessory';

const calculateMistLevel = (device: VeSyncFan) => {
    const currentMistLevel = device.mistLevel;
    // eslint-disable-next-line no-console
    console.log("MIST: " + currentMistLevel);
    return device.isOn ? currentMistLevel : 0;
};

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();
        return calculateMistLevel(this.device);
    },

    set: async function (value: CharacteristicValue) {
        if (value == 0) {
            await this.device.setPower(false);
        } else {
            await this.device.changeMistLevel(Number(value));
        }
    }
};

export default characteristic;
