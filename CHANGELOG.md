## [1.22.0-beta.1] - 2026-Jul-12

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

## [1.15.0] - 2025-Sept-08

### Fixed

- #89: Update login implementation for non-US users to use region
