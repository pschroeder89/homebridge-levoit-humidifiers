import {
    CharacteristicGetHandler, CharacteristicSetHandler,
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
            return (this.device.isOn && this.device.warmEnabled);
        },
        set: async function (value: CharacteristicValue) {
            const boolValue = value == 1;
            if (!boolValue) {
                await this.device.changeWarmMistLevel(0);
            } else {
                await this.device.changeWarmMistLevel(3);
            }
        }
    }
;

export default characteristic;
