# Homebridge Levoit Humidifiers

This is a Homebridge plugin to control Levoit Humidifiers with via the VeSync Platform.

| Supported Versions | Tested                           |
| ------------------ | -------------------------------- |
| Classic 300S       | ✅                               |

This plugin was forked from [RaresAil's Levoit Air Purifiers repo](https://github.com/RaresAil/homebridge-levoit-air-purifier) and adds logic for the Levoit Classic 300s humidifer. I assume this will work at least partially with other models.

### Features

1. Set Mist Level
   - Levels 1-9

2. Mode change
   - Auto
   - Manual

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
