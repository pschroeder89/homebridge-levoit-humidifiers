import axios, {AxiosInstance} from 'axios';
import {Logger, PlatformConfig} from 'homebridge';
import AsyncLock from 'async-lock';
import crypto from 'crypto';

import deviceTypes from './deviceTypes';
import DebugMode from '../debugMode';
import VeSyncFan from './VeSyncFan';

export enum BypassMethod {
    STATUS = 'getHumidifierStatus',
    MODE = 'setHumidityMode',
    NIGHT_LIGHT_BRIGHTNESS = 'setNightLightBrightness',
    DISPLAY = 'setDisplay',
    SWITCH = 'setSwitch',
    HUMIDITY = 'setTargetHumidity',
    MIST_LEVEL = 'setVirtualLevel',
    LEVEL = 'setLevel',
    LIGHT_STATUS = 'setLightStatus'
}

const lock = new AsyncLock();

export default class VeSync {
    private api?: AxiosInstance;
    private accountId?: string;
    private token?: string;

    private readonly VERSION = '1.1.1';
    private readonly AGENT = `VeSync/VeSync 3.0.51(F5321;HomeBridge-VeSync ${this.VERSION})`;
    private readonly TIMEZONE = 'America/New_York';
    private readonly OS = 'HomeBridge-VeSync';
    private readonly LANG = 'en';

    private readonly AXIOS_OPTIONS = {
        baseURL: 'https://smartapi.vesync.com',
        timeout: 15000
    };

    constructor(
        private readonly email: string,
        private readonly password: string,
        readonly config: PlatformConfig,
        public readonly debugMode: DebugMode,
        public readonly log: Logger
    ) {
    }

    private generateDetailBody() {
        return {
            appVersion: this.VERSION,
            phoneBrand: this.OS,
            traceId: Date.now(),
            phoneOS: this.OS
        };
    }

    private generateBody(includeAuth = false) {
        return {
            acceptLanguage: this.LANG,
            timeZone: this.TIMEZONE,
            ...(includeAuth
                ? {
                    accountID: this.accountId,
                    token: this.token
                }
                : {})
        };
    }

    private generateV2Body(fan: VeSyncFan, method: BypassMethod, data = {}) {
        return {
            method: 'bypassV2',
            debugMode: false,
            deviceRegion: fan.region,
            cid: fan.cid,
            configModule: fan.configModule,
            payload: {
                data: {
                    ...data
                },
                method,
                source: 'APP'
            }
        };
    }

    public async sendCommand(
        fan: VeSyncFan,
        method: BypassMethod,
        body = {}
    ): Promise<boolean> {
        return lock.acquire('api-call', async () => {
            if (!this.api) {
                throw new Error('The user is not logged in!');
            }

            this.debugMode.debug(
                '[SEND COMMAND]',
                `Sending command ${method} to ${fan.name}`,
                `with (${JSON.stringify(body)})...`
            );

            const response = await this.api.put('cloud/v2/deviceManaged/bypassV2', {
                ...this.generateV2Body(fan, method, body),
                ...this.generateDetailBody(),
                ...this.generateBody(true)
            });

            // Explicitly fail if device is offline
            if (response.data.msg == "device offline") {
                this.log.error("VeSync cannot communicate with humidifier! Check the VeSync App.");
                if (this.config.options.whenDisconnected === "remove") {
                    throw new Error("Device was unreachable. Ensure it is plugged in and connected to WiFi.");
                } else {
                    return false;
                }
            }

            if (!response?.data) {
                this.debugMode.debug(
                    '[SEND COMMAND]',
                    'No response data!! JSON:',
                    JSON.stringify(response?.data)
                );
            }

            const isSuccess = response?.data?.code === 0;
            if (!isSuccess) {
                this.debugMode.debug(
                    '[SEND COMMAND]',
                    `Failed to send command ${method} to ${fan.name}`,
                    `with (${JSON.stringify(body)})!`,
                    `Response: ${JSON.stringify(response?.data)}`
                );
            } else {
                this.debugMode.debug(
                    '[SEND COMMAND]',
                    `Successfully sent command ${method} to ${fan.name}`,
                    `with (${JSON.stringify(body)})!`,
                    `Response: ${JSON.stringify(response.data)}`
                );
            }

            return isSuccess;

        });
    }

    public async getDeviceInfo(fan: VeSyncFan): Promise<any> {
        return lock.acquire('api-call', async () => {
            if (!this.api) {
                throw new Error('The user is not logged in!');
            }

            this.debugMode.debug('[GET DEVICE INFO]', 'Getting device info...');

            const response = await this.api.post('cloud/v2/deviceManaged/bypassV2', {
                ...this.generateV2Body(fan, BypassMethod.STATUS),
                ...this.generateDetailBody(),
                ...this.generateBody(true)
            });

            this.debugMode.debug('[DEVICE INFO]', JSON.stringify(response.data));

            // Explicitly fail if device is offline
            if (response.data.msg == "device offline") {
                this.log.error("VeSync cannot communicate with humidifier! Check the VeSync App.");
                if (this.config.options.whenDisconnected === "remove") {
                    throw new Error("Device was unreachable. Ensure it is plugged in and connected to WiFi.");
                } else {
                    return false;
                }
            }

            if (!response?.data) {
                this.debugMode.debug(
                    '[GET DEVICE INFO]',
                    'No response data!! JSON:',
                    JSON.stringify(response?.data)
                );
            }

            return response.data;
        });
    }

    public async startSession(): Promise<boolean> {
        this.debugMode.debug('[START SESSION]', 'Starting auth session...');
        const firstLoginSuccess = await this.login();
        setInterval(this.login.bind(this), 1000 * 60 * 55);
        return firstLoginSuccess;
    }

    private async login(): Promise<boolean> {
        return lock.acquire('api-call', async () => {
            if (!this.email || !this.password) {
                throw new Error('Email and password are required');
            }

            this.debugMode.debug('[LOGIN]', 'Logging in...');

            const pwdHashed = crypto
                .createHash('md5')
                .update(this.password)
                .digest('hex');

            const response = await axios.post(
                'cloud/v1/user/login',
                {
                    email: this.email,
                    password: pwdHashed,
                    devToken: '',
                    userType: 1,
                    method: 'login',
                    token: '',
                    ...this.generateDetailBody(),
                    ...this.generateBody()
                },
                {
                    ...this.AXIOS_OPTIONS
                }
            );

            if (!response?.data) {
                this.debugMode.debug(
                    '[LOGIN]',
                    'No response data!! JSON:',
                    JSON.stringify(response?.data)
                );
                return false;
            }

            const {result} = response.data;
            const {token, accountID} = result ?? {};

            if (!token || !accountID) {
                this.debugMode.debug(
                    '[LOGIN]',
                    'The authentication failed!! JSON:',
                    JSON.stringify(response.data)
                );
                return false;
            }

            this.debugMode.debug('[LOGIN]', 'Authentication was successful');

            this.accountId = accountID;
            this.token = token;

            this.api = axios.create({
                ...this.AXIOS_OPTIONS,
                headers: {
                    'content-type': 'application/json',
                    'accept-language': this.LANG,
                    accountid: this.accountId!,
                    'user-agent': this.AGENT,
                    appversion: this.VERSION,
                    tz: this.TIMEZONE,
                    tk: this.token!
                }
            });

            return true;
        });
    }

    public async getDevices(): Promise<VeSyncFan[]> {
        return lock.acquire('api-call', async () => {
            if (!this.api) {
                throw new Error('The user is not logged in!');
            }

            const response = await this.api.post('cloud/v2/deviceManaged/devices', {
                method: 'devices',
                pageNo: 1,
                pageSize: 1000,
                ...this.generateDetailBody(),
                ...this.generateBody(true)
            });


            if (!response?.data) {
                this.debugMode.debug(
                    '[GET DEVICES]',
                    'No response data!! JSON:',
                    JSON.stringify(response?.data)
                );

                return [];
            }

            if (!Array.isArray(response.data?.result?.list)) {
                this.debugMode.debug(
                    '[GET DEVICES]',
                    'No list found!! JSON:',
                    JSON.stringify(response.data)
                );

                return [];
            }

            const {list} = response.data.result ?? {list: []};

            this.debugMode.debug(
                '[GET DEVICES]',
                'Device List -> JSON:',
                JSON.stringify(list)
            );

            const devices = list
                .filter(
                    ({deviceType, type}) =>
                        !!deviceTypes.find(({isValid}) => isValid(deviceType)) &&
                        type === 'wifi-air'
                )
                .map(VeSyncFan.fromResponse(this));

            return devices;
        });
    }
}

