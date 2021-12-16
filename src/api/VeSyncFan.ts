import AsyncLock from 'async-lock';
import deviceTypes, {DeviceType} from './deviceTypes';

import VeSync, {BypassMethod} from './VeSync';

export enum Mode {
    Manual = 'manual',
    Sleep = 'sleep',
    Auto = 'auto'
}

export default class VeSyncFan {
    private lock: AsyncLock = new AsyncLock();
    public readonly deviceType: DeviceType;
    private lastCheck = 0;

    private _screenVisible = true;

    public readonly manufacturer = 'Levoit';

    public get humidityLevel() {
        return this._humidityLevel;
    }

    public get screenVisible() {
        return this._screenVisible;
    }

    public get mistLevel() {
        return this._mistLevel;
    }

    public get mode() {
        return this._mode;
    }

    public get isOn() {
        return this._isOn;
    }

    constructor(
        private readonly client: VeSync,
        public readonly name: string,
        private _mode: Mode,
        private _mistLevel: number,
        public readonly uuid: string,
        private _isOn: boolean,
        private _humidityLevel: number,
        public readonly configModule: string,
        public readonly cid: string,
        public readonly region: string,
        public readonly model: string,
        public readonly mac: string
    ) {
        this.deviceType = deviceTypes.find(({isValid}) => isValid(this.model))!;
    }

    public async setPower(power: boolean): Promise<boolean> {
        const success = await this.client.sendCommand(this, BypassMethod.SWITCH, {
            enabled: power,
            id: 0
        });

        if (success) {
            this._isOn = power;
        }

        return success;
    }

    public async changeMode(mode: Mode): Promise<boolean> {

        const success = await this.client.sendCommand(this, BypassMethod.MODE, {
            mode: mode.toString()
        });

        if (success) {
            this._mode = mode;
        }

        return success;
    }

    public async changeMistLevel(mistLevel: number): Promise<boolean> {
        this.client.log.info("Setting Mist Level to " + mistLevel);
        if (mistLevel > this.deviceType.mistLevels || mistLevel < 1) {
            return false;
        }

        const success = await this.client.sendCommand(this, BypassMethod.MIST_LEVEL, {
            level: mistLevel,
            type: 'mist',
            id: 0
        });

        if (success) {
            this._mistLevel = mistLevel;
        }

        return success;
    }

    public async updateInfo(): Promise<void> {
        return this.lock.acquire('update-info', async () => {
            try {
                if (Date.now() - this.lastCheck < 5 * 1000) {
                    return;
                }

                const data = await this.client.getDeviceInfo(this);
                this.lastCheck = Date.now();

                if (!data?.result?.result) {
                    return;
                }

                const result = data?.result?.result;

                this._humidityLevel = result.humidity;
                this._screenVisible = result.display;
                this._isOn = result.enabled;
                this._mistLevel = result.mist_virtual_level;
                this._mode = result.mode;
            } catch (err: any) {
                this.client.log.error(err?.message);
            }
        });
    }

    public static fromResponse =
        (client: VeSync) =>
            ({
                 deviceStatus,
                 deviceName,
                 mistLevel,
                 mode,
                 extension,
                 uuid,
                 configModule,
                 cid,
                 deviceRegion,
                 deviceType,
                 macID
             }) =>
                new VeSyncFan(
                    client,
                    deviceName,
                    mode,
                    parseInt(mistLevel ?? '0', 9),
                    uuid,
                    deviceStatus === 'on',
                    extension,
                    configModule,
                    cid,
                    deviceRegion,
                    deviceType,
                    macID
                );
}
