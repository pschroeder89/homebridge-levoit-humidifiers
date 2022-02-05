import {
    CharacteristicGetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';

import {AccessoryThisType} from '../VeSyncAccessory';
import {Mode} from "../api/VeSyncFan";

const characteristic: {
    get: CharacteristicGetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();

        const {HUMIDIFYING, IDLE} =
            this.platform.Characteristic.CurrentHumidifierDehumidifierState;

        if (this.device.targetReached || !this.device.isOn || this.device.mode == Mode.Manual) {
            return IDLE;
        } else {
            return HUMIDIFYING;
        }
    }
};

export default characteristic;
