# Digital Asset Channels

Version 4 separates exhibit placement from model provenance. The default exhibition works offline with the bundled GLB collection, while the asset registry in `src/data/exhibitionAssets.ts` describes six ingestion channels: bundled project assets, Khronos glTF sample assets, Poly Haven, Smithsonian Open Access, downloadable Sketchfab records, and a private Digital Asset Management repository.

The browser application must never contain provider credentials. Remote catalog discovery, license filtering, signed URL generation, file conversion, virus scanning and metadata normalization belong in a backend adapter or a build-time synchronization job. The Three.js runtime receives only local public URLs and normalized metadata.

A generic synchronization command is included:

```bash
npm run assets:sync -- scripts/asset-manifest.example.json
```

The command accepts HTTP(S) or local sources, limits each file to 100 megabytes, accepts GLB only, validates the binary glTF header, optionally verifies SHA-256, uses atomic writes, and emits a normalized manifest beside the imported files. The example copies a bundled model into `public/models/exhibition/imported` to demonstrate the workflow without requiring internet access.

A production provider adapter should emit the same normalized fields:

```text
id
  Stable business identifier.

title
  Human-readable exhibit or asset title.

url
  Local, same-origin GLB URL consumed by React Three Fiber.

provider
  Registry identifier used for policy and attribution.

license / credit / source
  Provenance stored with the release and surfaced in the exhibit record.

sha256 / bytes
  Integrity and release auditing fields.
```

After synchronization, register the imported record in `src/data/exhibitionAssets.ts`, then assign its identifier in `importedAssetByBooth` inside `src/data/exhibition.ts`. The loader automatically normalizes the model bounding box, grounds the model, applies target height, retains or remaps materials, and plays bundled animation clips.

Recommended preprocessing remains GLB plus mesh simplification, KTX2 textures, Draco or Meshopt compression, consistent meter scale, centered pivots, and Level of Detail for heavy models. Do not commit models whose redistribution terms are unclear.
