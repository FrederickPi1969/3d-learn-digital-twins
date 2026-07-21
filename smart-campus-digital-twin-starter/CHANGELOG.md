# Change Log

## 4.0.0 — White Future Gallery, Embedded Wall OS and Motion Media

Reworked the exhibition environment into a high-key futuristic white gallery. The physical redesign coordinates resin-like floor reflections, white physical wall materials, skylights, black track fixtures, warm-white exhibit lighting, light cyan guidance lines, brighter fog, higher exposure and a reduced vignette. The surrounding Heads-Up Display now uses a white-glass presentation so interface chrome does not darken the room.

Replaced the detached visitor terminal with one architectural wall assembly. The complete React desktop, draggable windows, browser and domain applications run directly on the Three.js wall surface through Drei `Html transform`. Closing the visitor session restores the live floor-map dashboard on the same 1366 × 768 screen. Camera preset 3 and the `O` shortcut focus this in-world terminal; no separate full-window operating-system overlay is mounted.

Added four controllable world-space media displays: two side-wall screens, an entrance media ribbon and the reverse face of the central wall. The implementation uses local H.264 media, managed `THREE.VideoTexture` instances, poster fallback, muted-autoplay recovery, page-visibility pause/resume, explicit disposal and brightness-linked light spill. Media can be disabled from the exhibition dock and configured from the embedded Settings application.

Expanded the bundled catalog to eighteen local GLB files: sixteen reproducibly generated project-owned demonstration assets plus two small CC0 learning samples. Added a six-provider asset registry and a build-time manifest synchronizer supporting local and HTTP(S) sources, a 100-megabyte file limit, binary glTF header checks, optional SHA-256 verification, atomic writes and normalized provenance metadata.

Expanded automated coverage for media controls and the asset registry. Release validation now checks the white-gallery style markers, embedded wall operating system, all eighteen GLB models, all video and poster files, Cesium runtime roots, browser pages, Draco decoder, environment map and asynchronous exhibition bundle.

## 3.0.0 — Future Exhibition Hall and Visitor Operating System

This release adds an independently loadable futuristic exhibition experience to the existing smart-campus, environment, night-rendering and Cesium GIS suite.

### Exhibition hall

Added a modern minimalist 50-by-36-meter art hall with 48 interactive booths across four curatorial zones. The hall includes reflective flooring, curved architectural elements, ceiling ribs, edge lighting, physical materials, image-based lighting, contact shadows, atmospheric fog and configurable postprocessing.

Added five exhibit render paths: framed digital works, procedural sculptures, heritage vitrines, holographic installations and imported GLB models. Exhibit metadata drives the Three.js scene, floor plan, detail panel, digital collection and camera navigation from one source of truth.

Added animated ambient visitors, exhibit labels, zone filtering, a mini map, a full-screen navigation map, camera presets and smooth exhibit focus.

### Digital screens

Added an in-world wall-sized navigation display that embeds a live React floor-plan interface into the Three.js scene. The map exposes all 48 booths and synchronizes selection with the 3D scene.

Added an in-world visitor kiosk. Selecting the kiosk opens a full-screen virtual visitor desktop.

### Virtual operating system

Added a Windows-inspired but brand-neutral desktop shell with boot sequence, wallpaper, desktop shortcuts, start menu, taskbar, system tray, notifications and session reset.

Added draggable, resizable, minimizable and maximizable windows powered by `react-rnd`. Added six applications: browser, floor plan, digital collection, facility operations, public program and settings.

The browser supports local pages and external iframe URLs, with navigation history, reload, quick links and external-open fallback. Added three local embedded pages so the browser remains functional without internet access.

### Integration and release engineering

Added `experienceMode` to the shared Zustand store and a lazy exhibition route within the existing application shell. Added the “未来展厅” bottom-navigation entry, `H` mode toggle and direct query entry through `?experience=exhibition`.

Added exhibition data and state tests. Expanded release validation to verify the lazy exhibition chunk, GLB models, Draco runtime, environment map, concept artworks and embedded portal in addition to the existing Cesium runtime resources.

## 2.0.0 — Environment, Night Rendering and GIS Extension

Added rain, snow, sandstorm, cloud and lightning systems; instanced vegetation with shader wind; animated vehicles and pedestrians; day, dusk and night rendering; and a CesiumJS mode with WGS84, East-North-Up local coordinates, GeoJSON and optional 3D Tiles.

## 1.0.0 — Smart Campus Starter

Initial smart-campus Three.js scene, interactive buildings, building interior view, operational boards, TypeScript build, tests, Docker and Nginx deployment.
