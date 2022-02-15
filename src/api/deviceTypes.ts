export enum DeviceName {
    Classic300S = 'Classic300S',
    Classic200S = "Classic200S",
    Dual200S = 'Dual200S',
    Dual200S_EU = 'LUH-D301S-WEU',
    Dual200S_UK = 'LUH-D301S-WUK',
    LV600S = "LUH-A602S-WUS"
}

export interface DeviceType {
    isValid: (input: string) => boolean;
    hasAutoMode: boolean;
    coolMistLevels: number;
    hasLight: boolean;
    hasSleepMode: boolean;
    hasWarmMode: boolean;
    warmMistLevels?: number;
}

const deviceTypes: DeviceType[] = [
    {
        isValid: (input: string) =>
            input.includes(DeviceName.Classic300S),
        hasAutoMode: true,
        coolMistLevels: 9,
        hasLight: true,
        hasSleepMode: true,
        hasWarmMode: false
    },
    {
        isValid: (input: string) =>
            input.includes(DeviceName.Classic200S),
        hasAutoMode: true,
        coolMistLevels: 9,
        hasLight: false,
        hasSleepMode: false,
        hasWarmMode: false
    },
    {
        isValid: (input: string) => input.includes(DeviceName.Dual200S),
        hasAutoMode: true,
        coolMistLevels: 2,
        hasLight: false,
        hasSleepMode: false,
        hasWarmMode: false
    },
    {
        isValid: (input: string) => input.includes(DeviceName.Dual200S_EU),
        hasAutoMode: true,
        coolMistLevels: 2,
        hasLight: false,
        hasSleepMode: false,
        hasWarmMode: false
    },
    {
        isValid: (input: string) => input.includes(DeviceName.Dual200S_UK),
        hasAutoMode: true,
        coolMistLevels: 2,
        hasLight: false,
        hasSleepMode: false,
        hasWarmMode: false
    },
    {
        isValid: (input: string) =>
            input.includes(DeviceName.LV600S),
        hasAutoMode: true,
        coolMistLevels: 9,
        hasLight: true,
        hasSleepMode: true,
        hasWarmMode: true,
        warmMistLevels: 3
    },
];

export default deviceTypes;
