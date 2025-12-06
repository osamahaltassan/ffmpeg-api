# Changelog

All notable changes to this project are documented in this file.

This changelog documents changes since forking from [samisalkosuo/ffmpeg-api](https://github.com/samisalkosuo/ffmpeg-api).

## [1.2.2] - 2025-12-05

### Added

- **Request ID middleware** - Generates unique ID per request for log correlation and debugging, returned in `X-Request-Id` header
- **ESLint flat config** - Added `eslint.config.js` with Node.js/CommonJS configuration
- **Lint scripts in package.json** - Added `npm run lint` and `npm run lint:fix` commands

### Changed

- **Updated `archiver`** from 4.0.2 → 7.0.1
- **Modernized ESLint setup** - Replaced deprecated `eslint-config-google` with `@eslint/js` recommended rules
- **Dockerfile improvements** - Added health check for container orchestration, pinned Node.js to version 20.x for reproducibility
- **Enhanced logging across all files** - Added request ID prefix to all log messages for full request traceability (uploadfile.js, convert.js, extract.js, probe.js, utils.js)
- **Updated `utils.deleteFile()` signature** - Added optional `requestId` parameter for log correlation

### Fixed

- **Path traversal vulnerability in extract.js** - Added validation to reject filenames containing `/`, `..`, or null bytes
- **Missing busboy error handler in uploadfile.js** - Added handler for malformed multipart data and invalid headers
- **Inconsistent error handling in convert.js and extract.js** - Replaced manual `res.writeHead`/`res.end` with `next(err)` to use Express error handler

### Removed

- **Unused `util` import in convert.js**
- **Unused `glob` dependency** - Was not used anywhere in codebase
- **Unused `label` import in logger.js** - Removed from winston format destructuring
- **Redundant `log` object in uploadfile.js** - Replaced with direct logging

## [1.1.2] - 2025-11-25

### Fixed

- Partial Busboy v1.x migration in `uploadfile.js`
    - Changed `const Busboy = require('busboy')` to `const busboy = require('busboy')`
    - Changed `new Busboy({...})` to `busboy({...})` (function call instead of constructor)
    - Renamed local variable from `busboy` to `bb` to avoid shadowing

## [1.1.1] - 2025-11-23

### Changed

- Updated Dockerfile configuration
- Updated `package.json` dependencies
- Restructured `app.js`
- Updated documentation in README.adoc

### Added

- Committed `node_modules` for reproducible builds

## [1.1.0] - 2025-11-23

### Changed

- Initial fork from [samisalkosuo/ffmpeg-api](https://github.com/samisalkosuo/ffmpeg-api) 0.3
- Base Dockerfile updates