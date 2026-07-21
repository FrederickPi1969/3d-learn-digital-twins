# Release Validation

Validation date: 2026-07-21.

The following commands completed successfully in the packaged source tree:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run validate:release
```

Validated results for version 3.0.0:

```text
TypeScript strict type check: passed
ESLint: passed with zero errors and zero warnings
Vitest: 7 test files passed, 21 tests passed
Vite production build: passed; 4,253 modules transformed
Exhibition lazy chunk: present; approximately 133 KB before gzip
Exhibition data invariant: exactly 48 unique booths, 12 per zone
Local GLB models and Draco decoder: present
Local EXR environment and concept artwork: present
Embedded exhibition portal pages: present
Cesium runtime deployment check: passed
Cesium runtime resources under dist/cesium: 389 files
```

The release checker rejects an accidental `dist/cesium/node_modules` nesting error, verifies package identity and required direct dependencies, checks minimum asset sizes, and scans `dist/assets` for exactly one lazy `ExhibitionExperience` JavaScript chunk.

A production preview server was started from `dist` and the following paths returned HTTP 200 with the expected resource type:

```text
/
/?experience=exhibition
/embedded/home.html
/embedded/collection.html
/models/exhibition/stanford-bunny.glb
/artworks/digital-twin-gallery.png
/environments/night-gallery.exr
/draco/draco_decoder.wasm
/cesium/Workers/createGeometry.js
/cesium/Widgets/widgets.css
```

A headless WebGL screenshot was attempted inside the build container, but the container Chromium process could not initialize an EGL/ANGLE graphics context. The failure occurred before application rendering and is a limitation of the container graphics runtime. Source validation, unit tests, production bundling, production asset validation and static resource checks are not dependent on that unavailable context. Final visual acceptance should be performed in a WebGL 2-capable desktop browser on the target graphics hardware.
