import { describe, expect, it } from 'vitest'
import { CAMPUS_GIS_ANCHOR, campusZones, campusZonesGeoJson, localMetersToDegrees } from './gis'

describe('GIS local-coordinate bridge', () => {
  it('maps the local origin to the configured WGS84 anchor', () => {
    const [longitude, latitude] = localMetersToDegrees([0, 0])
    expect(longitude).toBeCloseTo(CAMPUS_GIS_ANCHOR.longitude, 10)
    expect(latitude).toBeCloseTo(CAMPUS_GIS_ANCHOR.latitude, 10)
  })

  it('preserves east and north direction in the local linear approximation', () => {
    const [originLongitude, originLatitude] = localMetersToDegrees([0, 0])
    const [eastLongitude, eastLatitude] = localMetersToDegrees([100, 0])
    const [northLongitude, northLatitude] = localMetersToDegrees([0, 100])

    expect(eastLongitude).toBeGreaterThan(originLongitude)
    expect(eastLatitude).toBeCloseTo(originLatitude, 10)
    expect(northLongitude).toBeCloseTo(originLongitude, 10)
    expect(northLatitude).toBeGreaterThan(originLatitude)
  })

  it('emits one closed GeoJSON polygon per functional zone', () => {
    expect(campusZonesGeoJson.features).toHaveLength(campusZones.length)
    campusZonesGeoJson.features.forEach((feature) => {
      const ring = feature.geometry.coordinates[0]
      expect(ring.length).toBeGreaterThanOrEqual(4)
      expect(ring[0]).toEqual(ring.at(-1))
    })
  })
})
