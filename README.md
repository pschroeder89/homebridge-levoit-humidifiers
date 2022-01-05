# Homebridge Levoit Humidifiers

This is a Homebridge plugin to control Levoit Humidifiers via the VeSync Platform.

| Supported Versions   | Tested                           |
|----------------------| -------------------------------- |
| Classic 300S         | ✅                               |
| Classic 200S         | ✅                               |
| Dual 200S            | ✅                               |
| Dual 200S (EU model) | ✅                               |
| Dual 200S (UK model) | ✅                               |

This plugin was forked from [RaresAil's Levoit Air Purifiers repo](https://github.com/RaresAil/homebridge-levoit-air-purifier) and adds logic for the Levoit humidifers.

### Features

1. Set Mist Level
   - Levels 1-9 on Classic300s and Classic200s
   - Levels 1-2 on Dual200s, Dual200S EU, and Dual200S UK

2. Mode change
   - Auto
   - Manual

<a href="url"><img src="https://github.com/pschroeder89/homebridge-levoit-humidifiers/blob/main/images/auto.png?raw=true" width=25% height=25%></a>
<a href="url"><img src="https://github.com/pschroeder89/homebridge-levoit-humidifiers/blob/main/images/humidity.png?raw=true" width=25% height=25%></a>
<a href="url"><img src="https://github.com/pschroeder89/homebridge-levoit-humidifiers/blob/main/images/off.png?raw=true" width=25% height=25%></a>

The read data is cached for 5 seconds to not trigger the rate limiter for the API.
Each request is delayed by 500ms to not trigger the rate limiter if a huge number of requests are sent.

The timers are not included because you can accomplish similar results by using Home App's Automation or the Shortcuts app

### Configuration

- Via the Homebridge UI, enter the Homebridge VeSync Client plugin settings.
- Enter your VeSync app credentials.
- Setup the platform plugin as a child bridge for better performance
- Save and restart Homebridge.

This plugin requires your VeSync credentials as it communicates with the VeSync devices via VeSync's own API. Your credentials are only stored in the Homebridge config and not sent to any server except VeSync's.

You can also do this directly via the homebridge config by adding your credentials to the config file under platforms. Replace the values of `username` and `password` by your credentials.

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

To setup the local project clone the files and inside the root directory of the project run:

```
yarn install
```

After that to start the local server use

```
yarn watch
```
