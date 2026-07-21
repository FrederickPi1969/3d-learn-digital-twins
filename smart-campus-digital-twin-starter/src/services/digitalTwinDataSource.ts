import { campusBuildings } from '@/data/campus'
import type {
  BuildingConfig,
  BuildingTelemetry,
  CampusTelemetry,
} from '@/types/digitalTwin'
import { clamp, generateTrend, seededNoise } from '@/utils/math'

export interface DigitalTwinDataSource {
  readCampusSnapshot(tick: number): CampusTelemetry
  readBuildingSnapshot(building: BuildingConfig, tick: number): BuildingTelemetry
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0)

class MockDigitalTwinDataSource implements DigitalTwinDataSource {
  readCampusSnapshot(tick: number): CampusTelemetry {
    const phase = tick * 0.19
    const totalOccupancy = Math.round(
      sum(campusBuildings.map((building) => building.occupancy)) + Math.sin(phase) * 38,
    )
    const powerNowKw =
      sum(campusBuildings.map((building) => building.powerKw)) + Math.sin(phase * 0.8) * 72
    const activeDevices = 1084 + Math.round(Math.sin(phase * 1.3) * 21)
    const warnings = campusBuildings.filter((building) => building.health !== 'normal').length

    return {
      timestamp: Date.now(),
      waterTodayM3: 1253 + tick * 0.42,
      powerNowKw,
      carbonTodayKg: 842 + tick * 0.31,
      totalOccupancy,
      availableParking: 222 + Math.round(Math.sin(phase * 0.65) * 9),
      activeDevices,
      warnings,
      waterTrend: generateTrend(18, 72 + Math.sin(phase) * 4, 18, 1.3 + tick * 0.03),
      powerTrend: generateTrend(18, 88 + Math.sin(phase * 0.7) * 5, 23, 4.1 + tick * 0.04),
      occupancyTrend: generateTrend(18, 65, 14, 7.7 + tick * 0.02),
      deviceTrend: generateTrend(18, 82, 9, 10.9 + tick * 0.025),
    }
  }

  readBuildingSnapshot(building: BuildingConfig, tick: number): BuildingTelemetry {
    const phase = tick * 0.23 + building.code.charCodeAt(0) * 0.1
    const floorLoads = Array.from({ length: building.floors }, (_, floorIndex) => {
      const base = 45 + seededNoise(floorIndex * 19 + building.floors) * 42
      return clamp(base + Math.sin(phase + floorIndex * 0.47) * 9, 8, 98)
    })

    return {
      timestamp: Date.now(),
      buildingId: building.id,
      temperatureC: 23.4 + Math.sin(phase) * 0.8,
      humidityPercent: 48 + Math.sin(phase * 0.7) * 4,
      co2Ppm: 612 + Math.round(Math.sin(phase * 1.1) * 55),
      pm25UgM3: 11 + Math.max(0, Math.sin(phase * 0.9) * 4),
      powerKw: building.powerKw + Math.sin(phase * 0.8) * building.powerKw * 0.08,
      chilledWaterM3h: building.waterM3 * 0.22 + Math.sin(phase * 0.6) * 1.4,
      occupancy: Math.round(building.occupancy + Math.sin(phase * 0.5) * 18),
      activeDevices: Math.round(building.floors * 16 + seededNoise(tick + building.floors) * 12),
      warnings: building.health === 'critical' ? 3 : building.health === 'warning' ? 1 : 0,
      floorLoads,
    }
  }
}

export const digitalTwinDataSource: DigitalTwinDataSource = new MockDigitalTwinDataSource()
