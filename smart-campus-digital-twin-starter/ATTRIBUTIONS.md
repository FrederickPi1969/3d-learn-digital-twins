# Third-party software and demo asset notices

This repository combines open-source software and replaceable learning-purpose demo assets. Review every license again before redistributing a commercial derivative.

## Runtime libraries

| Package | Version in this release | License |
|---|---:|---|
| three | 0.185.1 | MIT |
| @react-three/fiber | 9.6.1 | MIT |
| @react-three/drei | 10.7.7 | MIT |
| @react-three/postprocessing | 3.0.4 | MIT |
| postprocessing | 6.39.3 | Zlib |
| camera-controls | 3.1.2 | MIT |
| React and React DOM | 19.2.7 | MIT |
| Zustand | 5.0.14 | MIT |
| Motion | 12.42.2 | MIT |
| react-rnd | 10.5.3 | MIT |
| Lucide React | 1.25.0 | ISC |
| CesiumJS | 1.143.x | Apache-2.0 |

The authoritative license text for installed packages is located in each package under `node_modules` after `npm ci`. The application license does not replace third-party license obligations.

## Exhibition demo assets

`public/models/exhibition/stanford-bunny.glb`, `public/models/exhibition/suzanne.glb`, and `public/environments/night-gallery.exr` were copied from `@pmndrs/assets` version 1.7.0. That package declares the CC0-1.0 license. They are included as small, replaceable examples for model loading, Draco decoding and image-based lighting.

The sixteen GLB files under `public/models/exhibition/curated-demo/` were procedurally generated for this codebase by `scripts/generate-curated-demo-assets.py`. Their normalized metadata and byte sizes are recorded in the adjacent manifest. They are released with the project as CC0-1.0 learning assets.

The PNG files under `public/artworks/` and the MP4/JPEG media under `public/media/exhibition/` were generated specifically for this starter. The media generation source is included in `scripts/generate-exhibition-media.py`. These files are not required by the rendering architecture and may be replaced with user-owned imagery and video.

The Draco decoder files under `public/draco/` originate from the Three.js example decoder distribution. Three.js is licensed under MIT. Retain the applicable notices when redistributing those files.

The asset-provider registry names public catalogs as optional integration channels, but no remote catalog model is bundled merely because the provider is listed. Any synchronized model must retain its own license, author credit and source metadata.

No production museum collection, proprietary Windows assets, Chrome binaries or Microsoft/Google brand logos are bundled. The virtual desktop and browser are brand-neutral interface simulations implemented in React and rendered directly inside a Three.js exhibition-wall screen.
