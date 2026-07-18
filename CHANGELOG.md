## [1.23.0] - 2026-Jul-17

### Fixed

- AutoPro-off on Superior 6000S was returning to Manual mode instead of Humidity (Smart) mode, inconsistent with how Sleep-off already worked.

### Added

- Sprout Humidifier (`LEH-B381S-*`) device support: power, mode (AutoPro/Sleep/Manual), mist level, target humidity, and display.
- Child lock support for Superior 6000S and Sprout Humidifier, exposed via the Humidifier tile's Lock Physical Controls setting in the Home app.

## [1.22.0] - 2026-Jul-12

### Fixed

- #104: Warm mist wasn't syncing on new-format devices (e.g. LUH-A603S) - both the command payload shape and the background-polling read path were wrong for these devices.
- #102: Target humidity flashed 0% on power-on instead of showing the last known value.
- LV600S mode-string bug: only the newer LUH-A603S uses `"humidity"` as its Auto-equivalent mode; the older LUH-A602S uses plain `"auto"`. Both were incorrectly sent `"humidity"`.
- `yarn lint` was silently skipping most of `src/` (everything under `api/`, `characteristics/`, `utils/`) due to a non-recursive glob.
- CodeQL push/PR scanning was silently disabled - the workflow targeted the nonexistent `master` branch instead of `main`.

### Added

- #106: `options.pollingInterval` config to reduce VeSync polling frequency.
- #99: Superior 6000S's target humidity slider can now reach Humidity (Smart) mode instead of always forcing AutoPro.
- `LEH-S602S-WUS` device support (Superior 6000S variant).
- NeoClassic 450S added to the supported-devices table in the README.

### Changed

- Upgraded `axios` from `0.24.0` to `1.18.1`.
- Enabled `noImplicitAny` and bumped the TypeScript build target to ES2022 (matching the `node >=20.19.0` engine requirement).

## [1.21.0] - 2026-Jul-11

### Added

- NeoClassic 450S (`LUH-N451S-*`) device support: auto mode, 9 mist levels, night light, sleep mode, 30-80% target humidity.

## [1.20.0] - 2026-May-05

Consolidates an extended development cycle (published betas from 1.18.0 through 1.20.0-beta.21 aren't individually
reconstructable from git history).

### Fixed

- Token expiration errors ("the user is not logged in") that made devices unresponsive or caused them to be silently
  removed from HomeKit - tokens are now proactively validated and refreshed before every API call, with automatic
  retry on 401 responses.
- Mist and warm mist sliders showing invalid `validValues` warnings in HomeKit.

### Added

- Auth sessions are cached to disk and restored on restart, reducing unnecessary logins.
- Graceful handling when VeSync's daily API quota is exceeded, instead of failing outright.

### Changed

- All characteristic changes now push to HomeKit immediately instead of waiting for the next poll.
- Turning off the humidifier now resets sleep mode, warm mist, display, night light, and mist level, matching
  physical device behavior.
- Rapid HomeKit slider changes are now debounced (300ms) instead of flooding the VeSync API with requests.
- Sub-services now display proper names ("Humidifier", "Mist", "Sleep Mode", etc.) instead of generic "Fan"/"Switch",
  and user-customized names persist across restarts.
- Substantial internal refactor: split `VeSyncAccessory`'s constructor into focused per-service setup methods, split
  `LV600S` device matching into old/new-format prefixes, extracted shared auth and device-matching helpers.

## [1.17.2] - 2026-Jan-10

### Fixed

- #96: LV600S mode-switching logic now matches by device prefix instead of a hardcoded model string.

## [1.17.1] - 2026-Jan-06

### Added

- Homebridge v2.0 support.

## [1.16.0] - 2025-Dec-29

### Fixed

- #89: User login failures ("the user is not logged in") affecting some accounts.

## [1.15.0] - 2025-Sept-08

### Fixed

- #89: Update login implementation for non-US users to use region
