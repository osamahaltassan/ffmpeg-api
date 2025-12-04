# Changelog

All notable changes to this project are documented in this file.

This changelog documents changes since forking from [samisalkosuo/ffmpeg-api](https://github.com/samisalkosuo/ffmpeg-api).

## [1.1.3] - 2025-12-04

### Fixed

- **Critical Busboy v1.x API compatibility fix** - Fixed `[object Object]` filename bug
    - Updated `file` event handler signature from individual parameters to `info` object destructuring
    - Old: `function(fieldname, file, filename, encoding, mimetype)`
    - New: `function(fieldname, file, info)` with `const { filename, encoding, mimeType: mimetype } = info`

### Changed

- **Code modernization - Core utilities and routes**
    - **Variable declarations**: Replaced `var` with `const`/`let` throughout codebase
    - **Async/await migration**: Converted callback-based code to modern async/await patterns
    - **utils.js**: 
        - Promisified `downloadFile()` to return Promise instead of callback
        - Standardized function declarations and removed unnecessary else blocks
    - **probe.js**: 
        - Converted to async/await using util.promisify for ffprobe
        - Replaced callback error handling with try/catch blocks
    - **convert.js**: 
        - Created `convertFile()` helper function that wraps ffmpeg in Promise
        - Converted main `convert()` function to async with try/catch error handling
        - Modernized all route handlers to async arrow functions
        - Replaced `==` with `===` for strict equality checks
        - Fixed spacing and formatting inconsistencies
    - **extract.js**:
        - Created `extractFromVideo()` helper function that wraps ffmpeg extraction in Promise
        - Created `finalizeArchive()` helper function that promisifies archive finalization
        - Completely refactored main `extract()` function to async/await
        - Eliminated nested callback hell with flat async/await flow
        - Modernized route handlers (`/audio`, `/images`, `/download/:filename`) to async arrow functions
        - Replaced traditional for loops with modern `for...of` syntax
        - Used `.map()` for functional array transformations
        - Renamed `extract` variable to `extractType` for clarity
        - Changed all `var` → `const` for imports, router, and immutable variables
        - Single try/catch block for unified error handling
    - **Code quality improvements**:
        - Standardized arrow function syntax in route handlers
        - Improved error handling with try/catch blocks
        - Added missing semicolons for consistency
        - Removed trailing whitespace and unnecessary blank lines
        - Replaced C-style for loops with modern iteration patterns

- **Documentation improvements**
    - Converted README from AsciiDoc to Markdown format
    - Converted CHANGES from AsciiDoc to Markdown format
    - Enhanced documentation with volume mount guidance for `/tmp` storage

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