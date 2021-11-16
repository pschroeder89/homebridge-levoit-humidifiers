export enum DeviceName {
  Classic300S = '300S',
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
  }
];

export default deviceTypes;
