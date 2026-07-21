# Release Validation

Release validation date: 2026-07-21.

The following commands completed successfully in the packaged source tree:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run validate:release
```

Results:

```text
TypeScript strict type check: passed
ESLint: passed with zero errors and zero warnings
Vitest: 5 test files passed, 14 tests passed
Vite production build: passed
Cesium runtime deployment check: passed
Cesium runtime resources copied into dist/cesium: 389 files
```

The release checker verifies that Cesium Workers, Assets, ThirdParty resources and Widgets are rooted directly under `/cesium/`, rather than under an accidental nested `node_modules` path.

A final WebGL visual regression screenshot was not generated inside the build container because its headless Chromium runtime could not initialize an EGL/ANGLE graphics context. The application still passed source, test, and production-build validation. Run the project in a WebGL 2-capable desktop browser for final visual acceptance on the target graphics hardware.
