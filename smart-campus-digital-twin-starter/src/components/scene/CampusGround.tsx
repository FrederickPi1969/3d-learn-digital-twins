import { Edges, MeshReflectorMaterial } from '@react-three/drei'
import { parkingLots } from '@/data/campus'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { getNightFactor } from '@/utils/environment'
import { ScanGrid } from './ScanGrid'

function ParkingLot({
  position,
  rows,
  columns,
  rotation,
}: (typeof parkingLots)[number]) {
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const width = columns * 0.68 + 1.1
  const depth = rows * 0.82 + 1.1
  const stripes = Array.from({ length: columns + 1 }, (_, index) => index)
  const rowStripes = Array.from({ length: rows + 1 }, (_, index) => index)

  return (
    <group position={[position[0], 0.055, position[1]]} rotation={[0, rotation, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial
          color={weatherKind === 'rain' ? '#050c13' : '#08131f'}
          roughness={weatherKind === 'rain' ? 0.34 : 0.82}
          metalness={weatherKind === 'rain' ? 0.42 : 0.1}
        />
        <Edges color="#1f6d9c" threshold={15} />
      </mesh>
      {stripes.map((index) => (
        <mesh
          key={`column-${index}`}
          position={[-width / 2 + 0.55 + index * 0.68, 0.052, 0]}
        >
          <boxGeometry args={[0.025, 0.02, depth - 0.8]} />
          <meshBasicMaterial color="#7cc7e8" transparent opacity={0.7} toneMapped={false} />
        </mesh>
      ))}
      {rowStripes.map((index) => (
        <mesh key={`row-${index}`} position={[0, 0.053, -depth / 2 + 0.55 + index * 0.82]}>
          <boxGeometry args={[width - 0.8, 0.02, 0.025]} />
          <meshBasicMaterial color="#4f8fb0" transparent opacity={0.48} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

export function CampusGround() {
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const effectsEnabled = useDigitalTwinStore((state) => state.effectsEnabled)
  const rainy = weatherKind === 'rain'
  const night = getNightFactor(dayPhase)

  return (
    <group>
      <mesh position={[0, -0.24, 0]} receiveShadow>
        <boxGeometry args={[48, 0.45, 34]} />
        <meshStandardMaterial
          color={weatherKind === 'sandstorm' ? '#1a120d' : '#04101b'}
          roughness={rainy ? 0.38 : 0.86}
          metalness={rainy ? 0.48 : 0.2}
        />
        <Edges color="#0b4f78" threshold={15} />
      </mesh>

      <mesh position={[0, -0.005, 0]} receiveShadow>
        <boxGeometry args={[42.5, 0.08, 28.5]} />
        <meshPhysicalMaterial
          color={weatherKind === 'snow' ? '#192329' : weatherKind === 'sandstorm' ? '#24170f' : '#071b24'}
          roughness={rainy ? 0.28 : 0.92}
          metalness={rainy ? 0.52 : 0.04}
          clearcoat={rainy ? 0.72 : 0}
          clearcoatRoughness={rainy ? 0.15 : 0.8}
        />
      </mesh>

      <ScanGrid />

      {parkingLots.map((lot) => (
        <ParkingLot key={lot.id} {...lot} />
      ))}

      <mesh position={[0, 0.032, 1.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 5.0]} />
        {effectsEnabled ? (
          <MeshReflectorMaterial
            blur={[420, 110]}
            resolution={512}
            mixBlur={1.4}
            mixStrength={0.72 + night * 0.55 + (rainy ? 0.48 : 0)}
            mirror={rainy ? 0.36 : 0.18}
            depthScale={0.72}
            minDepthThreshold={0.72}
            maxDepthThreshold={1.35}
            color={weatherKind === 'snow' ? '#1b2b32' : '#061b25'}
            metalness={0.52}
            roughness={rainy ? 0.18 : 0.42}
          />
        ) : (
          <meshStandardMaterial color="#0a2730" roughness={0.82} metalness={0.2} />
        )}
      </mesh>

      <mesh position={[0, 0.025, 1.0]} receiveShadow>
        <boxGeometry args={[10.12, 0.04, 5.12]} />
        <meshBasicMaterial
          color="#1b798d"
          transparent
          opacity={0.32 + night * 0.26}
          wireframe
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
