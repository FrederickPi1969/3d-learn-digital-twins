import { beforeEach, describe, expect, it } from 'vitest'
import { useExhibitionStore } from './useExhibitionStore'

describe('useExhibitionStore', () => {
  beforeEach(() => {
    useExhibitionStore.getState().resetExhibition()
  })

  it('focuses the camera when an exhibit is selected', () => {
    const before = useExhibitionStore.getState().cameraRequestNonce
    useExhibitionStore.getState().selectExhibit('exhibit-08')
    const state = useExhibitionStore.getState()
    expect(state.selectedExhibitId).toBe('exhibit-08')
    expect(state.cameraPreset).toBe('exhibit')
    expect(state.cameraRequestNonce).toBe(before + 1)
  })

  it('opens the virtual operating system with a requested application', () => {
    useExhibitionStore.getState().openOs('browser')
    const state = useExhibitionStore.getState()
    expect(state.osOpen).toBe(true)
    expect(state.osInitialApp).toBe('browser')
  })

  it('clamps visual control values', () => {
    useExhibitionStore.getState().setAmbientVisitors(100)
    useExhibitionStore.getState().setGalleryLighting(-2)
    useExhibitionStore.getState().setBloomIntensity(9)
    useExhibitionStore.getState().setMediaScreenBrightness(8)
    const state = useExhibitionStore.getState()
    expect(state.ambientVisitors).toBe(28)
    expect(state.galleryLighting).toBe(0.35)
    expect(state.bloomIntensity).toBe(1.6)
    expect(state.mediaScreenBrightness).toBe(1.35)
  })
  it('toggles the in-world animated media walls', () => {
    expect(useExhibitionStore.getState().mediaScreensEnabled).toBe(false)
    useExhibitionStore.getState().toggleMediaScreens()
    expect(useExhibitionStore.getState().mediaScreensEnabled).toBe(true)
  })

})
