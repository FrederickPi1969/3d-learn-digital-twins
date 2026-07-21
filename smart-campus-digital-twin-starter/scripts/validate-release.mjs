import { access, readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()

const requiredPaths = [
  'dist/index.html',
  'dist/cesium/Workers/createGeometry.js',
  'dist/cesium/Assets/approximateTerrainHeights.json',
  'dist/cesium/Widgets/widgets.css',
  'dist/cesium/ThirdParty/Workers/zip-web-worker.js',
  'dist/models/exhibition/stanford-bunny.glb',
  'dist/models/exhibition/suzanne.glb',
  'dist/models/exhibition/ASSET_LICENSES.md',
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
  ['dist/environments/night-gallery.exr', 100_000],
  ['dist/artworks/digital-twin-gallery.png', 500_000],
  ['dist/artworks/interactive-kiosk-study.png', 500_000],
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
if (packageJson.version !== '3.0.0') {
  errors.push(`unexpected package version: ${packageJson.version}`)
}
if (packageJson.dependencies?.['@pmndrs/assets']) {
  errors.push('@pmndrs/assets must not be a runtime dependency; demo assets must remain local files')
}
for (const dependency of ['camera-controls', 'react-rnd', 'three', 'react']) {
  if (!packageJson.dependencies?.[dependency]) errors.push(`missing direct dependency: ${dependency}`)
}

const assetEntries = await readdir(path.join(root, 'dist/assets'))
const exhibitionChunks = assetEntries.filter(
  (entry) => /^ExhibitionExperience-.*\.js$/.test(entry) && !entry.endsWith('.map'),
)
if (exhibitionChunks.length !== 1) {
  errors.push(`expected one lazy ExhibitionExperience JavaScript chunk, found ${exhibitionChunks.length}`)
}

const indexHtml = await readFile(path.join(root, 'dist/index.html'), 'utf8')
if (!indexHtml.includes('未来艺术馆智慧展陈平台')) {
  errors.push('dist/index.html does not contain the exhibition release title')
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
    + await countFiles(path.join(root, 'dist/embedded'))
    + await countFiles(path.join(root, 'dist/draco'))
  const exhibitionChunk = exhibitionChunks[0]
  const exhibitionChunkStats = await stat(path.join(root, 'dist/assets', exhibitionChunk))

  console.log('Release validation passed.')
  console.log(`  Cesium runtime files: ${cesiumFileCount}`)
  console.log(`  Exhibition media/runtime files: ${exhibitionAssetCount}`)
  console.log(`  Exhibition lazy chunk: ${exhibitionChunk} (${exhibitionChunkStats.size} bytes)`)
  console.log('  Local GLB, EXR, artwork, embedded pages, Draco decoder, package metadata and runtime roots are valid.')
}
