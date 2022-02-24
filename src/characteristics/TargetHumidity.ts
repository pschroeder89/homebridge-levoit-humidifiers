import {
    CharacteristicGetHandler, CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';

import {AccessoryThisType} from '../VeSyncAccessory';
import {Mode} from "../api/VeSyncFan";

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();

        // If not in auto or sleep modes, don't display the target humidity in the slider
        if ((this.device.mode == Mode.Auto || this.device.mode == Mode.Sleep || this.device.mode == Mode.Humidity)
            && (this.device.deviceType.hasWarmMode && this.device.mode != Mode.Sleep)) {
            return this.device.targetHumidity;
        } else {
            return 0;
        }
    },
    set: async function (humidity: CharacteristicValue) {
        if (this.device.mode == Mode.Manual || (this.device.deviceType.hasWarmMode && this.device.mode == Mode.Sleep))
            await this.device.changeMode(Mode.Auto);
        switch (true) {
            case (humidity < this.device.deviceType.minHumidityLevel):
                humidity = this.device.deviceType.minHumidityLevel;
                break;
            case (humidity > this.device.deviceType.maxHumidityLevel):
                humidity = this.device.deviceType.maxHumidityLevel;
                break;
        }
        await this.device.setTargetHumidity(Number(humidity));
    }
};

export default characteristic;
