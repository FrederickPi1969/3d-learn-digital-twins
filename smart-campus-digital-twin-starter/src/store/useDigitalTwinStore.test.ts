import { beforeEach, describe, expect, it } from 'vitest'
import { useDigitalTwinStore } from './useDigitalTwinStore'

const initialState = useDigitalTwinStore.getInitialState()

const resetStore = () => {
  useDigitalTwinStore.setState(initialState, true)
}

describe('digital twin navigation and extension store', () => {
  beforeEach(resetStore)

  it('switches between the exhibition experience and the original campus without stale state', () => {
    expect(useDigitalTwinStore.getState().experienceMode).toBe('exhibition')

    useDigitalTwinStore.getState().setExperienceMode('campus')
    expect(useDigitalTwinStore.getState().experienceMode).toBe('campus')

    useDigitalTwinStore.getState().enterBuilding('tower-a', 2)
    useDigitalTwinStore.getState().setExperienceMode('exhibition')

    const state = useDigitalTwinStore.getState()
    expect(state.experienceMode).toBe('exhibition')
    expect(state.viewMode).toBe('campus')
    expect(state.selectedBuildingId).toBeNull()
    expect(state.extensionPanelOpen).toBe(false)
  })

  it('enters and exits a building deterministically', () => {
    useDigitalTwinStore.getState().enterBuilding('tower-a', 5)
    expect(useDigitalTwinStore.getState().renderMode).toBe('twin')
    expect(useDigitalTwinStore.getState().viewMode).toBe('building')
    expect(useDigitalTwinStore.getState().selectedBuildingId).toBe('tower-a')
    expect(useDigitalTwinStore.getState().activeFloor).toBe(5)

    useDigitalTwinStore.getState().exitBuilding()
    expect(useDigitalTwinStore.getState().viewMode).toBe('campus')
    expect(useDigitalTwinStore.getState().selectedBuildingId).toBeNull()
    expect(useDigitalTwinStore.getState().cameraResetNonce).toBe(1)
  })

  it('switches GIS mode without leaving a stale building selection', () => {
    useDigitalTwinStore.getState().enterBuilding('tower-b', 3)
    useDigitalTwinStore.getState().setRenderMode('gis')

    const state = useDigitalTwinStore.getState()
    expect(state.renderMode).toBe('gis')
    expect(state.viewMode).toBe('campus')
    expect(state.selectedBuildingId).toBeNull()
  })

  it('cycles environmental modes in a fixed order', () => {
    const state = useDigitalTwinStore.getState()
    expect(state.weatherKind).toBe('clear')
    state.cycleWeather()
    expect(useDigitalTwinStore.getState().weatherKind).toBe('rain')
    useDigitalTwinStore.getState().cycleWeather()
    expect(useDigitalTwinStore.getState().weatherKind).toBe('snow')

    expect(useDigitalTwinStore.getState().dayPhase).toBe('night')
    useDigitalTwinStore.getState().cycleDayPhase()
    expect(useDigitalTwinStore.getState().dayPhase).toBe('auto')
  })

  it('clamps user-controlled density, counts and speed to safe ranges', () => {
    const state = useDigitalTwinStore.getState()
    state.setWeatherIntensity(2)
    state.setWindSpeed(-1)
    state.setVegetationDensity(9)
    state.setVehicleCount(100)
    state.setPedestrianCount(-5)
    state.setEntitySpeed(0)

    const next = useDigitalTwinStore.getState()
    expect(next.weatherIntensity).toBe(1)
    expect(next.windSpeed).toBe(0)
    expect(next.vegetationDensity).toBe(1.4)
    expect(next.vehicleCount).toBe(36)
    expect(next.pedestrianCount).toBe(0)
    expect(next.entitySpeed).toBe(0.2)
  })
})
