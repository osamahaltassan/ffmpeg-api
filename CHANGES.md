# Changelog

All notable changes to this project are documented in this file.

This changelog documents changes since forking from [samisalkosuo/ffmpeg-api](https://github.com/samisalkosuo/ffmpeg-api).

## [1.2.1] - 2025-12-05

### Fixed

- **Critical: Busboy v1.x API compatibility** - Fixed `[object Object]` filename bug
    - Updated file event handler: `(fieldname, file, filename, encoding, mimetype)` → `(fieldname, file, info)` with destructuring `const { filename, encoding, mimeType: mimetype } = info`
- **Critical: Global variable leak in app.js**
    - `fileSizeLimit` and `timeout` were undeclared globals (missing `const`/`let`/`var`)
    - Removed redundant `fileSizeLimit` (already exists in constants.js)
    - Properly scoped `timeout` with `const`
    - Updated uploadfile.js to import `constants.fileSizeLimit`

### Changed

- **Complete async/await modernization** - Eliminated all callback-based patterns:

| File | Key Changes |
|------|-------------|
| **utils.js** | Promisified `downloadFile()`, removed unnecessary `else` blocks, `var` → `const` |
| **probe.js** | Created `ffprobeAsync` with `util.promisify`, async route handlers, try/catch error handling |
| **convert.js** | Created `convertFile()` Promise wrapper, async `convert()` function, `==` → `===`, unified try/catch |
| **extract.js** | Created `extractFromVideo()` and `finalizeArchive()` helpers, eliminated callback hell, `for` → `for...of`, renamed `extract` → `extractType` |
| **uploadfile.js** | Arrow functions throughout, `var router` → `const router`, `var savedFile` → `let savedFile`, `==` → `===`, imports constants module |
| **app.js** | Arrow functions, `var` → `const` for imports, template literals, removed dead code, fixed spacing |

- **Code quality improvements across all files:**
    - Variable declarations: `var` → `const`/`let` (100+ occurrences)
    - Functions: Traditional `function()` → arrow functions `() =>`
    - Equality: `==` → `===` for strict checks
    - Strings: Concatenation → template literals
    - Error handling: Callbacks → try/catch blocks
    - Iteration: C-style `for` loops → `for...of` and `.map()`
    - Formatting: Added semicolons, fixed spacing, removed trailing whitespace

- **Documentation improvements:**
    - Converted README and CHANGES from AsciiDoc to Markdown
    - Added volume mount guidance for `/tmp` storage

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