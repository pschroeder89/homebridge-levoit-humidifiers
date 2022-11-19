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
            const onChar = this.humidifierService.getCharacteristic(this.platform.Characteristic.On);
            const warmChar = this.warmMistService
                .getCharacteristic(this.platform.Characteristic.RotationSpeed);

            const boolValue = value == 1;
            if (!boolValue) {
                await this.device.changeWarmMistLevel(0);
                warmChar.updateValue(0);

            } else if (!this.device.warmEnabled && this.device.warmLevel == 0 && value > 0) {
                /*
                If turning on Warm Mode from Off state, we set it to the highest warmMistLevel value.
                 This is because we can't determine the selected slider number from the WarmMistLevel characteristic.
                 This appears like a bug (from Off, set to lowest level, but it will set to highest level instead),
                 but there's not a good way to handle this since VeSync doesn't have an on/off for Warm Mode, just
                 level selection.
                */
                await this.device.changeWarmMistLevel(Number(this.device.deviceType.warmMistLevels));
                warmChar.updateValue(Number(this.device.deviceType.warmMistLevels));
                onChar.updateValue(true);

            }
        }
    }
;

export default characteristic;
