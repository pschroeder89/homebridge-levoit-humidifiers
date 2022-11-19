import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';
import {Mode} from '../api/VeSyncFan';

import {AccessoryThisType} from '../VeSyncAccessory';

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();

        // If device is off, set the mode to null so the switch displays Off
        if (!this.device.isOn) {
            return false;
        }

        return this.device.mode === Mode.Sleep;
    },
    set: async function (value: CharacteristicValue) {
        const sleepChar = this.sleepService
            .getCharacteristic(this.platform.Characteristic.On);
        const onChar = this.humidifierService
            .getCharacteristic(this.platform.Characteristic.On);

        switch (value) {
            case true:
                await this.device.changeMode(Mode.Sleep);
                sleepChar.updateValue(true);
                onChar.updateValue(true);
                break;
            case false:
                await this.device.changeMode(Mode.Auto);
                sleepChar.updateValue(false);
                onChar.updateValue(true);
                break;
        }
    }
};

export default characteristic;
