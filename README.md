# Homebridge Levoit Humidifiers
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

This is a Homebridge plugin to control Levoit Humidifiers via the VeSync Platform.

| Supported Versions   | Auto Mode | Cool Mode | Sleep Mode | Night Light | Display Toggle | Humidity Sensor | Warm Mode   |
|----------------------|-----------|-----------|------------|-------------|----------------|-----------------|-------------|
| Classic 300S         | ✅         | ✅         | ✅          | ✅           | ✅              | ✅               | ❌           |
| Classic 200S         | ✅         | ✅         | ❌          | ❌           | ✅              | ✅               | ❌           |
| Dual 200S            | ✅         | ✅         | ❌          | ❌           | ✅              | ✅               | ❌           |
| Dual 200S (EU model) | ✅         | ✅         | ❌          | ❌           | ✅              | ✅               | ❌           |
| Dual 200S (UK model) | ✅         | ✅         | ❌          | ❌           | ✅              | ✅               | ❌           |
| LV600S               | ✅         | ✅         | ✅          | ✅           | ✅              | ✅               | Coming Soon |

This plugin was forked
from [RaresAil's Levoit Air Purifiers repo](https://github.com/RaresAil/homebridge-levoit-air-purifier) and adds logic
for the Levoit Humidifers.

### Features

1. Target Humidity
    - Sets humidifier to Auto and sets the Target Humidity to the desired level.
    - Can also change Target Humidity in Sleep Mode.

2. Mist Level
    - Sets humidifier to Manual and sets the Mist Level to the desired level.
    - When set to Level 0, turns the device off.
    - Levels 1-9 on Classic300s, Classic200s, and LV600S
    - Levels 1-2 on Dual200s, Dual200S EU, and Dual200S UK

3. Sleep Mode
    - This switches the device between Sleep Mode (On) and Auto Mode (Off)
    - Sleep Mode Target Humidity is controlled by the Target Humidity slider, too.

4. Night Light
    - Supported on LV600S and Classic300s
    - 4 brightness levels

5. Display Toggle
    - Toggles the display on/off

6. Humidity Sensor
    - Sensor that displays current Humidity %

### TODOs

* Add LV600S Warm Mode

### Details

<a href="url"><img src="https://github.com/pschroeder89/homebridge-levoit-humidifiers/blob/main/images/services2.png?raw=true" width=25% height=25%></a>
<a href="url"><img src="https://github.com/pschroeder89/homebridge-levoit-humidifiers/blob/main/images/auto.png?raw=true" width=25% height=25%></a>
<a href="url"><img src="https://github.com/pschroeder89/homebridge-levoit-humidifiers/blob/main/images/manual.png?raw=true" width=25% height=25%></a>
<a href="url"><img src="https://github.com/pschroeder89/homebridge-levoit-humidifiers/blob/main/images/display.png?raw=true" width=25% height=25%></a>
<a href="url"><img src="https://github.com/pschroeder89/homebridge-levoit-humidifiers/blob/main/images/light.png?raw=true" width=25% height=25%></a>
<a href="url"><img src="https://github.com/pschroeder89/homebridge-levoit-humidifiers/blob/main/images/sleep.png?raw=true" width=25% height=25%></a>
<a href="url"><img src="https://github.com/pschroeder89/homebridge-levoit-humidifiers/blob/main/images/services.png?raw=true" width=25% height=25%></a>

### Configuration

- Via the Homebridge UI, enter the Homebridge VeSync Client plugin settings.
- Enter your VeSync app credentials.
- Setup the platform plugin as a child bridge for better performance
- Save and restart Homebridge.

This plugin requires your VeSync credentials as it communicates with the VeSync devices via VeSync's own API. Your
credentials are only stored in the Homebridge config and not sent to any server except VeSync's.

You can also do this directly via the homebridge config by adding your credentials to the config file under platforms.
Replace the values of `username` and `password` by your credentials.

```json
{
  "platforms": [
    {
      "name": "Levoit Humidifiers",
      "email": "email",
      "password": "password",
      "platform": "LevoitHumidifiers"
    }
  ]
}
```

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
