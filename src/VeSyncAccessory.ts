import { Service } from 'homebridge';

import FilterChangeIndication from './characteristics/FilterChangeIndication';
import LockPhysicalControls from './characteristics/LockPhysicalControls';
import FilterLifeLevel from './characteristics/FilterLifeLevel';
import Platform, { VeSyncPlatformAccessory } from './platform';
import RotationSpeed from './characteristics/RotationSpeed';
import CurrentState from './characteristics/CurrentState';
import PM25Density from './characteristics/PM25Density';
import TargetState from './characteristics/TargetState';
import AirQuality from './characteristics/AirQuality';
import Active from './characteristics/Active';
import VeSyncFan from './api/VeSyncFan';

export type AccessoryThisType = ThisType<{
  airPurifierService: Service;
  platform: Platform;
  device: VeSyncFan;
}>;

export default class VeSyncAccessory {
  private airQualitySensorService: Service;
  private airPurifierService: Service;

  public get UUID() {
    return this.device.uuid.toString();
  }

  private get device() {
    return this.accessory.context.device;
  }

  constructor(
    private readonly platform: Platform,
    private readonly accessory: VeSyncPlatformAccessory
  ) {
    const { manufacturer, model, mac } = this.device;

    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        manufacturer
      )
      .setCharacteristic(this.platform.Characteristic.Model, model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, mac);

    this.airPurifierService =
      this.accessory.getService(this.platform.Service.AirPurifier) ||
      this.accessory.addService(this.platform.Service.AirPurifier);

    this.airQualitySensorService =
      this.accessory.getService(this.platform.Service.AirQualitySensor) ||
      this.accessory.addService(this.platform.Service.AirQualitySensor);

    this.airPurifierService.setPrimaryService(true);
    this.airPurifierService.addLinkedService(this.airQualitySensorService);

    this.airPurifierService
      .getCharacteristic(this.platform.Characteristic.Active)
      .onGet(Active.get.bind(this))
      .onSet(Active.set.bind(this));

    this.airPurifierService
      .getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
      .onGet(CurrentState.get.bind(this));

    this.airPurifierService
      .getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
      .onGet(TargetState.get.bind(this))
      .onSet(TargetState.set.bind(this));

    this.airPurifierService
      .getCharacteristic(this.platform.Characteristic.LockPhysicalControls)
      .onGet(LockPhysicalControls.get.bind(this))
      .onSet(LockPhysicalControls.set.bind(this));

    this.airPurifierService
      .getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .setProps({
        minStep: this.device.deviceType.speedMinStep,
        maxValue: 100
      })
      .onGet(RotationSpeed.get.bind(this))
      .onSet(RotationSpeed.set.bind(this));

    this.airQualitySensorService
      .getCharacteristic(this.platform.Characteristic.AirQuality)
      .onGet(AirQuality.get.bind(this));

    this.airQualitySensorService
      .getCharacteristic(this.platform.Characteristic.PM2_5Density)
      .onGet(PM25Density.get.bind(this));

    this.airPurifierService
      .getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
      .onGet(FilterChangeIndication.get.bind(this));

    this.airPurifierService
      .getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
      .onGet(FilterLifeLevel.get.bind(this));
  }
}
