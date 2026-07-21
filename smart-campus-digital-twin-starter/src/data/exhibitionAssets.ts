import type { ExhibitionAssetProviderId, ExhibitionAssetRecord } from '@/types/exhibition'

const local = (
  id: string,
  title: string,
  filename: string,
  tags: readonly string[],
  preserveMaterials = true,
): ExhibitionAssetRecord => ({
  id,
  title,
  url: `/models/exhibition/curated-demo/${filename}`,
  provider: 'local-demo',
  sourceLabel: 'Smart Exhibition procedural demo collection',
  license: 'CC0-1.0',
  credit: 'Generated for this starter codebase',
  tags,
  preserveMaterials,
})

export const includedExhibitionAssets: readonly ExhibitionAssetRecord[] = [
  {
    id: 'stanford-bunny',
    title: 'Stanford Bunny Study',
    url: '/models/exhibition/stanford-bunny.glb',
    provider: 'local-demo',
    sourceLabel: 'Bundled learning model',
    license: 'CC0 / educational sample; see ASSET_LICENSES.md',
    credit: 'Bundled with the starter release',
    tags: ['scan', 'sculpture', 'benchmark'],
    preserveMaterials: false,
  },
  {
    id: 'suzanne',
    title: 'Suzanne Material Study',
    url: '/models/exhibition/suzanne.glb',
    provider: 'local-demo',
    sourceLabel: 'Bundled learning model',
    license: 'CC0 / Blender sample; see ASSET_LICENSES.md',
    credit: 'Bundled with the starter release',
    tags: ['sculpture', 'benchmark', 'material'],
    preserveMaterials: false,
  },
  local('faceted-bust', 'Faceted Memory Bust', 'faceted-bust.glb', ['sculpture', 'portrait', 'marble']),
  local('amphora-vessel', 'Algorithmic Amphora', 'amphora-vessel.glb', ['heritage', 'ceramic', 'vessel']),
  local('orbital-rings', 'Orbital Ring Study', 'orbital-rings.glb', ['kinetic', 'metal', 'abstract']),
  local('crystal-cluster', 'Synthetic Crystal Archive', 'crystal-cluster.glb', ['mineral', 'futuristic', 'cluster']),
  local('robot-totem', 'Service Totem Prototype', 'robot-totem.glb', ['industrial-design', 'robot', 'prototype']),
  local('wave-surface', 'Topological Wave', 'wave-surface.glb', ['generative', 'surface', 'data-art']),
  local('spiral-column', 'Helical Signal Column', 'spiral-column.glb', ['kinetic', 'spiral', 'lightweight']),
  local('abstract-mask', 'Future Ritual Mask', 'abstract-mask.glb', ['heritage', 'mask', 'abstract']),
  local('data-monolith', 'Data Monolith', 'data-monolith.glb', ['data-art', 'monolith', 'light']),
  local('mechanical-flower', 'Mechanical Flower', 'mechanical-flower.glb', ['kinetic', 'botanical', 'industrial-design']),
  local('resonance-arch', 'Resonance Arch', 'resonance-arch.glb', ['architecture', 'sound', 'sculpture']),
  local('nebula-lens', 'Nebula Lens', 'nebula-lens.glb', ['optical', 'space', 'installation']),
  local('folded-ribbon', 'Folded Signal Ribbon', 'folded-ribbon.glb', ['generative', 'ribbon', 'kinetic']),
  local('guardian-figure', 'Guardian Figure', 'guardian-figure.glb', ['figurative', 'robotic', 'sculpture']),
  local('solar-orrery', 'Solar Orrery', 'solar-orrery.glb', ['astronomy', 'kinetic', 'metal']),
  local('porcelain-lotus', 'Porcelain Lotus', 'porcelain-lotus.glb', ['ceramic', 'botanical', 'heritage']),
] as const

export interface ExhibitionAssetProviderDefinition {
  id: ExhibitionAssetProviderId
  label: string
  mode: 'bundled' | 'manifest-sync' | 'api-adapter'
  licensePolicy: string
  notes: string
  requiresServerProxy: boolean
}

export const exhibitionAssetProviders: readonly ExhibitionAssetProviderDefinition[] = [
  {
    id: 'local-demo',
    label: 'Bundled local assets',
    mode: 'bundled',
    licensePolicy: 'Only project-owned or explicitly redistributable files are committed.',
    notes: 'Works fully offline and is used by the default 48-booth dataset.',
    requiresServerProxy: false,
  },
  {
    id: 'khronos-sample-assets',
    label: 'Khronos glTF Sample Assets',
    mode: 'manifest-sync',
    licensePolicy: 'The model-level license and credits must be copied into the release manifest.',
    notes: 'Suitable for standards-compliant glTF examples and material feature coverage.',
    requiresServerProxy: false,
  },
  {
    id: 'poly-haven',
    label: 'Poly Haven',
    mode: 'api-adapter',
    licensePolicy: 'CC0 assets; retain provenance in the local manifest even when attribution is optional.',
    notes: 'Use the Node synchronization script rather than browser-side API calls.',
    requiresServerProxy: true,
  },
  {
    id: 'smithsonian-open-access',
    label: 'Smithsonian Open Access',
    mode: 'api-adapter',
    licensePolicy: 'Import only records explicitly marked CC0 and preserve source metadata.',
    notes: 'Best suited to cultural-heritage scans and collection records.',
    requiresServerProxy: true,
  },
  {
    id: 'sketchfab',
    label: 'Sketchfab downloadable models',
    mode: 'api-adapter',
    licensePolicy: 'Validate the license on every asset and retain required attribution.',
    notes: 'Authentication and author-specific license handling belong in a backend adapter.',
    requiresServerProxy: true,
  },
  {
    id: 'custom-dam',
    label: 'Private Digital Asset Management',
    mode: 'manifest-sync',
    licensePolicy: 'Defined by the organization that owns the asset repository.',
    notes: 'Use signed URLs or a build-time synchronization job; never expose private credentials in Vite.',
    requiresServerProxy: true,
  },
] as const

export const getIncludedExhibitionAsset = (id: string): ExhibitionAssetRecord | undefined =>
  includedExhibitionAssets.find((asset) => asset.id === id)
