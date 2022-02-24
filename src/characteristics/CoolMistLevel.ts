import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';
import VeSyncFan, {Mode} from '../api/VeSyncFan';

import {AccessoryThisType} from '../VeSyncAccessory';

const calculateMistLevel = (device: VeSyncFan) => {
    const currentMistLevel = device.mistLevel;
    return device.isOn ? currentMistLevel : 1;
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
            if (!this.device.deviceType.hasWarmMode) {
                await this.device.changeMode(Mode.Manual);
            }
            await this.device.changeCoolMistLevel(Number(value));
        }
    }
};

export default characteristic;
