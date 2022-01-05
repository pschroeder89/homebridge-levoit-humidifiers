export enum DeviceName {
    Classic300S = 'classic300s',
    Classic200S = "classic200s",
    Dual200S = 'dual200s',
}

export interface DeviceType {
    isValid: (input: string) => boolean;
    hasAutoMode: boolean;
    mistLevels: number;
    mistMinLevel: number;
}

function sanitizeString(input) {
    // Lowercase the input and remove all whitespace
    return input.toLowerCase().replace(/\s+/g, '');
}

const deviceTypes: DeviceType[] = [
    {
        isValid: (input: string) =>
            sanitizeString(input).includes(DeviceName.Classic300S),
        hasAutoMode: true,
        mistMinLevel: 1,
        mistLevels: 9
    },
    {
        isValid: (input: string) =>
            sanitizeString(input).includes(DeviceName.Classic200S),
        hasAutoMode: true,
        mistMinLevel: 1,
        mistLevels: 9
    },
    {
        isValid: (input: string) => sanitizeString(input).includes(DeviceName.Dual200S),
        hasAutoMode: true,
        mistMinLevel: 1,
        mistLevels: 2
    },
];

export default deviceTypes;
