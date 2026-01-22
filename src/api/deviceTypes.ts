// Stable hardware ID prefixes used to recognize whole device families,
// so that new regional variants continue to be supported.
export enum DevicePrefix {
  Classic300S = 'LUH-A601S-',
  Dual200S = 'LUH-D301S-',
  LV600S = 'LUH-A60',
  OASIS = 'LUH-O451S-',
  OASIS_1000S = 'LUH-M101S-',
  LEH_S601S = 'LEH-S601S-',
  O601S = 'LUH-O601S-',
}

export const DeviceName = {
  Classic300S: 'Classic300S',
  Classic300S_US: `${DevicePrefix.Classic300S}WUSB`,
  Classic300S_AUS: `${DevicePrefix.Classic300S}AUSW`,
  Classic200S: 'Classic200S',
  Dual200S: 'Dual200S',
  Dual200S_LIGHT: `${DevicePrefix.Dual200S}WUSR`,
  Dual200S_EU: `${DevicePrefix.Dual200S}WEU`,
  Dual200S_UK: `${DevicePrefix.Dual200S}WUK`,
  Dual200S_JP: `${DevicePrefix.Dual200S}WJP`,
  LV600S: `${DevicePrefix.LV600S}WUS`,
  LV600S_REMOTE: `${DevicePrefix.LV600S}WUSR`,
  LV600S_EU: `${DevicePrefix.LV600S}WEU`,
  LV600S_UK: `${DevicePrefix.LV600S}WUK`,
  LV600S_JP: `${DevicePrefix.LV600S}WJP`,
  OASIS: `${DevicePrefix.OASIS}WUS`,
  OASIS_UK: `${DevicePrefix.OASIS}WUK`,
  OASIS_EU: `${DevicePrefix.OASIS}WEU`,
  OASIS_JP: `${DevicePrefix.OASIS}WJP`,
  OASIS_1000S: `${DevicePrefix.OASIS_1000S}WUS`,
  OASIS_1000S_UK: `${DevicePrefix.OASIS_1000S}WUK`,
  OASIS_1000S_EU: `${DevicePrefix.OASIS_1000S}WEU`,
  OASIS_1000S_EUR: `${DevicePrefix.OASIS_1000S}WEUR`,
  OASIS_1000S_JP: `${DevicePrefix.OASIS_1000S}WJP`,
  LEH_S601S_WUS: `${DevicePrefix.LEH_S601S}WUS`,
  LEH_S601S_WUSR: `${DevicePrefix.LEH_S601S}WUSR`,
  LUH_O601S_WUS: `${DevicePrefix.O601S}WUS`,
  LUH_O601S_KUS: `${DevicePrefix.O601S}KUS`,
} as const;

export type DeviceName = (typeof DeviceName)[keyof typeof DeviceName];

/**
 * New response format devices:
 * - Oasis 1000S family (LUH-M101S-*)
 * - LEH-S601S family (LEH-S601S-*)
 * - LV600S newer variants (LUH-A603S-*)
 */
export const isNewFormatDevice = (model: string): boolean =>
  model.includes(DevicePrefix.OASIS_1000S) ||
  model.includes(DevicePrefix.LEH_S601S) ||
  model.includes('LUH-A603S-');

export interface DeviceType {
  isValid: (input: string) => boolean;
  hasAutoMode: boolean;
  mistLevels: number;
  hasLight: boolean;
  hasColorMode: boolean;
  hasSleepMode: boolean;
  hasWarmMode: boolean;
  warmMistLevels?: number;
  minHumidityLevel: number;
  maxHumidityLevel: number;
  hasAutoProMode?: boolean;
}

// All supported models, matched by either an exact model name or a stable device prefix.
const deviceTypes: DeviceType[] = [
  {
    // Classic 300S family (Classic300S, LUH-A601S-*)
    isValid: (input: string) =>
      input.includes(DeviceName.Classic300S) ||
      input.includes(DevicePrefix.Classic300S),
    hasAutoMode: true,
    mistLevels: 9,
    hasLight: true,
    hasColorMode: false,
    hasSleepMode: true,
    hasWarmMode: false,
    minHumidityLevel: 30,
    maxHumidityLevel: 80,
  },
  {
    // Classic 200S
    isValid: (input: string) => input.includes(DeviceName.Classic200S),
    hasAutoMode: true,
    mistLevels: 9,
    hasLight: false,
    hasColorMode: false,
    hasSleepMode: false,
    hasWarmMode: false,
    minHumidityLevel: 30,
    maxHumidityLevel: 80,
  },
  {
    // Dual 200S (non-light variants) - matches prefix but excludes LIGHT variant
    isValid: (input: string) =>
      (input.includes(DeviceName.Dual200S) ||
        input.includes(DevicePrefix.Dual200S)) &&
      !input.includes(DeviceName.Dual200S_LIGHT),
    hasAutoMode: true,
    mistLevels: 2,
    hasLight: false,
    hasColorMode: false,
    hasSleepMode: false,
    hasWarmMode: false,
    minHumidityLevel: 30,
    maxHumidityLevel: 80,
  },
  {
    // Dual 200S with light
    isValid: (input: string) => input.includes(DeviceName.Dual200S_LIGHT),
    hasAutoMode: true,
    mistLevels: 2,
    hasLight: true,
    hasColorMode: true,
    hasSleepMode: true,
    hasWarmMode: false,
    minHumidityLevel: 30,
    maxHumidityLevel: 80,
  },
  {
    // LV600S family (LUH-A602S-* and LUH-A603S-* variants)
    // Check Classic300S first to avoid matching LUH-A601S-*
    isValid: (input: string) =>
      !input.includes(DevicePrefix.Classic300S) &&
      input.includes(DevicePrefix.LV600S),
    hasAutoMode: true,
    mistLevels: 9,
    hasLight: false,
    hasColorMode: false,
    hasSleepMode: true,
    hasWarmMode: true,
    warmMistLevels: 3,
    minHumidityLevel: 40,
    maxHumidityLevel: 80,
  },
  {
    // Oasis family (LUH-O451S-*)
    isValid: (input: string) => input.includes(DevicePrefix.OASIS),
    hasAutoMode: true,
    mistLevels: 9,
    hasLight: false,
    hasColorMode: false,
    hasSleepMode: true,
    hasWarmMode: true,
    warmMistLevels: 3,
    minHumidityLevel: 40,
    maxHumidityLevel: 80,
  },
  {
    // Oasis 1000S family (LUH-M101S-*)
    isValid: (input: string) => input.includes(DevicePrefix.OASIS_1000S),
    hasAutoMode: true,
    mistLevels: 9,
    hasLight: false,
    hasColorMode: false,
    hasSleepMode: true,
    hasWarmMode: false,
    minHumidityLevel: 40,
    maxHumidityLevel: 80,
  },
  {
    // LEH-S601S WUSR variants (lower min humidity)
    isValid: (input: string) =>
      input.includes(DevicePrefix.LEH_S601S) && input.includes('WUSR'),
    hasAutoMode: true,
    hasAutoProMode: true,
    mistLevels: 9,
    hasLight: false,
    hasColorMode: false,
    hasSleepMode: true,
    hasWarmMode: false,
    minHumidityLevel: 30,
    maxHumidityLevel: 80,
  },
  {
    // LEH-S601S family (all other variants)
    isValid: (input: string) => input.includes(DevicePrefix.LEH_S601S),
    hasAutoMode: true,
    hasAutoProMode: true,
    mistLevels: 9,
    hasLight: false,
    hasColorMode: false,
    hasSleepMode: true,
    hasWarmMode: false,
    minHumidityLevel: 40,
    maxHumidityLevel: 80,
  },
  {
    // LUH-O601S family (LUH-O601S-*)
    isValid: (input: string) => input.includes(DevicePrefix.O601S),
    hasAutoMode: true,
    hasAutoProMode: false,
    mistLevels: 9,
    hasLight: false,
    hasColorMode: false,
    hasSleepMode: true,
    hasWarmMode: true,
    warmMistLevels: 3,
    minHumidityLevel: 40,
    maxHumidityLevel: 80,
  },
];

export default deviceTypes;
