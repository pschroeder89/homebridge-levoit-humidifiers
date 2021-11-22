export enum DeviceName {
  Classic300S = '300S',
  Dual200S = 'Dual200S',
}

export interface DeviceType {
  isValid: (input: string) => boolean;
  hasAutoMode: boolean;
  mistLevels: number;
  mistMinLevel: number;
}

const deviceTypes: DeviceType[] = [
  {
    isValid: (input: string) =>
      input.includes(DeviceName.Classic300S),
    hasAutoMode: true,
    mistMinLevel: 1,
    mistLevels: 9
  },
  {
    isValid: (input: string) => input.includes(DeviceName.Dual200S),
    hasAutoMode: true,
    mistMinLevel: 1,
    mistLevels: 2
  },
];

export default deviceTypes;
