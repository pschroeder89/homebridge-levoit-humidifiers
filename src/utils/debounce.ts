import { CharacteristicValue } from 'homebridge';

/**
 * Generic debounce utility for characteristic set handlers.
 * Prevents rapid API calls while users drag sliders in HomeKit.
 *
 * Usage:
 * ```ts
 * debounceSet(uuid, value, async (finalValue) => {
 *   // Apply finalValue after user stops adjusting
 * }, (message) => logger.debug(message)); // Optional logger
 * ```
 */

/**
 * Timer map for tracking active debounce timers.
 * Key: device UUID, Value: NodeJS.Timeout
 */
const timers = new Map<string, NodeJS.Timeout>();

/**
 * Pending values map for tracking values waiting to be applied.
 * Key: device UUID, Value: pending value
 */
const pendingValues = new Map<string, number>();

/**
 * Default debounce delay in milliseconds.
 */
const DEBOUNCE_DELAY_MS = 300;

/**
 * Debounces a set operation for a characteristic.
 * If called multiple times within the debounce window, only the last value is applied.
 *
 * @param uuid - Device UUID to uniquely identify the device
 * @param value - New value to set (will be rounded to integer)
 * @param callback - Function to call with the final value after debounce period
 * @param logger - Optional logger function for error logging (e.g., (msg) => log.debug(msg))
 */
export function debounceSet(
  uuid: string,
  value: number | CharacteristicValue,
  callback: (finalValue: number) => Promise<void> | void,
  logger?: (message: string) => void,
): void {
  // Round because HomeKit may send floats while dragging
  const roundedValue = Math.round(Number(value));
  pendingValues.set(uuid, roundedValue);

  // Clear existing timer if user is still adjusting
  const existing = timers.get(uuid);
  if (existing) {
    clearTimeout(existing);
  }

  // Set new timer to apply value after user stops adjusting
  const timer = setTimeout(async () => {
    timers.delete(uuid);

    const finalValue = pendingValues.get(uuid);
    pendingValues.delete(uuid);

    if (finalValue === undefined) {
      return;
    }

    // Execute the callback with the final value
    try {
      await callback(finalValue);
    } catch (err) {
      // Errors should be handled by the callback, but we catch here to prevent unhandled rejections
      // Log error if logger is provided, otherwise silently catch (callbacks handle their own errors)
      const message = err instanceof Error ? err.message : String(err);
      if (logger) {
        logger(`[DEBOUNCE] Callback failed for ${uuid}: ${message}`);
      }
    }
  }, DEBOUNCE_DELAY_MS);

  timers.set(uuid, timer);
}
