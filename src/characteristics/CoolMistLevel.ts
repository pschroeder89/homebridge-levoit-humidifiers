import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';

import {AccessoryThisType} from '../VeSyncAccessory';
import {Mode} from "../api/VeSyncFan";
import Active from "./Active";

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();
        return this.device.isOn ? this.device.mistLevel : 0;
    },

    set: async function (value: CharacteristicValue) {
        if (!this.device.deviceType.hasWarmMode) {
            await this.device.changeMode(Mode.Manual);
            const {HUMIDIFYING} = this.platform.Characteristic.CurrentHumidifierDehumidifierState;
            this.humidifierService.updateCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState, HUMIDIFYING);
        }
        await this.device.changeCoolMistLevel(Number(value));
        this.coolMistService.updateCharacteristic(this.platform.Characteristic.RotationSpeed, Number(value));
    }


};

export default characteristic;
