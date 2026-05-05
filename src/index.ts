import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import Platform from './platform';

/**
 * Homebridge plugin entry point.
 * Registers the Levoit Humidifiers platform with Homebridge.
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, Platform);
};
