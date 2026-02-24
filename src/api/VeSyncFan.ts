import AsyncLock from 'async-lock';
import deviceTypes, {
  DeviceType,
  isLV600S,
  isNewFormatDevice,
} from './deviceTypes';
import { getErrorMessage } from '../utils/errorMessage';

import VeSync, { BypassMethod, DEVICE_UNREACHABLE_ERROR } from './VeSync';

export enum Mode {
  Manual = 'manual',
  Sleep = 'sleep',
  Auto = 'auto',
  AutoPro = 'autoPro',
  Humidity = 'humidity',
}

/**
 * VeSyncFan represents a single Levoit humidifier device.
 * Manages device state, API communication, and provides methods to control the device.
 */
export default class VeSyncFan {
  private readonly lock: AsyncLock = new AsyncLock();
  public readonly deviceType: DeviceType;

  /**
   * Timestamp of the last successful device info update.
   * Used to implement a 5-second cache to prevent excessive API calls.
   */
  private lastCheck = 0;

  private _displayOn = true;
  private _waterLacks = false;
  private _waterTankLifted = false;
  private _temperature = 0;
  private _filterLife = 100;

  public readonly manufacturer = 'Levoit';

  /**
   * Resets all device state values to their "off" state.
   * Used when device is turned off or becomes unreachable.
   */
  private resetStateToOff(): void {
    this._isOn = false;
    this._displayOn = false;
    this._mistLevel = 0;
    this._warmLevel = 0;
    this._brightnessLevel = 0;
    this._lightOn = 'off';
  }

  public get humidityLevel() {
    return this._humidityLevel;
  }

  public get targetHumidity() {
    return this._targetHumidity;
  }

  public get displayOn() {
    return this._displayOn;
  }

  public get brightnessLevel() {
    return this._brightnessLevel;
  }

  public get mistLevel() {
    return this._mistLevel;
  }

  public get warmLevel() {
    return this._warmLevel;
  }

  public get warmEnabled() {
    return this._warmEnabled;
  }

  public get lightOn() {
    return this._lightOn;
  }

  public get mode() {
    return this._mode;
  }

  public get targetReached() {
    return this._targetReached;
  }

  public get isOn() {
    return this._isOn;
  }

  public get waterLacks() {
    return this._waterLacks;
  }

  public get waterTankLifted() {
    return this._waterTankLifted;
  }

  public get temperature() {
    return this._temperature;
  }

  public get filterLife() {
    return this._filterLife;
  }

  constructor(
    private readonly client: VeSync,
    public readonly name: string,
    private _mode: Mode,
    private _isOn: boolean,
    private _mistLevel: number,
    private _warmLevel: number,
    private _warmEnabled: boolean,
    private _brightnessLevel: number,
    private _humidityLevel: number,
    private _targetHumidity: number,
    private _targetReached: boolean,
    private _lightOn: string,
    private _lightSpeed: number,
    private _red: number,
    private _blue: number,
    private _green: number,
    private _colorMode: string,
    private _colorSliderLocation: number,
    public readonly configModule: string,
    public readonly cid: string,
    public readonly region: string,
    public readonly model: string,
    public readonly mac: string,
    public readonly uuid: string,
  ) {
    this.deviceType = deviceTypes.find(({ isValid }) => isValid(this.model))!;
  }

  /**
   * Stores the last non-zero target humidity to restore when device is turned back on.
   * This preserves user preferences across power cycles.
   */
  private _lastTargetHumidity = 0;

  /**
   * Sets the device power state (on/off).
   * When turning off, resets related state values to 0.
   * When turning on, restores the last known target humidity from memory.
   *
   * @param power - true to turn on, false to turn off
   * @returns true if successful, false otherwise
   */
  public async setPower(power: boolean): Promise<boolean> {
    this.client.log.info('Setting Power to ' + power);
    let switchJson;
    if (isNewFormatDevice(this.model)) {
      switchJson = {
        powerSwitch: power ? 1 : 0,
        id: 0,
      };
    } else {
      switchJson = {
        enabled: power,
        id: 0,
      };
    }
    const success = await this.client.sendCommand(
      this,
      BypassMethod.SWITCH,
      switchJson,
    );

    if (success) {
      this._isOn = power;
      if (!this._isOn) {
        // When turning off, save current target and reset all state to match device behavior
        if (this._targetHumidity > 0) {
          this._lastTargetHumidity = this._targetHumidity;
        }
        this._mistLevel = 0;
        this._warmLevel = 0;
        this._warmEnabled = false;
        this._brightnessLevel = 0;
        this._lightOn = 'off';
        this._displayOn = false;
        // Note: mode is not reset as the device retains its last mode when powered back on
      } else {
        // When turning on, restore last known target from memory
        // Background polling will sync with device's actual value within 30s
        if (this._targetHumidity === 0 && this._lastTargetHumidity > 0) {
          this._targetHumidity = this._lastTargetHumidity;
        } else if (this._targetHumidity === 0) {
          // Fallback default if no previous value exists
          this._targetHumidity = 55;
        }
      }
    } else {
      this.client.log.error('Failed to setPower due to unreachable device.');
      if (this.client.config.options.showOffWhenDisconnected) {
        this.resetStateToOff();
      } else {
        return false;
      }
    }

    return success;
  }

  /**
   * Sets the target humidity percentage for Auto/Humidity mode.
   * Handles different JSON field names for new vs old device formats.
   *
   * @param level - Target humidity percentage (device-specific range, typically 30-80% or 40-80%)
   * @returns true if successful, false otherwise
   */
  public async setTargetHumidity(level: number): Promise<boolean> {
    this.client.log.info('Setting Target Humidity to ' + level);

    // Oasis 1000 uses camelcase instead of snakecase
    let humidityJson;
    if (isNewFormatDevice(this.model)) {
      humidityJson = {
        targetHumidity: level,
        id: 0,
      };
    } else {
      humidityJson = {
        target_humidity: level,
        id: 0,
      };
    }

    const success = await this.client.sendCommand(
      this,
      BypassMethod.HUMIDITY,
      humidityJson,
    );

    if (success) {
      this._targetHumidity = level;
    }

    return success;
  }

  /**
   * Changes the device operating mode.
   * Automatically maps Auto mode to the appropriate mode for the device:
   * - LV600S models use "Humidity" mode instead of "Auto"
   * - Models with AutoPro support use "AutoPro" mode instead of "Auto"
   * Skips API call if already in the requested mode.
   *
   * @param mode - The mode to switch to
   * @returns true if successful, false otherwise
   */
  public async changeMode(mode: Mode): Promise<boolean> {
    // LV600s models use "Humidity" mode instead of "Auto"
    if (isLV600S(this.model) && mode == Mode.Auto) {
      mode = Mode.Humidity;
    }
    // Some models use "AutoPro" mode instead of "Auto"
    if (this.deviceType.hasAutoProMode && mode == Mode.Auto) {
      mode = Mode.AutoPro;
    }

    let success: boolean;

    // Oasis 1000 uses camelcase instead of snakecase
    let modeJson;
    if (isNewFormatDevice(this.model)) {
      modeJson = {
        workMode: mode.toString(),
      };
    } else {
      modeJson = {
        mode: mode.toString(),
      };
    }
    // Don't change the mode if we are already in that mode
    if (this._mode == mode) {
      success = true;
    } else {
      this.client.log.info('Changing Mode to ' + mode);
      success = await this.client.sendCommand(
        this,
        BypassMethod.MODE,
        modeJson,
      );
    }
    if (success) {
      this._mode = mode;
    }

    return success;
  }

  /**
   * Sets the night light brightness level.
   * For non-RGB devices only. RGB devices should use setLightStatus().
   *
   * @param brightness - Brightness level (0-100)
   * @returns true if successful, false otherwise
   */
  public async setBrightness(brightness: number): Promise<boolean> {
    this.client.log.info('Setting Night Light to ' + brightness);

    const success = await this.client.sendCommand(
      this,
      BypassMethod.NIGHT_LIGHT_BRIGHTNESS,
      {
        night_light_brightness: brightness,
      },
    );

    if (success) {
      this._brightnessLevel = brightness;
    }

    return success;
  }

  /**
   * Sets the device display screen state (on/off).
   * Handles different JSON field names for new vs old device formats.
   *
   * @param power - true to turn display on, false to turn off
   * @returns true if successful, false otherwise
   */
  public async setDisplay(power: boolean): Promise<boolean> {
    this.client.log.info('Setting Display to ' + power);

    // Oasis 1000 uses camelcase instead of snakecase
    let displayJson;
    if (isNewFormatDevice(this.model)) {
      displayJson = {
        screenSwitch: power ? 1 : 0,
        id: 0,
      };
    } else {
      displayJson = {
        state: power,
        id: 0,
      };
    }

    const success = await this.client.sendCommand(
      this,
      BypassMethod.DISPLAY,
      displayJson,
    );

    if (success) {
      this._displayOn = power;
    }

    return success;
  }

  /**
   * Changes the cool mist level.
   * Validates the level is within device limits (1 to mistLevels).
   * Handles different JSON field names for new vs old device formats.
   *
   * @param mistLevel - Mist level (1 to device-specific maximum, typically 9)
   * @returns true if successful, false if level is out of range
   */
  public async changeMistLevel(mistLevel: number): Promise<boolean> {
    if (mistLevel > this.deviceType.mistLevels || mistLevel < 1) {
      return false;
    }

    this.client.log.info('Setting Mist Level to ' + mistLevel);

    // New models use different JSON keys
    let mistJson;
    const method = BypassMethod.MIST_LEVEL;
    if (isNewFormatDevice(this.model)) {
      mistJson = {
        virtualLevel: mistLevel,
        levelType: 'mist',
        id: 0,
      };
    } else {
      mistJson = {
        level: mistLevel,
        type: 'mist',
        id: 0,
      };
    }

    const success = await this.client.sendCommand(this, method, mistJson);

    if (success) {
      this._mistLevel = mistLevel;
    }

    return success;
  }

  /**
   * Changes the warm mist level.
   * Only available on devices with warm mist capability.
   * Validates the level is within device limits (0 to warmMistLevels).
   * Updates warmEnabled state based on level (0 = disabled, >0 = enabled).
   *
   * @param warmMistLevel - Warm mist level (0 to device-specific maximum, typically 3)
   * @returns true if successful, false if device doesn't support warm mist or level is out of range
   */
  public async changeWarmMistLevel(warmMistLevel: number): Promise<boolean> {
    if (!this.deviceType.warmMistLevels) {
      this.client.log.error(
        'Error: Attempted to set warm level on device without warmMistLevels field.',
      );
      return false;
    }

    if (warmMistLevel > this.deviceType.warmMistLevels || warmMistLevel < 0) {
      return false;
    }

    this.client.log.info('Setting Warm Level to ' + warmMistLevel);

    const success = await this.client.sendCommand(this, BypassMethod.LEVEL, {
      level: warmMistLevel,
      type: 'warm',
      id: 0,
    });

    if (success) {
      this._warmLevel = warmMistLevel;
      if (this._warmLevel == 0) {
        this._warmEnabled = false;
      } else {
        this._warmEnabled = true;
      }
    }

    return success;
  }

  /**
   * Sets the RGB night light status and brightness.
   * Only for RGB-capable devices. Calculates RGB color values proportionally
   * when brightness changes to maintain color appearance.
   *
   * @param action - Light action: 'on' or 'off'
   * @param brightness - Brightness level (0-100)
   * @returns true if successful, false otherwise
   */
  public async setLightStatus(
    action: string,
    brightness: number,
  ): Promise<boolean> {
    // Get the current RGB values and brightness %
    const red = this._red;
    const green = this._green;
    const blue = this._blue;
    const currentBrightness = this._brightnessLevel;
    let newRed: number | undefined;
    let newGreen: number | undefined;
    let newBlue: number | undefined;

    // If we're changing brightness, calculate the RGB values to adjust to
    if (brightness !== this._brightnessLevel) {
      newRed = Math.round(red * (brightness / currentBrightness));
      newGreen = Math.round(green * (brightness / currentBrightness));
      newBlue = Math.round(blue * (brightness / currentBrightness));
    }

    const lightJson = {
      action: action,
      speed: this._lightSpeed,
      red: newRed || this._red,
      green: newGreen || this._green,
      blue: newBlue || this._blue,
      brightness: brightness,
      colorMode: this._colorMode,
      colorSliderLocation: this._colorSliderLocation,
    };
    this.client.log.debug(
      'Setting Night Light Status to ' + JSON.stringify(lightJson),
    );

    const success = await this.client.sendCommand(
      this,
      BypassMethod.LIGHT_STATUS,
      lightJson,
    );

    if (success) {
      this._brightnessLevel = brightness;
      this._blue = newBlue || this._blue;
      this._green = newGreen || this._green;
      this._red = newRed || this._red;
      this._lightOn = action;
    }

    return success;
  }

  /**
   * Updates device state from the VeSync API.
   * Implements a 15-second cache to prevent excessive API calls.
   * This cache works in conjunction with background polling (30-second interval)
   * to ensure fresh data while minimizing API load and respecting quota limits.
   *
   * Thread-safe: Uses AsyncLock to prevent concurrent updates.
   *
   * @throws Error if device is unreachable and showOffWhenDisconnected is false
   */
  public async updateInfo(): Promise<void> {
    return this.lock.acquire('update-info', async () => {
      try {
        // 15-second cache prevents excessive API calls
        // Background polling (30s) ensures cache is refreshed regularly
        // while respecting VeSync API quota limits
        if (Date.now() - this.lastCheck < 15 * 1000) {
          return;
        }

        const data = await this.client.getDeviceInfo(this);

        this.lastCheck = Date.now();
        const deviceResult = data?.result?.result;
        if (
          !deviceResult &&
          this.client.config.options?.showOffWhenDisconnected
        ) {
          this.resetStateToOff();
          return;
        } else if (!deviceResult) {
          return;
        }

        const result = deviceResult;

        this._humidityLevel = (result.humidity as number) ?? 0;
        // Fields are different on newer models
        if (isNewFormatDevice(this.model)) {
          this._targetHumidity = (result.targetHumidity as number) ?? 0;
          this._displayOn = (result.screenSwitch as boolean) ?? false;
          this._mode = (result.workMode as Mode) ?? Mode.Auto;
          this._isOn = (result.powerSwitch as number) === 1;
          this._targetReached = (result.autoStopState as boolean) ?? false;
          this._mistLevel = (result.virtualLevel as number) ?? 0;
        } else {
          this._targetHumidity =
            (result.configuration?.auto_target_humidity as number) ?? 0;
          this._displayOn = (result.display as boolean) ?? false;
          this._mode = (result.mode as Mode) ?? Mode.Auto;
          this._isOn = (result.enabled as boolean) ?? false;
          this._targetReached =
            (result.automatic_stop_reach_target as boolean) ?? false;
          this._mistLevel = (result.mist_virtual_level as number) ?? 0;
        }

        this._warmLevel = (result.warm_level as number) ?? 0;
        this._warmEnabled = (result.warm_enabled as boolean) ?? false;
        this._waterLacks = (result.water_lacks as boolean) ?? false;
        this._waterTankLifted = (result.water_tank_lifted as boolean) ?? false;
        this._temperature = (result.temperature as number) ?? 0;
        this._filterLife = (result.filter_life as number) ?? 100;

        this._brightnessLevel =
          ((result.night_light_brightness ??
            result.rgbNightLight?.brightness) as number) ?? 0;
        // RGB Light Devices Only:
        this._lightOn = (result.rgbNightLight?.action as string) ?? 'off';
        this._blue = (result.rgbNightLight?.blue as number) ?? 0;
        this._green = (result.rgbNightLight?.green as number) ?? 0;
        this._red = (result.rgbNightLight?.red as number) ?? 0;
        this._colorMode = (result.rgbNightLight?.colorMode as string) ?? '';
        this._lightSpeed = (result.rgbNightLight?.speed as number) ?? 0;
        this._colorSliderLocation =
          (result.rgbNightLight?.colorSliderLocation as number) ?? 0;

        if (result.rgbNightLight) {
          const lightJson = {
            action: this._lightOn,
            speed: this._lightSpeed,
            green: this._green,
            blue: this._blue,
            red: this._red,
            brightness: this._brightnessLevel,
            colorMode: this._colorMode,
            colorSliderLocation: this._colorSliderLocation,
          };

          this.client.debugMode.debug(
            '[GET LIGHT JSON]',
            JSON.stringify(lightJson),
          );
        }
      } catch (err: unknown) {
        this.client.log.error(
          'Failed to updateInfo due to unreachable device: ' +
            getErrorMessage(err),
        );
        if (this.client.config.options.showOffWhenDisconnected) {
          this.resetStateToOff();
        } else {
          throw new Error(DEVICE_UNREACHABLE_ERROR);
        }
      }
    });
  }

  /**
   * Factory method to create a VeSyncFan instance from VeSync API response data.
   * Used during device discovery to instantiate devices from the device list.
   *
   * @param client - The VeSync client instance for API communication
   * @returns A function that takes device data and returns a VeSyncFan instance
   */
  public static readonly fromResponse =
    (client: VeSync) =>
    ({
      deviceName,
      mode,
      deviceStatus,
      mistLevel,
      warmLevel,
      warmEnabled,
      brightnessLevel,
      humidity,
      targetHumidity,
      targetReached,
      lightOn,
      lightSpeed,
      red,
      blue,
      green,
      colorMode,
      colorSliderLocation,
      configModule,
      cid,
      deviceRegion,
      deviceType,
      macID,
      uuid,
    }) =>
      new VeSyncFan(
        client,
        deviceName,
        mode,
        deviceStatus,
        mistLevel,
        warmLevel,
        warmEnabled,
        brightnessLevel,
        humidity,
        targetHumidity,
        targetReached,
        lightOn,
        lightSpeed,
        red,
        blue,
        green,
        colorMode,
        colorSliderLocation,
        configModule,
        cid,
        deviceRegion,
        deviceType,
        macID,
        uuid,
      );
}
