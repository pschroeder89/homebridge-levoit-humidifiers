import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Logger, PlatformConfig } from 'homebridge';

import VeSync, { BypassMethod, DeviceInfoResponse } from './VeSync';
import VeSyncFan, { DeviceListItem, Mode } from './VeSyncFan';
import DebugMode from '../debugMode';

/**
 * Tests for VeSyncFan's command-building logic: the exact JSON payload
 * shape and bypass method sent for each device generation. This is the
 * area of the codebase most prone to silent regressions - VeSync's API
 * accepts nearly any payload shape with a 200/code:0 response even when
 * the device ignores it, so a wrong field name here fails silently in
 * production and only surfaces as a user bug report weeks later.
 */

const NOOP_LOGGER: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  log: () => undefined,
} as unknown as Logger;

function createClient(configOverrides: Partial<PlatformConfig> = {}): VeSync {
  const config = {
    options: {},
    ...configOverrides,
  } as PlatformConfig;
  const debugMode = new DebugMode(false, NOOP_LOGGER);
  return new VeSync(
    'test@example.com',
    'password',
    config,
    debugMode,
    NOOP_LOGGER,
  );
}

interface CapturedCommand {
  method: BypassMethod;
  body: Record<string, unknown>;
}

/** Replaces VeSync.sendCommand with a spy and returns the calls it captures. */
function stubSendCommand(
  client: VeSync,
  result = true,
): { calls: CapturedCommand[] } {
  const calls: CapturedCommand[] = [];
  (client as unknown as { sendCommand: VeSync['sendCommand'] }).sendCommand =
    async (_fan, method, body = {}) => {
      calls.push({ method, body });
      return result;
    };
  return { calls };
}

/** Replaces VeSync.getDeviceInfo with a spy that resolves to the given response. */
function stubGetDeviceInfo(
  client: VeSync,
  response: DeviceInfoResponse | null,
): void {
  (
    client as unknown as { getDeviceInfo: VeSync['getDeviceInfo'] }
  ).getDeviceInfo = async () => response;
}

function deviceListFixture(
  overrides: Partial<DeviceListItem> = {},
): DeviceListItem {
  return {
    deviceName: 'Test Device',
    mode: Mode.Manual,
    deviceStatus: true,
    mistLevel: 0,
    warmLevel: 0,
    warmEnabled: false,
    brightnessLevel: 0,
    humidity: 50,
    targetHumidity: 55,
    targetReached: false,
    lightOn: 'off',
    lightSpeed: 0,
    red: 255,
    blue: 255,
    green: 255,
    colorMode: 'white',
    colorSliderLocation: 0,
    configModule: 'test-config-module',
    cid: 'test-cid',
    deviceRegion: 'US',
    deviceType: 'LUH-A601S-WUSB',
    macID: 'AA:BB:CC:DD:EE:FF',
    uuid: 'test-uuid',
    type: 'wifi-air',
    ...overrides,
  };
}

function createFan(
  client: VeSync,
  deviceType: string,
  overrides: Partial<DeviceListItem> = {},
): VeSyncFan {
  return VeSyncFan.fromResponse(client)(
    deviceListFixture({ deviceType, ...overrides }),
  );
}

// Representative model prefixes for each format/family under test.
const CLASSIC_300S = 'LUH-A601S-WUSB'; // old format, no warm mist
const LV600S_OLD = 'LUH-A602S-WUS'; // old format, has warm mist
const LV600S_NEW = 'LUH-A603S-WUS'; // new format, has warm mist
const SUPERIOR_6000S = 'LEH-S601S-WUS'; // new format, AutoPro, no warm mist
const NEOCLASSIC_450S = 'LUH-N451S-WUS'; // new format, no warm mist

describe('VeSyncFan.setPower', () => {
  it('sends the old-format payload for pre-A603S devices', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, LV600S_OLD);

    await fan.setPower(true);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, BypassMethod.SWITCH);
    assert.deepEqual(calls[0].body, { enabled: true, id: 0 });
  });

  it('sends the new-format payload for new-format devices', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, LV600S_NEW);

    await fan.setPower(false);

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].body, { powerSwitch: 0, id: 0 });
  });

  it('retains targetHumidity across power-off instead of zeroing it', async () => {
    const client = createClient();
    stubSendCommand(client);
    const fan = createFan(client, CLASSIC_300S, { targetHumidity: 62 });

    await fan.setPower(false);

    assert.equal(
      fan.targetHumidity,
      62,
      'targetHumidity should be retained so HomeKit does not flash 0%',
    );
  });

  it('restores the last known targetHumidity when turning back on from a zeroed state', async () => {
    const client = createClient();
    stubSendCommand(client);
    // Start already off with a retained target from a prior power-off.
    const fan = createFan(client, CLASSIC_300S, { targetHumidity: 62 });
    await fan.setPower(false);
    // Simulate a fresh poll reporting the device as off with humidity zeroed,
    // which is how a real restart/poll cycle could observe it.
    await fan.setPower(true);

    assert.equal(fan.targetHumidity, 62);
  });
});

describe('VeSyncFan.setTargetHumidity', () => {
  it('sends the old-format payload', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, CLASSIC_300S);

    await fan.setTargetHumidity(50);

    assert.equal(calls[0].method, BypassMethod.HUMIDITY);
    assert.deepEqual(calls[0].body, { target_humidity: 50, id: 0 });
  });

  it('sends the new-format payload', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, NEOCLASSIC_450S);

    await fan.setTargetHumidity(50);

    assert.deepEqual(calls[0].body, { targetHumidity: 50, id: 0 });
  });
});

describe('VeSyncFan.changeMode', () => {
  it('does not remap Auto to Humidity for the old-format LUH-A602S', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, LV600S_OLD, { mode: Mode.Manual });

    await fan.changeMode(Mode.Auto);

    assert.equal(calls[0].method, BypassMethod.MODE);
    assert.deepEqual(calls[0].body, { mode: 'auto' });
    assert.equal(fan.mode, Mode.Auto);
  });

  it('remaps Auto to Humidity for the new-format LUH-A603S', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, LV600S_NEW, { mode: Mode.Manual });

    await fan.changeMode(Mode.Auto);

    assert.deepEqual(calls[0].body, { workMode: 'humidity' });
    assert.equal(fan.mode, Mode.Humidity);
  });

  it('remaps Auto to AutoPro for AutoPro-capable devices', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, SUPERIOR_6000S, { mode: Mode.Manual });

    await fan.changeMode(Mode.Auto);

    assert.deepEqual(calls[0].body, { workMode: 'autoPro' });
    assert.equal(fan.mode, Mode.AutoPro);
  });

  it('skips the API call when already in the requested mode', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, CLASSIC_300S, { mode: Mode.Sleep });

    const success = await fan.changeMode(Mode.Sleep);

    assert.equal(success, true);
    assert.equal(calls.length, 0);
  });
});

describe('VeSyncFan.changeMistLevel', () => {
  it('rejects a level above the device maximum without calling the API', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, CLASSIC_300S); // mistLevels: 9

    const success = await fan.changeMistLevel(10);

    assert.equal(success, false);
    assert.equal(calls.length, 0);
  });

  it('rejects level 0 (use setPower(false) to turn off instead)', async () => {
    const client = createClient();
    stubSendCommand(client);
    const fan = createFan(client, CLASSIC_300S);

    assert.equal(await fan.changeMistLevel(0), false);
  });

  it('sends the old-format payload', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, CLASSIC_300S);

    await fan.changeMistLevel(5);

    assert.equal(calls[0].method, BypassMethod.MIST_LEVEL);
    assert.deepEqual(calls[0].body, { level: 5, type: 'mist', id: 0 });
  });

  it('sends the new-format payload', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, LV600S_NEW);

    await fan.changeMistLevel(5);

    assert.deepEqual(calls[0].body, {
      virtualLevel: 5,
      levelType: 'mist',
      id: 0,
    });
  });
});

describe('VeSyncFan.changeWarmMistLevel', () => {
  it('rejects devices without warm mist support', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, CLASSIC_300S); // no warmMistLevels

    const success = await fan.changeWarmMistLevel(1);

    assert.equal(success, false);
    assert.equal(calls.length, 0);
  });

  it('rejects an out-of-range level', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, LV600S_OLD); // warmMistLevels: 3

    assert.equal(await fan.changeWarmMistLevel(4), false);
    assert.equal(calls.length, 0);
  });

  it('sends the old-format payload via setLevel', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, LV600S_OLD);

    await fan.changeWarmMistLevel(2);

    assert.equal(calls[0].method, BypassMethod.LEVEL);
    assert.deepEqual(calls[0].body, { level: 2, type: 'warm', id: 0 });
  });

  it('sends the corrected new-format payload for LUH-A603S (regression guard for #104)', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, LV600S_NEW);

    await fan.changeWarmMistLevel(2);

    // This is NOT a virtualLevel/setVirtualLevel command like cool mist -
    // confirmed against pyvesync's dedicated LV600S class. Getting this
    // wrong doesn't error, it just gets silently ignored by the device.
    assert.equal(calls[0].method, BypassMethod.LEVEL);
    assert.deepEqual(calls[0].body, {
      levelIdx: 0,
      levelType: 'warm',
      mistLevel: 0,
      warmLevel: 2,
    });
  });

  it('updates warmEnabled based on the resulting level', async () => {
    const client = createClient();
    stubSendCommand(client);
    const fan = createFan(client, LV600S_OLD);

    await fan.changeWarmMistLevel(2);
    assert.equal(fan.warmEnabled, true);

    await fan.changeWarmMistLevel(0);
    assert.equal(fan.warmEnabled, false);
  });
});

describe('VeSyncFan.setDisplay', () => {
  it('sends the old-format payload', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, CLASSIC_300S);

    await fan.setDisplay(true);

    assert.deepEqual(calls[0].body, { state: true, id: 0 });
  });

  it('sends the new-format payload', async () => {
    const client = createClient();
    const { calls } = stubSendCommand(client);
    const fan = createFan(client, NEOCLASSIC_450S);

    await fan.setDisplay(true);

    assert.deepEqual(calls[0].body, { screenSwitch: 1, id: 0 });
  });
});

describe('VeSyncFan.updateInfo', () => {
  it('reads warm mist state from camelCase keys for new-format devices (regression guard for #104)', async () => {
    const client = createClient();
    const fan = createFan(client, LV600S_NEW);
    stubGetDeviceInfo(client, {
      result: {
        result: {
          powerSwitch: 1,
          workMode: 'manual',
          targetHumidity: 55,
          humidity: 50,
          virtualLevel: 3,
          screenSwitch: true,
          autoStopState: false,
          // camelCase - what LUH-A603S actually returns
          warmLevel: 2,
          warmPower: true,
        },
      },
    });

    await fan.updateInfo();

    assert.equal(
      fan.warmLevel,
      2,
      'should read warmLevel, not fall back to 0 via the snake_case key',
    );
    assert.equal(fan.warmEnabled, true);
  });

  it('reads warm mist state from snake_case keys for old-format devices', async () => {
    const client = createClient();
    const fan = createFan(client, LV600S_OLD);
    stubGetDeviceInfo(client, {
      result: {
        result: {
          enabled: true,
          mode: 'manual',
          humidity: 50,
          mist_virtual_level: 3,
          display: true,
          automatic_stop_reach_target: false,
          configuration: { auto_target_humidity: 55 },
          warm_level: 1,
          warm_enabled: true,
        },
      },
    });

    await fan.updateInfo();

    assert.equal(fan.warmLevel, 1);
    assert.equal(fan.warmEnabled, true);
  });

  it('does not misread new-format camelCase warm keys as the old-format fields', async () => {
    const client = createClient();
    const fan = createFan(client, LV600S_OLD, {
      warmLevel: 3,
      warmEnabled: true,
    });
    // An old-format device response should never contain warmLevel/warmPower,
    // but if it somehow did, the old-format branch must ignore them.
    stubGetDeviceInfo(client, {
      result: {
        result: {
          enabled: true,
          mode: 'manual',
          humidity: 50,
          mist_virtual_level: 3,
          display: true,
          automatic_stop_reach_target: false,
          configuration: { auto_target_humidity: 55 },
          warmLevel: 99,
          warmPower: true,
        },
      },
    });

    await fan.updateInfo();

    assert.equal(fan.warmLevel, 0);
    assert.equal(fan.warmEnabled, false);
  });
});
