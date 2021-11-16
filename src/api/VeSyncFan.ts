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

    public get mist_level() {
        return this._mist_level;
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
        private _mist_level: number,
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

    public async changeMistLevel(mist_level: number): Promise<boolean> {
        this.client.log.info("Setting Mist Level to " + mist_level);
        if (mist_level > this.deviceType.mistLevels || mist_level < 1) {
            return false;
        }

        const success = await this.client.sendCommand(this, BypassMethod.MIST_LEVEL, {
            level: mist_level,
            type: 'mist',
            id: 0
        });

        if (success) {
            this._mist_level = mist_level;
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
                this._mist_level = result.mist_virtual_level;
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
                 mist_level,
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
                    parseInt(mist_level ?? '0', 9),
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
