import { describe, expect, it } from 'vitest'
import { exhibitionAssetProviders, includedExhibitionAssets } from './exhibitionAssets'

describe('exhibition digital asset registry', () => {
  it('ships a varied offline model collection with unique identifiers and URLs', () => {
    expect(includedExhibitionAssets.length).toBeGreaterThanOrEqual(10)
    expect(new Set(includedExhibitionAssets.map((asset) => asset.id)).size).toBe(includedExhibitionAssets.length)
    expect(new Set(includedExhibitionAssets.map((asset) => asset.url)).size).toBe(includedExhibitionAssets.length)
    expect(includedExhibitionAssets.every((asset) => asset.url.endsWith('.glb'))).toBe(true)
  })

  it('documents bundled, public and private asset ingestion channels', () => {
    const providerIds = new Set(exhibitionAssetProviders.map((provider) => provider.id))
    expect(providerIds).toEqual(new Set([
      'local-demo',
      'khronos-sample-assets',
      'poly-haven',
      'smithsonian-open-access',
      'sketchfab',
      'custom-dam',
    ]))
    expect(exhibitionAssetProviders.some((provider) => provider.mode === 'api-adapter')).toBe(true)
    expect(exhibitionAssetProviders.some((provider) => provider.mode === 'manifest-sync')).toBe(true)
  })
})
