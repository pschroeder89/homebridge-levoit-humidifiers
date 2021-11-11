export enum DeviceName {
  Core400SPro = '401S',
  Core400S = '400S',
  Core300S = '300S',
  Core200S = '200S'
}

export interface DeviceType {
  isValid: (input: string) => boolean;
  hasAutoMode: boolean;
  speedLevels: number; // With night mode
  speedMinStep: number;
}

const deviceTypes: DeviceType[] = [
  {
    isValid: (input: string) =>
      input.includes(DeviceName.Core400SPro) ||
      input.includes(DeviceName.Core400S),
    hasAutoMode: true,
    speedMinStep: 20,
    speedLevels: 5
  },
  {
    isValid: (input: string) => input.includes(DeviceName.Core300S),
    hasAutoMode: true,
    speedMinStep: 25,
    speedLevels: 4
  },
  {
    isValid: (input: string) => input.includes(DeviceName.Core200S),
    hasAutoMode: false,
    speedMinStep: 25,
    speedLevels: 4
  }
];

export default deviceTypes;
