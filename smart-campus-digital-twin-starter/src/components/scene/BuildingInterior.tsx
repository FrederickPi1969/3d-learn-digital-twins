import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { buildRoomCells } from '@/data/interior'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import type { BuildingConfig, RoomCell } from '@/types/digitalTwin'
import { HEALTH_COLORS } from '@/utils/color'

function Room({
  room,
  y,
  active,
}: {
  room: RoomCell
  y: number
  active: boolean
}) {
  const color = HEALTH_COLORS[room.status]
  return (
    <mesh position={[room.x, y + 0.2, room.z]} castShadow={active}>
      <boxGeometry args={[room.width, 0.34, room.depth]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={active ? 1.8 : 0.35}
        transparent
        opacity={active ? 0.82 : 0.16}
        roughness={0.4}
        metalness={0.16}
        depthWrite={active}
        toneMapped={false}
      />
      {active && <Edges color="#d8fbff" threshold={20} />}
    </mesh>
  )
}

function Scanner({ width, depth, totalHeight }: { width: number; depth: number; totalHeight: number }) {
  const scannerRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!scannerRef.current) return
    scannerRef.current.position.y = 0.2 + ((clock.elapsedTime * 0.9) % totalHeight)
  })

  return (
    <mesh ref={scannerRef} position={[0, 0.2, 0]}>
      <boxGeometry args={[width + 0.35, 0.025, depth + 0.35]} />
      <meshBasicMaterial
        color="#6feeff"
        transparent
        opacity={0.22}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

function DataRiser({ totalHeight }: { totalHeight: number }) {
  const attributeRef = useRef<THREE.BufferAttribute>(null)
  const count = 22
  const initialPositions = useMemo(() => new Float32Array(count * 3), [])

  useFrame(({ clock }) => {
    const attribute = attributeRef.current
    if (!attribute) return
    const positions = attribute.array as Float32Array
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3
      const progress = (clock.elapsedTime * 0.19 + index / count) % 1
      positions[offset] = Math.sin(index * 2.4) * 0.08
      positions[offset + 1] = progress * totalHeight
      positions[offset + 2] = Math.cos(index * 1.7) * 0.08
    }
    attribute.needsUpdate = true
  })

  return (
    <points position={[0, 0.15, 0]}>
      <bufferGeometry>
        <bufferAttribute ref={attributeRef} attach="attributes-position" args={[initialPositions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8cffff"
        size={0.11}
        sizeAttenuation
        transparent
        opacity={0.92}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  )
}

export function BuildingInterior({ building }: { building: BuildingConfig }) {
  const activeFloor = useDigitalTwinStore((state) => state.activeFloor)
  const setActiveFloor = useDigitalTwinStore((state) => state.setActiveFloor)
  const rooms = useMemo(() => buildRoomCells(building), [building])
  const [width, height, depth] = building.size
  const nominalFloorHeight = height / building.floors
  const floorPitch = Math.max(0.62, nominalFloorHeight * 1.12)
  const totalHeight = floorPitch * building.floors

  return (
    <group
      position={[building.position[0], 0.08, building.position[1]]}
      rotation={[0, building.rotation ?? 0, 0]}
    >
      <mesh position={[0, totalHeight / 2, 0]} renderOrder={0}>
        <boxGeometry args={[width + 0.12, totalHeight + 0.12, depth + 0.12]} />
        <meshStandardMaterial
          color="#2b95c9"
          emissive="#1578aa"
          emissiveIntensity={0.32}
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
        <Edges color="#57ddff" threshold={15} scale={1.002} />
      </mesh>

      {Array.from({ length: building.floors }, (_, floorIndex) => {
        const floor = floorIndex + 1
        const y = floorIndex * floorPitch + 0.18
        const active = floor === activeFloor
        const floorRooms = rooms.filter((room) => room.floor === floor)

        return (
          <group key={floor}>
            <mesh
              position={[0, y, 0]}
              onClick={(event) => {
                event.stopPropagation()
                setActiveFloor(floor)
              }}
              receiveShadow
            >
              <boxGeometry args={[width, active ? 0.11 : 0.07, depth]} />
              <meshStandardMaterial
                color={active ? '#59e9ff' : '#11334a'}
                emissive={active ? '#35cfff' : '#0b5b79'}
                emissiveIntensity={active ? 1.7 : 0.32}
                transparent
                opacity={active ? 0.82 : 0.34}
                roughness={0.46}
                metalness={0.25}
                toneMapped={false}
              />
              <Edges color={active ? '#dcfbff' : '#2495bd'} threshold={20} />
            </mesh>

            {floorRooms.map((room) => (
              <Room key={room.id} room={room} y={y} active={active} />
            ))}

            {active && (
              <Html
                position={[-width / 2 - 0.65, y + 0.15, depth / 2]}
                center
                distanceFactor={11}
                zIndexRange={[20, 0]}
              >
                <button
                  type="button"
                  className="floor-world-label"
                  onClick={(event) => {
                    event.stopPropagation()
                    setActiveFloor(floor)
                  }}
                >
                  F{String(floor).padStart(2, '0')} · 当前楼层
                </button>
              </Html>
            )}
          </group>
        )
      })}

      <Line
        points={[
          [0, 0.15, 0],
          [0, totalHeight + 0.15, 0],
        ]}
        color="#70f5ff"
        lineWidth={1.8}
        transparent
        opacity={0.76}
        toneMapped={false}
      />
      <DataRiser totalHeight={totalHeight} />
      <Scanner width={width} depth={depth} totalHeight={totalHeight} />

      <Html
        position={[0, totalHeight + 1.0, 0]}
        center
        distanceFactor={13}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="interior-world-title">
          <span>{building.code}</span>
          <strong>{building.name}</strong>
          <small>楼宇空间剖析模式 · {building.floors} 层</small>
        </div>
      </Html>
    </group>
  )
}
