import { useEffect, useMemo, useState } from 'react'
import { digitalTwinDataSource } from '@/services/digitalTwinDataSource'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import type { BuildingConfig } from '@/types/digitalTwin'

export function useCampusTelemetry() {
  const paused = useDigitalTwinStore((state) => state.telemetryPaused)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (paused) return undefined
    const timer = window.setInterval(() => setTick((value) => value + 1), 1800)
    return () => window.clearInterval(timer)
  }, [paused])

  return useMemo(() => digitalTwinDataSource.readCampusSnapshot(tick), [tick])
}

export function useBuildingTelemetry(building: BuildingConfig | undefined) {
  const paused = useDigitalTwinStore((state) => state.telemetryPaused)
  const [tick, setTick] = useState(0)


  useEffect(() => {
    if (paused || !building) return undefined
    const timer = window.setInterval(() => setTick((value) => value + 1), 1500)
    return () => window.clearInterval(timer)
  }, [paused, building])

  return useMemo(
    () => (building ? digitalTwinDataSource.readBuildingSnapshot(building, tick) : null),
    [building, tick],
  )
}
