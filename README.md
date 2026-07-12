# Homebridge Levoit Humidifiers

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![Discord](https://discordapp.com/api/guilds/432663330281226270/widget.png?style=shield)](https://discord.com/channels/432663330281226270/1055705874460594247)
[![downloads-via-npm](https://img.shields.io/npm/dt/homebridge-levoit-humidifiers)](https://www.npmjs.com/package/homebridge-levoit-humidifiers)

This is a Homebridge plugin to control Levoit Humidifiers from Apple HomeKit.

| Supported Versions | Auto / Humidity | Mist | Sleep | Light | Display | Warm |
| ------------------ | --------------- | ---- | ----- | ----- | ------- | ---- |
| Superior 6000S     | ✅              | ✅   | ✅    | ❌    | ✅      | ❌   |
| OasisMist 1000S    | ✅              | ✅   | ✅    | ❌    | ✅      | ❌   |
| OasisMist 600S     | ✅              | ✅   | ✅    | ❌    | ✅      | ✅   |
| OasisMist 450S     | ✅              | ✅   | ✅    | ❌    | ✅      | ✅   |
| LV600S             | ✅              | ✅   | ✅    | ❌    | ✅      | ✅   |
| NeoClassic 450S    | ✅              | ✅   | ✅    | ✅    | ✅      | ❌   |
| Classic 300S       | ✅              | ✅   | ✅    | ✅    | ✅      | ❌   |
| Classic 200S       | ✅              | ✅   | ❌    | ❌    | ✅      | ❌   |
| Dual 200S          | ✅              | ✅   | ❌    | ✅    | ✅      | ❌   |

### Features (if supported by model)

1. Humidifier / Auto Mode

   - Sets humidifier to Auto / Humidity and sets the Target Humidity to the desired level.
   - Can also change Target Humidity in Sleep Mode, except on LV600S / Oasis.
     - For LV600S and Oasis, the Humidifier slider will be set to 0% when Sleep Mode is on.
   - For LV600S and Oasis, the Auto humidity range is 40-80%. All other models are 30-80%.
     - Selecting values outside the Auto range will set the Target Humidity to the lowest or highest number in the
       range.
   - Setting Target Humidity to 0% turns the device off.
   - When turning the device back on, the last Target Humidity value is restored.

2. Mist Level

   - Sets humidifier to Manual mode unless model supports changing mist levels in Auto / Humidity mode, and sets Mist level.
   - Displayed as a percentage (0-100%) in HomeKit, mapped to the device's native mist levels.
   - When set to 0%, turns the device off.

3. Warm Mist Level

   - Sets Warm Mist Level to the desired level.
   - Displayed as a percentage (0-100%) in HomeKit, mapped to the device's native warm mist levels.

4. Sleep Mode

   - This switches the device between Sleep Mode (On) and Auto Mode (Off).
   - Sleep Mode Target Humidity is controlled by the Target Humidity slider, except on LV600S / Oasis.
   - On LV600S / Oasis, Sleep Mode Target Humidity is set by VeSync at 50–60% and cannot be changed.
   - The LV600S / Oasis turns off Warm Mist by default to keep the humidifier quiet. It can be turned back on with the Warm
     Mist slider.

5. Night Light

   - 4 brightness levels

6. Display Toggle

   - Toggles the display on/off

7. Humidity Sensor

   - Sensor that displays current Humidity %

### Behavior

- **Turning off the humidifier** resets all controls (sleep mode, warm mist, display, night light) to off, matching the physical device behavior.
- **State changes are pushed immediately** to HomeKit — no need to close and reopen the Home app.
- **Service names** (Humidifier, Mist, Display, Sleep Mode, etc.) are set via `ConfiguredName`. If you rename a service in the Home app, your custom name is preserved across restarts.
- **Authentication tokens** are validated proactively before API calls and automatically refreshed when expired, preventing devices from becoming unresponsive due to stale sessions.

### Details

<a href="url"><img src="images/services2.png" width=25% height=25%></a>
<a href="url"><img src="images/auto.png" width=25% height=25%></a>
<a href="url"><img src="images/manual.png" width=25% height=25%></a>
<a href="url"><img src="images/display.png" width=25% height=25%></a>
<a href="url"><img src="images/light.png" width=25% height=25%></a>
<a href="url"><img src="images/sleep.png" width=25% height=25%></a>
<a href="url"><img src="images/services.png" width=25% height=25%></a>

### Configuration

- Make sure 2FA is disabled on your VeSync account.
- Via the Homebridge UI, enter the Homebridge VeSync Client plugin settings.
- Enter your VeSync app credentials.
- Select which controls you want exposed. Humidity / Auto Mode can not be hidden.
- Setup the platform plugin as a child bridge for better performance
- Save and restart Homebridge.

This plugin requires your VeSync credentials as it communicates with the VeSync devices via VeSync's own API. Your
credentials are only stored in the Homebridge config and not sent to any server except VeSync's.

You can also do this directly via the Homebridge config by adding your credentials to the config file under platforms.
Replace the values of `username` and `password` with your credentials.

You can turn off optional controls via the `accessories` section of the config or through the plugin UI settings. The
Humidifier (Auto mode) slider cannot be turned off and will always be exposed.

Via UI:

<img src="images/homebridgeUI.png" width="500"/>

Via config.json:

```json
{
  "platforms": [
    {
      "name": "Levoit Humidifiers",
      "email": "email",
      "password": "password",
      "platform": "LevoitHumidifiers",
      "accessories": {
        "display": false,
        "sleep_mode": false,
        "mist": false,
        "warm_mist": false,
        "night_light": false,
        "auto_pro": false,
        "humidity_sensor": true
      },
      "options": {
        "enableDebugMode": false,
        "showOffWhenDisconnected": false,
        "pollingInterval": 30
      }
    }
  ]
}
```

### Note to Seasonal Humidifier Users:

By default, if you disconnect a humidifier from WiFi, it will begin showing as "Not Responding" in HomeKit. Restarting
Homebridge will remove the cached device from HomeKit. Once you've re-connected the humidifier, restart Homebridge again
for it to display back in HomeKit.

If you prefer the disconnected device to be visible in HomeKit at all times,
set `showOffWhenDisconnected` to `true` in the config. The humidifiers will remain in HomeKit in an Off state.
**Note: This will cause benign errors in the Homebridge logs that the device could not be contacted.**

### Custom Polling Interval

The plugin polls VeSync every 30 seconds by default to keep HomeKit in sync with your device(s). VeSync enforces a daily
API quota, so if you're also polling your devices from another integration (e.g. Hubitat) and exceeding that quota, you
can slow down polling by setting `pollingInterval` (in seconds, minimum 10) in the `options` section of your config.

### Enabling Debug Mode

To enable debug mode, add `enableDebugMode: true` to the `options` section of your config:

```json
{
  "platforms": [
    {
      "name": "Levoit Humidifiers",
      "email": "email",
      "password": "password",
      "platform": "LevoitHumidifiers",
      "options": {
        "enableDebugMode": true
      }
    }
  ]
}
```

### Local Development

To setup the local project, clone this repo and run the following from the root directory:

```
yarn install
```

To run locally, make sure to install Homebridge locally, and then run:

```
yarn watch
```
