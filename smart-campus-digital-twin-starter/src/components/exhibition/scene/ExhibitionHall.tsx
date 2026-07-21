import { Environment, Lightformer, Line, MeshReflectorMaterial, RoundedBox, Text } from '@react-three/drei'
import { useExhibitionStore } from '@/store/useExhibitionStore'

const floorGuideLines = [
  [[-20, 0.026, -10.7], [20, 0.026, -10.7]],
  [[-20, 0.026, 10.7], [20, 0.026, 10.7]],
  [[-17.4, 0.026, -13], [-17.4, 0.026, 13]],
  [[17.4, 0.026, -13], [17.4, 0.026, 13]],
  [[0, 0.026, 15.8], [0, 0.026, -13.7]],
] as const

const ceilingPanels = [
  { position: [0, 8.08, -15.3], scale: [50, 0.3, 5.4] },
  { position: [0, 8.08, 15.3], scale: [50, 0.3, 5.4] },
  { position: [-19.2, 8.08, 0], scale: [11.6, 0.3, 25.2] },
  { position: [19.2, 8.08, 0], scale: [11.6, 0.3, 25.2] },
  { position: [0, 8.08, 0], scale: [8.2, 0.3, 25.2] },
  { position: [-9.3, 8.08, 7.4], scale: [7.2, 0.3, 10.2] },
  { position: [9.3, 8.08, -7.4], scale: [7.2, 0.3, 10.2] },
] as const

const trackRails = [-12.7, -5.0, 5.0, 12.7] as const
const skylights = [
  { position: [-9.3, 8.12, -5.15] as const, size: [7.55, 9.4] as const },
  { position: [9.3, 8.12, 5.15] as const, size: [7.55, 9.4] as const },
] as const

function EmissiveStrip({
  position,
  scale,
  color = '#73dff6',
  opacity = 1,
}: {
  position: readonly [number, number, number]
  scale: readonly [number, number, number]
  color?: string
  opacity?: number
}) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} toneMapped={false} />
    </mesh>
  )
}

function WhiteWallMaterial() {
  return (
    <meshPhysicalMaterial
      color="#f4f5f4"
      roughness={0.56}
      metalness={0.02}
      clearcoat={0.16}
      clearcoatRoughness={0.55}
    />
  )
}

function Skylight({ position, size }: { position: readonly [number, number, number]; size: readonly [number, number] }) {
  const [width, depth] = size
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshPhysicalMaterial
          color="#dff3ff"
          transparent
          opacity={0.33}
          transmission={0.44}
          thickness={0.08}
          roughness={0.08}
          metalness={0.02}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0.045, -depth / 2]}>
        <boxGeometry args={[width + 0.34, 0.22, 0.22]} />
        <meshStandardMaterial color="#20262c" metalness={0.72} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.045, depth / 2]}>
        <boxGeometry args={[width + 0.34, 0.22, 0.22]} />
        <meshStandardMaterial color="#20262c" metalness={0.72} roughness={0.24} />
      </mesh>
      <mesh position={[-width / 2, 0.045, 0]}>
        <boxGeometry args={[0.22, 0.22, depth]} />
        <meshStandardMaterial color="#20262c" metalness={0.72} roughness={0.24} />
      </mesh>
      <mesh position={[width / 2, 0.045, 0]}>
        <boxGeometry args={[0.22, 0.22, depth]} />
        <meshStandardMaterial color="#20262c" metalness={0.72} roughness={0.24} />
      </mesh>
      {[-0.25, 0.25].map((factor) => (
        <mesh key={factor} position={[width * factor, 0.05, 0]}>
          <boxGeometry args={[0.12, 0.18, depth]} />
          <meshStandardMaterial color="#414950" metalness={0.64} roughness={0.28} />
        </mesh>
      ))}
    </group>
  )
}

export function ExhibitionHall() {
  const showArchitecture = useExhibitionStore((state) => state.showArchitecture)
  const galleryLighting = useExhibitionStore((state) => state.galleryLighting)

  return (
    <group>
      <Environment resolution={128} environmentIntensity={0.38 * galleryLighting}>
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[0, 14, 0]} rotation-x={Math.PI / 2} scale={[24, 24, 1]} />
        <Lightformer form="rect" intensity={1.05} color="#d9efff" position={[-18, 6, 4]} rotation-y={Math.PI / 2} scale={[11, 9, 1]} />
        <Lightformer form="rect" intensity={1.05} color="#fff4e3" position={[18, 6, -4]} rotation-y={-Math.PI / 2} scale={[11, 9, 1]} />
        <Lightformer form="ring" intensity={0.75} color="#b9ecff" position={[0, 7, -8]} scale={[8, 8, 1]} />
      </Environment>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[54, 40]} />
        <MeshReflectorMaterial
          resolution={256}
          blur={[120, 30]}
          mixBlur={0.5}
          mixStrength={1.35}
          roughness={0.66}
          depthScale={0.24}
          minDepthThreshold={0.42}
          maxDepthThreshold={1.35}
          color="#bfc7cb"
          metalness={0.04}
          mirror={0.055}
        />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.075, 0]}>
        <planeGeometry args={[60, 46]} />
        <meshStandardMaterial color="#d9dde0" roughness={0.88} metalness={0.02} />
      </mesh>

      {floorGuideLines.map((points, index) => (
        <Line
          key={`floor-guide-${index}`}
          points={points}
          color={index === floorGuideLines.length - 1 ? '#40b9d5' : '#a9bcc4'}
          transparent
          opacity={index === floorGuideLines.length - 1 ? 0.32 : 0.22}
          lineWidth={index === floorGuideLines.length - 1 ? 1.25 : 0.72}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <ringGeometry args={[3.7, 3.76, 96]} />
        <meshBasicMaterial color="#67d9ee" toneMapped={false} transparent opacity={0.42} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[7.3, 7.35, 96]} />
        <meshBasicMaterial color="#7d98a5" toneMapped={false} transparent opacity={0.18} />
      </mesh>

      {showArchitecture && (
        <>
          <RoundedBox args={[50.6, 8.7, 0.55]} radius={0.22} smoothness={4} position={[0, 4.25, -18]} receiveShadow>
            <WhiteWallMaterial />
          </RoundedBox>
          <RoundedBox args={[0.55, 8.7, 35.6]} radius={0.22} smoothness={4} position={[-25, 4.25, 0]} receiveShadow>
            <WhiteWallMaterial />
          </RoundedBox>
          <RoundedBox args={[0.55, 8.7, 35.6]} radius={0.22} smoothness={4} position={[25, 4.25, 0]} receiveShadow>
            <WhiteWallMaterial />
          </RoundedBox>

          <RoundedBox args={[19.3, 8.0, 0.52]} radius={0.28} smoothness={5} position={[-15.25, 4.0, 17.8]} receiveShadow>
            <WhiteWallMaterial />
          </RoundedBox>
          <RoundedBox args={[19.3, 8.0, 0.52]} radius={0.28} smoothness={5} position={[15.25, 4.0, 17.8]} receiveShadow>
            <WhiteWallMaterial />
          </RoundedBox>
          <RoundedBox args={[0.6, 7.8, 0.64]} radius={0.25} smoothness={4} position={[-5.42, 3.9, 17.55]}>
            <WhiteWallMaterial />
          </RoundedBox>
          <RoundedBox args={[0.6, 7.8, 0.64]} radius={0.25} smoothness={4} position={[5.42, 3.9, 17.55]}>
            <WhiteWallMaterial />
          </RoundedBox>

          {ceilingPanels.map((panel, index) => (
            <mesh key={`ceiling-panel-${index}`} position={panel.position} castShadow receiveShadow>
              <boxGeometry args={panel.scale} />
              <meshPhysicalMaterial color="#f0f1f0" roughness={0.56} metalness={0.02} clearcoat={0.12} />
            </mesh>
          ))}

          {skylights.map((skylight) => <Skylight key={`${skylight.position[0]}-${skylight.position[2]}`} {...skylight} />)}

          {trackRails.map((z) => (
            <group key={`track-rail-${z}`} position={[0, 7.58, z]}>
              <mesh>
                <boxGeometry args={[43.2, 0.12, 0.12]} />
                <meshStandardMaterial color="#161b20" metalness={0.74} roughness={0.24} />
              </mesh>
              <EmissiveStrip position={[0, -0.075, 0]} scale={[20.4, 0.012, 0.018]} color="#f8fdff" opacity={0.72} />
            </group>
          ))}

          <EmissiveStrip position={[0, 0.14, -17.66]} scale={[23.7, 0.035, 0.035]} color="#bceefa" opacity={0.78} />
          <EmissiveStrip position={[-24.66, 0.14, 0]} scale={[0.035, 0.035, 16.8]} color="#83d7e8" opacity={0.55} />
          <EmissiveStrip position={[24.66, 0.14, 0]} scale={[0.035, 0.035, 16.8]} color="#83d7e8" opacity={0.55} />

          <RoundedBox args={[7.4, 4.2, 0.42]} radius={0.38} smoothness={8} position={[0, 2.1, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color="#f7f7f5" roughness={0.43} metalness={0.03} clearcoat={0.28} />
          </RoundedBox>
          <mesh position={[0, 0.18, 0.24]}>
            <boxGeometry args={[6.5, 0.035, 0.04]} />
            <meshBasicMaterial color="#56cbe4" toneMapped={false} />
          </mesh>
        </>
      )}

      <group position={[0, 7.2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.2, 0.18, 24, 128]} />
          <meshPhysicalMaterial color="#edf2f4" metalness={0.28} roughness={0.2} clearcoat={0.72} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.72, 0.055, 12, 128]} />
          <meshBasicMaterial color="#62dff4" toneMapped={false} />
        </mesh>
        <pointLight color="#dffaff" intensity={4.2 * galleryLighting} distance={14} decay={2} position={[0, -0.25, 0]} />
      </group>

      {[-18.5, 18.5].map((x) => (
        <group key={`atrium-column-${x}`} position={[x, 0, -1.5]}>
          <RoundedBox args={[1.15, 7.4, 1.15]} radius={0.28} smoothness={5} position={[0, 3.7, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color="#f1f2f1" metalness={0.06} roughness={0.42} clearcoat={0.2} />
          </RoundedBox>
          <EmissiveStrip position={[0, 0.42, 0.59]} scale={[0.31, 0.028, 0.024]} color="#5fd8ef" opacity={0.8} />
        </group>
      ))}

      <Text
        position={[0, 6.9, 17.16]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.52}
        letterSpacing={0.12}
        color="#323a40"
        anchorX="center"
        anchorY="middle"
      >
        FUTURE ART HALL · 未来艺术馆
      </Text>
    </group>
  )
}
