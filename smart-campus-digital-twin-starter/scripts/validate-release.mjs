import { access, readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()

const curatedModels = [
  'abstract-mask.glb',
  'amphora-vessel.glb',
  'crystal-cluster.glb',
  'data-monolith.glb',
  'faceted-bust.glb',
  'folded-ribbon.glb',
  'guardian-figure.glb',
  'mechanical-flower.glb',
  'nebula-lens.glb',
  'orbital-rings.glb',
  'porcelain-lotus.glb',
  'resonance-arch.glb',
  'robot-totem.glb',
  'solar-orrery.glb',
  'spiral-column.glb',
  'wave-surface.glb',
]

const mediaFiles = [
  'aurora-field.jpg',
  'aurora-field.mp4',
  'chromatic-flux.jpg',
  'chromatic-flux.mp4',
  'motion-matrix.jpg',
  'motion-matrix.mp4',
]

const requiredPaths = [
  'dist/index.html',
  'dist/cesium/Workers/createGeometry.js',
  'dist/cesium/Assets/approximateTerrainHeights.json',
  'dist/cesium/Widgets/widgets.css',
  'dist/cesium/ThirdParty/Workers/zip-web-worker.js',
  'dist/models/exhibition/stanford-bunny.glb',
  'dist/models/exhibition/suzanne.glb',
  'dist/models/exhibition/ASSET_LICENSES.md',
  'dist/models/exhibition/curated-demo/manifest.json',
  ...curatedModels.map((filename) => `dist/models/exhibition/curated-demo/${filename}`),
  ...mediaFiles.map((filename) => `dist/media/exhibition/${filename}`),
  'dist/environments/night-gallery.exr',
  'dist/artworks/digital-twin-gallery.png',
  'dist/artworks/interactive-kiosk-study.png',
  'dist/embedded/home.html',
  'dist/embedded/collection.html',
  'dist/embedded/guide.html',
  'dist/embedded/portal.css',
  'dist/embedded/portal.js',
  'dist/draco/draco_decoder.js',
  'dist/draco/draco_decoder.wasm',
]

const minimumSizes = new Map([
  ['dist/models/exhibition/stanford-bunny.glb', 12_000],
  ['dist/models/exhibition/suzanne.glb', 20_000],
  ['dist/models/exhibition/curated-demo/faceted-bust.glb', 30_000],
  ['dist/models/exhibition/curated-demo/amphora-vessel.glb', 60_000],
  ['dist/models/exhibition/curated-demo/orbital-rings.glb', 50_000],
  ['dist/models/exhibition/curated-demo/mechanical-flower.glb', 40_000],
  ['dist/models/exhibition/curated-demo/nebula-lens.glb', 80_000],
  ['dist/environments/night-gallery.exr', 100_000],
  ['dist/artworks/digital-twin-gallery.png', 500_000],
  ['dist/artworks/interactive-kiosk-study.png', 500_000],
  ['dist/media/exhibition/aurora-field.mp4', 1_000_000],
  ['dist/media/exhibition/chromatic-flux.mp4', 700_000],
  ['dist/media/exhibition/motion-matrix.mp4', 1_500_000],
  ['dist/draco/draco_decoder.wasm', 100_000],
])

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath))
    return true
  } catch {
    return false
  }
}

async function countFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  let count = 0
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    count += entry.isDirectory() ? await countFiles(absolutePath) : 1
  }
  return count
}

const errors = []
for (const relativePath of requiredPaths) {
  if (!(await exists(relativePath))) errors.push(`missing required release file: ${relativePath}`)
}

for (const [relativePath, minimumSize] of minimumSizes) {
  if (!(await exists(relativePath))) continue
  const fileStats = await stat(path.join(root, relativePath))
  if (fileStats.size < minimumSize) {
    errors.push(`${relativePath} is unexpectedly small: ${fileStats.size} bytes`)
  }
}

if (await exists('dist/cesium/node_modules')) {
  errors.push('unexpected nested path: dist/cesium/node_modules')
}

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
if (packageJson.name !== 'smart-campus-digital-twin-exhibition-suite') {
  errors.push(`unexpected package name: ${packageJson.name}`)
}
if (packageJson.version !== '4.0.0') {
  errors.push(`unexpected package version: ${packageJson.version}`)
}
if (packageJson.dependencies?.['@pmndrs/assets']) {
  errors.push('@pmndrs/assets must not be a runtime dependency; demo assets must remain local files')
}
for (const dependency of ['camera-controls', 'react-rnd', 'three', 'react']) {
  if (!packageJson.dependencies?.[dependency]) errors.push(`missing direct dependency: ${dependency}`)
}
const expectedAssetScripts = {
  'assets:sync': 'node scripts/sync-exhibition-asset-manifest.mjs',
  'assets:generate': 'python3 scripts/generate-curated-demo-assets.py',
  'media:generate': 'python3 scripts/generate-exhibition-media.py',
}
for (const [scriptName, scriptCommand] of Object.entries(expectedAssetScripts)) {
  if (packageJson.scripts?.[scriptName] !== scriptCommand) {
    errors.push(`missing or unexpected ${scriptName} script`)
  }
}

const assetEntries = await readdir(path.join(root, 'dist/assets'))
const exhibitionChunks = assetEntries.filter(
  (entry) => /^ExhibitionExperience-.*\.js$/.test(entry) && !entry.endsWith('.map'),
)
if (exhibitionChunks.length !== 1) {
  errors.push(`expected one lazy ExhibitionExperience JavaScript chunk, found ${exhibitionChunks.length}`)
}

const cssEntries = assetEntries.filter((entry) => entry.endsWith('.css'))
const cssText = (await Promise.all(
  cssEntries.map((entry) => readFile(path.join(root, 'dist/assets', entry), 'utf8')),
)).join('\n')
for (const marker of [
  '.exhibition-experience--white-gallery',
  '.embedded-wall-screen-surface',
  '.virtual-os--embedded',
  '.settings-app__range',
]) {
  if (!cssText.includes(marker)) errors.push(`production CSS is missing ${marker}`)
}

const indexHtml = await readFile(path.join(root, 'dist/index.html'), 'utf8')
if (!indexHtml.includes('未来艺术馆智慧展陈平台')) {
  errors.push('dist/index.html does not contain the exhibition release title')
}

const curatedManifest = JSON.parse(
  await readFile(path.join(root, 'dist/models/exhibition/curated-demo/manifest.json'), 'utf8'),
)
if (!Array.isArray(curatedManifest) || curatedManifest.length !== curatedModels.length) {
  errors.push(`expected ${curatedModels.length} curated manifest entries, found ${curatedManifest?.length ?? 'invalid'}`)
}

if (errors.length > 0) {
  console.error('Release validation failed:')
  for (const item of errors) console.error(`  - ${item}`)
  process.exitCode = 1
} else {
  const cesiumFileCount = await countFiles(path.join(root, 'dist/cesium'))
  const exhibitionAssetCount = await countFiles(path.join(root, 'dist/models/exhibition'))
    + await countFiles(path.join(root, 'dist/environments'))
    + await countFiles(path.join(root, 'dist/artworks'))
    + await countFiles(path.join(root, 'dist/media'))
    + await countFiles(path.join(root, 'dist/embedded'))
    + await countFiles(path.join(root, 'dist/draco'))
  const exhibitionChunk = exhibitionChunks[0]
  const exhibitionChunkStats = await stat(path.join(root, 'dist/assets', exhibitionChunk))

  console.log('Release validation passed.')
  console.log(`  Cesium runtime files: ${cesiumFileCount}`)
  console.log(`  Exhibition media/runtime files: ${exhibitionAssetCount}`)
  console.log(`  Curated local GLB models: ${curatedModels.length + 2}`)
  console.log(`  Animated screen media files: ${mediaFiles.length}`)
  console.log(`  Exhibition lazy chunk: ${exhibitionChunk} (${exhibitionChunkStats.size} bytes)`)
  console.log('  White-gallery CSS, embedded wall OS, media controls, local assets and runtime roots are valid.')
}
