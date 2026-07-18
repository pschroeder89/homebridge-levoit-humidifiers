// Stable hardware ID prefixes used to recognize whole device families,
// so that new regional variants continue to be supported.
export enum DevicePrefix {
  Classic300S = 'LUH-A601S-',
  Dual200S = 'LUH-D301S-',
  LV600S_V1 = 'LUH-A602S-',
  LV600S_V2 = 'LUH-A603S-',
  OASIS = 'LUH-O451S-',
  OASIS_1000S = 'LUH-M101S-',
  NeoClassic450S = 'LUH-N451S-',
  LEH_S601S = 'LEH-S601S-',
  LEH_S602S = 'LEH-S602S-',
  O601S = 'LUH-O601S-',
  Sprout = 'LEH-B381S-',
}

export const LV600S_PREFIXES = [
  DevicePrefix.LV600S_V1,
  DevicePrefix.LV600S_V2,
] as const;

// Superior 6000S is sold under both the LEH-S601S and LEH-S602S hardware prefixes;
// both share the same feature set and mode strings.
export const SUPERIOR_6000S_PREFIXES = [
  DevicePrefix.LEH_S601S,
  DevicePrefix.LEH_S602S,
] as const;

export const NEW_FORMAT_PREFIXES = [
  DevicePrefix.OASIS_1000S,
  DevicePrefix.NeoClassic450S,
  DevicePrefix.LEH_S601S,
  DevicePrefix.LEH_S602S,
  DevicePrefix.LV600S_V2,
  DevicePrefix.Sprout,
] as const;

const matchesAnyPrefix = (
  model: string,
  prefixes: readonly string[],
): boolean => prefixes.some((p) => model.includes(p));

export const isLV600S = (model: string): boolean =>
  matchesAnyPrefix(model, LV600S_PREFIXES);

export const isSuperior6000S = (model: string): boolean =>
  matchesAnyPrefix(model, SUPERIOR_6000S_PREFIXES);

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
  LV600S: `${DevicePrefix.LV600S_V1}WUS`,
  LV600S_REMOTE: `${DevicePrefix.LV600S_V1}WUSR`,
  LV600S_EU: `${DevicePrefix.LV600S_V1}WEU`,
  LV600S_UK: `${DevicePrefix.LV600S_V1}WUK`,
  LV600S_JP: `${DevicePrefix.LV600S_V1}WJP`,
  OASIS: `${DevicePrefix.OASIS}WUS`,
  OASIS_UK: `${DevicePrefix.OASIS}WUK`,
  OASIS_EU: `${DevicePrefix.OASIS}WEU`,
  OASIS_JP: `${DevicePrefix.OASIS}WJP`,
  OASIS_1000S: `${DevicePrefix.OASIS_1000S}WUS`,
  OASIS_1000S_UK: `${DevicePrefix.OASIS_1000S}WUK`,
  OASIS_1000S_EU: `${DevicePrefix.OASIS_1000S}WEU`,
  OASIS_1000S_EUR: `${DevicePrefix.OASIS_1000S}WEUR`,
  OASIS_1000S_JP: `${DevicePrefix.OASIS_1000S}WJP`,
  NeoClassic450S_US: `${DevicePrefix.NeoClassic450S}WUS`,
  LEH_S601S_WUS: `${DevicePrefix.LEH_S601S}WUS`,
  LEH_S601S_WUSR: `${DevicePrefix.LEH_S601S}WUSR`,
  LEH_S602S_WUS: `${DevicePrefix.LEH_S602S}WUS`,
  LUH_O601S_WUS: `${DevicePrefix.O601S}WUS`,
  LUH_O601S_KUS: `${DevicePrefix.O601S}KUS`,
  Sprout_WUS: `${DevicePrefix.Sprout}WUS`,
  Sprout_WEU: `${DevicePrefix.Sprout}WEU`,
} as const;

export type DeviceName = (typeof DeviceName)[keyof typeof DeviceName];

export const isNewFormatDevice = (model: string): boolean =>
  matchesAnyPrefix(model, NEW_FORMAT_PREFIXES);

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
  /**
   * When true, dragging the primary target humidity slider targets Humidity (Smart) mode
   * instead of AutoPro mode, leaving AutoPro reachable only via its dedicated switch.
   *
   * Opt-in and defaults to false/unset: on AutoPro-capable devices, VeSync's "humidity"
   * workMode has only been confirmed for the LV600S family so far. Flip this to true for a
   * given model only after confirming on real hardware that `workMode: "humidity"` is a
   * valid mode for it (see #99) - until then it keeps today's behavior (slider -> AutoPro).
   */
  humiditySliderTargetsAutoMode?: boolean;
  /**
   * Whether the device supports a physical child lock toggle. Only confirmed
   * on Superior 6000S and Sprout Humidifier.
   */
  hasChildLock?: boolean;
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
    isValid: (input: string) => isLV600S(input),
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
    // NeoClassic 450S family (LUH-N451S-*)
    isValid: (input: string) => input.includes(DevicePrefix.NeoClassic450S),
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
    // Superior 6000S WUSR variants (LEH-S601S-WUSR, lower min humidity)
    isValid: (input: string) =>
      input.includes(DevicePrefix.LEH_S601S) && input.includes('WUSR'),
    hasAutoMode: true,
    hasAutoProMode: true,
    // 'humidity' is a distinct workMode from 'autoPro' on this family, so the
    // target humidity slider can safely target Humidity (Smart) mode instead
    // of always forcing AutoPro. See #99.
    humiditySliderTargetsAutoMode: true,
    hasChildLock: true,
    mistLevels: 9,
    hasLight: false,
    hasColorMode: false,
    hasSleepMode: true,
    hasWarmMode: false,
    minHumidityLevel: 30,
    maxHumidityLevel: 80,
  },
  {
    // Superior 6000S family (LEH-S601S-* and LEH-S602S-*, all other variants)
    isValid: (input: string) => isSuperior6000S(input),
    hasAutoMode: true,
    hasAutoProMode: true,
    // See comment above.
    humiditySliderTargetsAutoMode: true,
    hasChildLock: true,
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
  {
    // Sprout Humidifier family (LEH-B381S-*). This device's only auto-like
    // mode is "autoPro" (no separate "humidity" mode like Superior 6000S
    // has), so humiditySliderTargetsAutoMode is left unset and the target
    // humidity slider/AutoPro-off correctly fall back to
    // AutoPro/Manual. It also has a tunable-white night light (brightness +
    // color temperature, not RGB), drying mode, and filter/temperature
    // sensors - none of which this plugin models yet for any device, so
    // hasLight stays false here rather than exposing a control shape we
    // don't actually support.
    isValid: (input: string) => input.includes(DevicePrefix.Sprout),
    hasAutoMode: true,
    hasAutoProMode: true,
    hasChildLock: true,
    mistLevels: 2,
    hasLight: false,
    hasColorMode: false,
    hasSleepMode: true,
    hasWarmMode: false,
    minHumidityLevel: 30,
    maxHumidityLevel: 80,
  },
];

export default deviceTypes;
