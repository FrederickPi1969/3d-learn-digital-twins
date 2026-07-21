import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const MAX_BYTES = 100 * 1024 * 1024
const ALLOWED_PROVIDERS = new Set([
  'local-demo',
  'khronos-sample-assets',
  'poly-haven',
  'smithsonian-open-access',
  'sketchfab',
  'custom-dam',
])

const usage = `Usage:\n  npm run assets:sync -- <manifest.json> [output-directory]\n\nThe manifest must contain a provider and an assets array. Every asset needs:\n  id, title, source, filename, license, credit, tags[]\n\nOnly .glb files are accepted. HTTP(S) and local file sources are supported.`

function fail(message) {
  console.error(`Asset synchronization failed: ${message}`)
  console.error(usage)
  process.exit(1)
}

function sanitizeFilename(filename) {
  const basename = path.basename(filename)
  if (basename !== filename || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.glb$/i.test(filename)) {
    fail(`invalid GLB filename: ${filename}`)
  }
  return filename
}

function validateAsset(asset, index) {
  const label = `assets[${index}]`
  for (const field of ['id', 'title', 'source', 'filename', 'license', 'credit']) {
    if (typeof asset?.[field] !== 'string' || asset[field].trim().length === 0) {
      fail(`${label}.${field} must be a non-empty string`)
    }
  }
  if (!Array.isArray(asset.tags) || asset.tags.some((tag) => typeof tag !== 'string')) {
    fail(`${label}.tags must be a string array`)
  }
  if (asset.sha256 !== undefined && !/^[a-f0-9]{64}$/i.test(asset.sha256)) {
    fail(`${label}.sha256 must be a 64-character hexadecimal digest`)
  }
  sanitizeFilename(asset.filename)
}

async function loadSource(source, manifestDirectory) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      redirect: 'follow',
      headers: { 'user-agent': 'smart-exhibition-asset-sync/4.0.0' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${source}`)
    const declaredLength = Number(response.headers.get('content-length') ?? 0)
    if (declaredLength > MAX_BYTES) throw new Error(`remote file exceeds ${MAX_BYTES} bytes`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.byteLength > MAX_BYTES) throw new Error(`downloaded file exceeds ${MAX_BYTES} bytes`)
    return bytes
  }

  const absolutePath = path.resolve(manifestDirectory, source)
  const bytes = await readFile(absolutePath)
  if (bytes.byteLength > MAX_BYTES) throw new Error(`local file exceeds ${MAX_BYTES} bytes: ${absolutePath}`)
  return bytes
}

const [, , manifestArgument, outputArgument] = process.argv
if (!manifestArgument) fail('manifest path is required')

const manifestPath = path.resolve(process.cwd(), manifestArgument)
const manifestDirectory = path.dirname(manifestPath)
const outputDirectory = path.resolve(
  process.cwd(),
  outputArgument ?? 'public/models/exhibition/imported',
)
const publicDirectory = path.resolve(process.cwd(), 'public')
const outputRelativeToPublic = path.relative(publicDirectory, outputDirectory)
if (outputRelativeToPublic.startsWith('..') || path.isAbsolute(outputRelativeToPublic)) {
  fail('output directory must be located under the project public directory')
}

let manifest
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
} catch (error) {
  fail(`cannot read manifest: ${error instanceof Error ? error.message : String(error)}`)
}

if (!ALLOWED_PROVIDERS.has(manifest.provider)) {
  fail(`unsupported provider: ${String(manifest.provider)}`)
}
if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
  fail('manifest.assets must be a non-empty array')
}

const seenIds = new Set()
const seenFilenames = new Set()
manifest.assets.forEach((asset, index) => {
  validateAsset(asset, index)
  if (seenIds.has(asset.id)) fail(`duplicate asset id: ${asset.id}`)
  if (seenFilenames.has(asset.filename)) fail(`duplicate filename: ${asset.filename}`)
  seenIds.add(asset.id)
  seenFilenames.add(asset.filename)
})

await mkdir(outputDirectory, { recursive: true })
const normalizedAssets = []

for (const asset of manifest.assets) {
  const filename = sanitizeFilename(asset.filename)
  const destination = path.join(outputDirectory, filename)
  const temporary = `${destination}.partial`

  try {
    const bytes = await loadSource(asset.source, manifestDirectory)
    if (bytes.byteLength < 1024) throw new Error('GLB file is unexpectedly small')
    const magic = bytes.subarray(0, 4).toString('ascii')
    if (magic !== 'glTF') throw new Error('file does not contain a binary glTF header')

    const digest = createHash('sha256').update(bytes).digest('hex')
    if (asset.sha256 && digest.toLowerCase() !== asset.sha256.toLowerCase()) {
      throw new Error(`SHA-256 mismatch; expected ${asset.sha256}, received ${digest}`)
    }

    await writeFile(temporary, bytes)
    await rename(temporary, destination)
    normalizedAssets.push({
      id: asset.id,
      title: asset.title,
      url: `/${path.relative(publicDirectory, destination).split(path.sep).join('/')}`,
      provider: manifest.provider,
      source: asset.source,
      filename,
      license: asset.license,
      credit: asset.credit,
      tags: asset.tags,
      sha256: digest,
      bytes: bytes.byteLength,
    })
    console.log(`Imported ${asset.id} -> ${destination} (${bytes.byteLength} bytes)`)
  } catch (error) {
    await rm(temporary, { force: true })
    fail(`${asset.id}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const normalizedManifest = {
  schemaVersion: 1,
  provider: manifest.provider,
  generatedAt: new Date().toISOString(),
  generatedBy: path.basename(fileURLToPath(import.meta.url)),
  assets: normalizedAssets,
}

await writeFile(
  path.join(outputDirectory, 'manifest.json'),
  `${JSON.stringify(normalizedManifest, null, 2)}\n`,
)
console.log(`Wrote normalized manifest with ${normalizedAssets.length} assets.`)
