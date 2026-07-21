import { useEffect, useMemo } from 'react'
import { Edges } from '@react-three/drei'
import { campusRoads } from '@/data/campus'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { getNightFactor } from '@/utils/environment'
import { createRibbonGeometry } from '@/utils/geometry'

function Road({ road }: { road: (typeof campusRoads)[number] }) {
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const roadGeometry = useMemo(
    () => createRibbonGeometry(road.points, road.width),
    [road.points, road.width],
  )
  const edgeGeometry = useMemo(
    () => createRibbonGeometry(road.points, road.width + (road.glow ? 0.22 : 0.08)),
    [road.points, road.width, road.glow],
  )
  const night = getNightFactor(dayPhase)
  const rainy = weatherKind === 'rain'

  useEffect(
    () => () => {
      roadGeometry.dispose()
      edgeGeometry.dispose()
    },
    [edgeGeometry, roadGeometry],
  )

  return (
    <group>
      {road.glow && (
        <mesh geometry={edgeGeometry} position={[0, 0.045, 0]}>
          <meshBasicMaterial
            color={weatherKind === 'sandstorm' ? '#d88939' : '#ffbd42'}
            transparent
            opacity={0.12 + night * 0.38 + (rainy ? 0.14 : 0)}
            toneMapped={false}
          />
        </mesh>
      )}
      <mesh geometry={roadGeometry} position={[0, 0.06, 0]} receiveShadow>
        <meshPhysicalMaterial
          color={weatherKind === 'sandstorm' ? '#1d1713' : rainy ? '#070d13' : '#101820'}
          roughness={rainy ? 0.22 : 0.72}
          metalness={rainy ? 0.56 : 0.22}
          clearcoat={rainy ? 0.68 : 0}
          clearcoatRoughness={0.16}
        />
        <Edges
          color={road.glow ? '#ffc85c' : '#176a93'}
          threshold={25}
          transparent
          opacity={0.45 + night * 0.45}
        />
      </mesh>
    </group>
  )
}

export function Roads() {
  return (
    <group>
      {campusRoads.map((road) => (
        <Road key={road.id} road={road} />
      ))}
    </group>
  )
}
