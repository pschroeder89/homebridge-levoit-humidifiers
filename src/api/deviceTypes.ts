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
    hasWarmMode: boolean;
    warmLevels: number;
    mistLevels: number;
    mistMinLevel: number;
}

const deviceTypes: DeviceType[] = [
    {
        isValid: (input: string) =>
            input.includes(DeviceName.Classic300S),
        hasAutoMode: true,
        hasWarmMode: true,
        warmLevels: 3,
        mistMinLevel: 1,
        mistLevels: 9
    },
    {
        isValid: (input: string) =>
            input.includes(DeviceName.Classic200S),
        hasAutoMode: true,
        hasWarmMode: false,
        warmLevels: 0,
        mistMinLevel: 1,
        mistLevels: 9
    },
    {
        isValid: (input: string) => input.includes(DeviceName.Dual200S),
        hasAutoMode: true,
        hasWarmMode: false,
        warmLevels: 0,
        mistMinLevel: 1,
        mistLevels: 2
    },
    {
        isValid: (input: string) => input.includes(DeviceName.Dual200S_EU),
        hasAutoMode: true,
        hasWarmMode: false,
        warmLevels: 0,
        mistMinLevel: 1,
        mistLevels: 2
    },
    {
        isValid: (input: string) => input.includes(DeviceName.Dual200S_UK),
        hasAutoMode: true,
        hasWarmMode: false,
        warmLevels: 0,
        mistMinLevel: 1,
        mistLevels: 2
    },
    {
        isValid: (input: string) =>
            input.includes(DeviceName.LV600S),
        hasAutoMode: true,
        hasWarmMode: true,
        warmLevels: 3,
        mistMinLevel: 1,
        mistLevels: 9
    },
];

export default deviceTypes;
