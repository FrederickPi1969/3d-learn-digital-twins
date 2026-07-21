import type { BuildingConfig, HealthState, RoomCell } from '@/types/digitalTwin'
import { seededNoise } from '@/utils/math'

const ROOM_LABELS = ['开放办公区', '会议室', '设备间', '实验室', '茶水区', '协作空间']

function statusFor(seed: number): HealthState {
  const value = seededNoise(seed)
  if (value > 0.93) return 'critical'
  if (value > 0.78) return 'warning'
  return 'normal'
}

export function buildRoomCells(building: BuildingConfig): RoomCell[] {
  const [width, , depth] = building.size
  const roomWidth = Math.max(0.9, width * 0.34)
  const roomDepth = Math.max(0.8, depth * 0.34)
  const offsets = [
    [-width * 0.22, -depth * 0.22],
    [width * 0.22, -depth * 0.22],
    [-width * 0.22, depth * 0.22],
    [width * 0.22, depth * 0.22],
  ] as const

  return Array.from({ length: building.floors }, (_, floorIndex) => {
    const floor = floorIndex + 1
    return offsets.map(([x, z], roomIndex) => {
      const seed = floor * 37 + roomIndex * 13 + building.code.charCodeAt(0)
      return {
        id: `${building.id}-f${floor}-r${roomIndex + 1}`,
        floor,
        label: ROOM_LABELS[(floor + roomIndex) % ROOM_LABELS.length],
        x,
        z,
        width: roomWidth,
        depth: roomDepth,
        status: statusFor(seed),
        occupancy: Math.round(4 + seededNoise(seed + 9) * 20),
      } satisfies RoomCell
    })
  }).flat()
}
