# Homebridge Levoit Humidifiers

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

This is a Homebridge plugin to control Levoit Humidifiers via the VeSync Platform.

| Supported Versions   | Auto Mode | Cool Mode | Sleep Mode | Night Light | Display Toggle | Humidity Sensor | Warm Mode |
|----------------------|-----------|-----------|------------|-------------|----------------|-----------------|-----------|
| LV600S               | ✅         | ✅         | ✅          | ❌           | ✅              | ✅               | ✅         |
| Classic 300S         | ✅         | ✅         | ✅          | ✅           | ✅              | ✅               | ❌         |
| Classic 200S         | ✅         | ✅         | ❌          | ❌           | ✅              | ✅               | ❌         |
| Dual 200S            | ✅         | ✅         | ❌          | ❌           | ✅              | ✅               | ❌         |

This plugin was forked
from [RaresAil's Levoit Air Purifiers repo](https://github.com/RaresAil/homebridge-levoit-air-purifier) and adds logic
for the Levoit Humidifers.

### Features

1. Humidifier / Auto Mode
    - Sets humidifier to Auto / Humidity and sets the Target Humidity to the desired level.
    - Can also change Target Humidity in Sleep Mode, except on LV600s.
        - For LV600s, the Humidifier slider will be set to 0% when Sleep Mode is on.
    - For LV600s, the Auto humidity range is 40-80%. All other models are 30-80%.
        - Selecting values outside the Auto range will set the Target Humidity to the lowest or highest number in the
          range.

2. Cool Mist Level
    - Sets humidifier to Manual mode (except on LV600s) and sets the Cool Mist Level to the desired level.
        - Note: LV600s supports changing mist levels while in Auto mode.
    - When set to Level 0, turns the device off.
    - Levels 1-9 on Classic300s, Classic200s, and LV600S
    - Levels 1-2 on Dual200s

3. Warm Mist Level
    - Sets Warm Mist Level to the desired level.
    - Levels 0-3 on LV600s only.

4. Sleep Mode
    - This switches the device between Sleep Mode (On) and Auto Mode (Off)
    - Sleep Mode Target Humidity is controlled by the Target Humidity slider, except on LV600s.
    - On LV600s, Sleep Mode Target Humidity is set by VeSync at 50–60% and cannot be changed.
    - The LV600s turns off Warm Mist by default to keep the humidifier quiet. It can be turned back on with the Warm
      Mist slider.

5. Night Light
    - Supported on Classic300s
    - 4 brightness levels

6. Display Toggle
    - Toggles the display on/off

7. Humidity Sensor
    - Sensor that displays current Humidity %

### Details

<a href="url"><img src="images/services2.png" width=25% height=25%></a>
<a href="url"><img src="images/auto.png" width=25% height=25%></a>
<a href="url"><img src="images/manual.png" width=25% height=25%></a>
<a href="url"><img src="images/display.png" width=25% height=25%></a>
<a href="url"><img src="images/light.png" width=25% height=25%></a>
<a href="url"><img src="images/sleep.png" width=25% height=25%></a>
<a href="url"><img src="images/services.png" width=25% height=25%></a>

### Configuration

- Via the Homebridge UI, enter the Homebridge VeSync Client plugin settings.
- Enter your VeSync app credentials.
- Select which controls you want exposed. Humidifier (Auto Mode) and the Humidity Sensor can not be hidden.
- Setup the platform plugin as a child bridge for better performance
- Save and restart Homebridge.

This plugin requires your VeSync credentials as it communicates with the VeSync devices via VeSync's own API. Your
credentials are only stored in the Homebridge config and not sent to any server except VeSync's.

You can also do this directly via the Homebridge config by adding your credentials to the config file under platforms.
Replace the values of `username` and `password` with your credentials.

You can turn off optional controls via the `accessories` section of the config or through the plugin UI settings. The
Humidifier (Auto mode) slider and the Humidity sensor cannot be turned off and will always be exposed.

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
        "cool_mist": false,
        "warm_mist": false,
        "night_light": false
      },
      "options": {
        "showOffWhenDisconnected": false
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
**Note: This will result in benign warnings in the Homebridge logs that the device returned undefined values.**

### Enabling Debug Mode

In the config file, add `enableDebugMode: true`

```json
{
  "platforms": [
    {
      "name": "Levoit Humidifiers",
      "email": "email",
      "password": "password",
      "platform": "LevoitHumidifiers",
      "enableDebugMode": true
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
