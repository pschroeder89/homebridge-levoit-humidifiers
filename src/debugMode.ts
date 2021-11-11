import { Logger } from 'homebridge';

export default class DebugMode {
  constructor(
    private readonly _debugMode: boolean,
    private readonly log: Logger
  ) {}

  public debug(...message: any[]): void {
    if (!this._debugMode) {
      return;
    }

    this.log.info(`[DEBUG]: ${message.join(' ')}`);
  }
}
