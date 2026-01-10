import { Logger } from 'homebridge';

/**
 * DebugMode utility for conditional debug logging.
 * Only logs messages when debug mode is enabled in the plugin configuration.
 */
export default class DebugMode {
  constructor(
    private readonly _debugMode: boolean,
    private readonly log: Logger,
  ) {}

  /**
   * Logs a debug message if debug mode is enabled.
   * Messages are prefixed with [DEBUG] and logged at info level.
   *
   * @param message - Variable arguments to log (will be joined with spaces)
   */
  public debug(...message: any[]): void {
    if (!this._debugMode) {
      return;
    }

    this.log.info(`[DEBUG]: ${message.join(' ')}`);
  }
}
