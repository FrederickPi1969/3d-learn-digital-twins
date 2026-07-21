# Release Validation

Validation date: 2026-07-21.

The following commands completed successfully in the packaged source tree:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run validate:release
npm run assets:sync -- scripts/asset-manifest.example.json public/models/exhibition/_sync-smoke
```

The temporary asset synchronization output was validated and removed before packaging.

Validated release target for version 4.0.0:

```text
TypeScript strict type check: passed
ESLint: passed with zero errors and zero warnings
Vitest: 8 test files passed, 25 tests passed
Vite production build: passed; 4,255 modules transformed
Exhibition lazy chunk: ExhibitionExperience-DRJ8zMsY.js, 145,940 bytes before gzip
Exhibition data invariant: exactly 48 unique booths, 12 per zone
North-wall layout invariant: the integrated screen sightline is clear of the relocated central wall exhibits
Bundled GLB catalog: 18 files, including 16 reproducibly generated curated models
Animated media catalog: 3 H.264 MP4 loops and 3 JPEG posters
Local EXR environment, artwork, embedded browser pages and Draco decoder: present
Cesium runtime deployment check: passed
Cesium runtime resources under dist/cesium: 389 files
Asset-manifest synchronization smoke test: passed
```

The release checker rejects an accidental `dist/cesium/node_modules` nesting error, verifies package identity and required direct dependencies, checks minimum asset sizes, validates the sixteen-entry curated model manifest, verifies all media files, scans the white-gallery and embedded-wall style markers, and confirms exactly one lazy `ExhibitionExperience` JavaScript chunk.

A production static server was started from `dist`. The following paths returned HTTP 200 with the expected resource type:

```text
/                                                                      text/html
/?experience=exhibition                                                text/html
/embedded/home.html                                                    text/html
/embedded/collection.html                                              text/html
/models/exhibition/curated-demo/data-monolith.glb                      model/gltf-binary
/models/exhibition/curated-demo/porcelain-lotus.glb                    model/gltf-binary
/media/exhibition/aurora-field.mp4                                     video/mp4
/media/exhibition/motion-matrix.jpg                                    image/jpeg
/environments/night-gallery.exr                                        image/aces
/draco/draco_decoder.wasm                                              application/wasm
/cesium/Workers/createGeometry.js                                      text/javascript
/cesium/Widgets/widgets.css                                            text/css
```

A headless Chromium visual regression was attempted with WebGL, SwiftShader and ANGLE enabled. The container could not initialize an EGL/ANGLE display and exited before application rendering, so no container screenshot is presented as a successful visual test. The source, tests, production bundle, release assets and static routes are validated; final lighting, transformed-HTML alignment, video playback and graphics performance should be accepted in a WebGL 2-capable desktop browser on the target graphics hardware.
