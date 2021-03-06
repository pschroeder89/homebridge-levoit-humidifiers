export enum DeviceName {
    Classic300S = 'Classic300S',
    Classic200S = "Classic200S",
    Dual200S = 'Dual200S',
    Dual200S_EU = 'LUH-D301S-WEU',
    Dual200S_UK = 'LUH-D301S-WUK',
    LV600S = "LUH-A602S-WUS",
    LV600S_EU = "LUH-A602S-WEU",
    LV600S_UK = "LUH-A602S-WUK"
}

export interface DeviceType {
    isValid: (input: string) => boolean;
    hasAutoMode: boolean;
    coolMistLevels: number;
    hasLight: boolean;
    hasSleepMode: boolean;
    hasWarmMode: boolean;
    warmMistLevels?: number;
    minHumidityLevel: number;
    maxHumidityLevel: number;
}

const deviceTypes: DeviceType[] = [
    {
        isValid: (input: string) =>
            input.includes(DeviceName.Classic300S),
        hasAutoMode: true,
        coolMistLevels: 9,
        hasLight: true,
        hasSleepMode: true,
        hasWarmMode: false,
        minHumidityLevel: 30,
        maxHumidityLevel: 80
    },
    {
        isValid: (input: string) =>
            input.includes(DeviceName.Classic200S),
        hasAutoMode: true,
        coolMistLevels: 9,
        hasLight: false,
        hasSleepMode: false,
        hasWarmMode: false,
        minHumidityLevel: 30,
        maxHumidityLevel: 80
    },
    {
        isValid: (input: string) => input.includes(DeviceName.Dual200S),
        hasAutoMode: true,
        coolMistLevels: 2,
        hasLight: false,
        hasSleepMode: false,
        hasWarmMode: false,
        minHumidityLevel: 30,
        maxHumidityLevel: 80
    },
    {
        isValid: (input: string) => input.includes(DeviceName.Dual200S_EU),
        hasAutoMode: true,
        coolMistLevels: 2,
        hasLight: false,
        hasSleepMode: false,
        hasWarmMode: false,
        minHumidityLevel: 30,
        maxHumidityLevel: 80
    },
    {
        isValid: (input: string) => input.includes(DeviceName.Dual200S_UK),
        hasAutoMode: true,
        coolMistLevels: 2,
        hasLight: false,
        hasSleepMode: false,
        hasWarmMode: false,
        minHumidityLevel: 30,
        maxHumidityLevel: 80
    },
    {
        isValid: (input: string) =>
            input.includes(DeviceName.LV600S),
        hasAutoMode: true,
        coolMistLevels: 9,
        hasLight: false,
        hasSleepMode: true,
        hasWarmMode: true,
        warmMistLevels: 3,
        minHumidityLevel: 40,
        maxHumidityLevel: 80
    },
    {
        isValid: (input: string) =>
            input.includes(DeviceName.LV600S_EU),
        hasAutoMode: true,
        coolMistLevels: 9,
        hasLight: false,
        hasSleepMode: true,
        hasWarmMode: true,
        warmMistLevels: 3,
        minHumidityLevel: 40,
        maxHumidityLevel: 80
    },
    {
        isValid: (input: string) =>
            input.includes(DeviceName.LV600S_UK),
        hasAutoMode: true,
        coolMistLevels: 9,
        hasLight: false,
        hasSleepMode: true,
        hasWarmMode: true,
        warmMistLevels: 3,
        minHumidityLevel: 40,
        maxHumidityLevel: 80
    },
];

export default deviceTypes;
