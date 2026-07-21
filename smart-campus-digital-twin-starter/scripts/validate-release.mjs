import { access, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const requiredPaths = [
  'dist/index.html',
  'dist/cesium/Workers/createGeometry.js',
  'dist/cesium/Assets/approximateTerrainHeights.json',
  'dist/cesium/Widgets/widgets.css',
  'dist/cesium/ThirdParty/Workers/zip-web-worker.js',
]

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

const missing = []
for (const relativePath of requiredPaths) {
  if (!(await exists(relativePath))) missing.push(relativePath)
}

if (await exists('dist/cesium/node_modules')) {
  missing.push('unexpected nested path: dist/cesium/node_modules')
}

if (missing.length > 0) {
  console.error('Release validation failed:')
  for (const item of missing) console.error(`  - ${item}`)
  process.exitCode = 1
} else {
  const cesiumRoot = path.join(root, 'dist/cesium')
  const cesiumFileCount = await countFiles(cesiumRoot)
  const distStats = await stat(path.join(root, 'dist'))
  if (!distStats.isDirectory()) {
    console.error('Release validation failed: dist is not a directory')
    process.exitCode = 1
  } else {
    console.log(`Release validation passed: ${cesiumFileCount} Cesium runtime files are correctly rooted at /cesium/.`)
  }
}
