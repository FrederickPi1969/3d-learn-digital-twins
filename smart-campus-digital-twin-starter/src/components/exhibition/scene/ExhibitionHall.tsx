import { Environment, Line, MeshReflectorMaterial, RoundedBox, Text } from '@react-three/drei'
import { useExhibitionStore } from '@/store/useExhibitionStore'

const ceilingRibs = Array.from({ length: 19 }, (_, index) => -22.5 + index * 2.5)
const sideLightZs = [-13.8, -9.2, -4.6, 0, 4.6, 9.2, 13.8] as const
const floorGuideLines = [
  [[-20, 0.026, -10.7], [20, 0.026, -10.7]],
  [[-20, 0.026, 10.7], [20, 0.026, 10.7]],
  [[-17.4, 0.026, -13], [-17.4, 0.026, 13]],
  [[17.4, 0.026, -13], [17.4, 0.026, 13]],
  [[0, 0.026, 15.8], [0, 0.026, -13.7]],
] as const

function EmissiveStrip({
  position,
  scale,
  color = '#43dcff',
}: {
  position: readonly [number, number, number]
  scale: readonly [number, number, number]
  color?: string
}) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  )
}

export function ExhibitionHall() {
  const showArchitecture = useExhibitionStore((state) => state.showArchitecture)
  const galleryLighting = useExhibitionStore((state) => state.galleryLighting)

  return (
    <group>
      <Environment files="/environments/night-gallery.exr" environmentIntensity={0.72 * galleryLighting} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[54, 40]} />
        <MeshReflectorMaterial
          resolution={768}
          blur={[380, 120]}
          mixBlur={0.82}
          mixStrength={26}
          roughness={0.32}
          depthScale={0.9}
          minDepthThreshold={0.32}
          maxDepthThreshold={1.5}
          color="#050912"
          metalness={0.74}
          mirror={0.26}
        />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]}>
        <planeGeometry args={[58, 44]} />
        <meshStandardMaterial color="#010309" roughness={0.92} metalness={0.18} />
      </mesh>

      {floorGuideLines.map((points, index) => (
        <Line
          key={`floor-guide-${index}`}
          points={points}
          color={index === floorGuideLines.length - 1 ? '#55e9ff' : '#1b7ba4'}
          transparent
          opacity={index === floorGuideLines.length - 1 ? 0.4 : 0.22}
          lineWidth={index === floorGuideLines.length - 1 ? 1.4 : 0.72}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <ringGeometry args={[3.7, 3.78, 96]} />
        <meshBasicMaterial color="#43e3ff" toneMapped={false} transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[7.3, 7.36, 96]} />
        <meshBasicMaterial color="#226ea6" toneMapped={false} transparent opacity={0.34} />
      </mesh>

      {showArchitecture && (
        <>
          <RoundedBox args={[50.6, 8.7, 0.55]} radius={0.22} smoothness={4} position={[0, 4.25, -18]} receiveShadow>
            <meshStandardMaterial color="#0a101b" roughness={0.42} metalness={0.72} />
          </RoundedBox>
          <RoundedBox args={[0.55, 8.7, 35.6]} radius={0.22} smoothness={4} position={[-25, 4.25, 0]} receiveShadow>
            <meshStandardMaterial color="#080e18" roughness={0.5} metalness={0.66} />
          </RoundedBox>
          <RoundedBox args={[0.55, 8.7, 35.6]} radius={0.22} smoothness={4} position={[25, 4.25, 0]} receiveShadow>
            <meshStandardMaterial color="#080e18" roughness={0.5} metalness={0.66} />
          </RoundedBox>

          <RoundedBox args={[19.8, 1.25, 0.65]} radius={0.32} smoothness={5} position={[-15.2, 7.05, 17.55]}>
            <meshStandardMaterial color="#0a101a" roughness={0.32} metalness={0.76} />
          </RoundedBox>
          <RoundedBox args={[19.8, 1.25, 0.65]} radius={0.32} smoothness={5} position={[15.2, 7.05, 17.55]}>
            <meshStandardMaterial color="#0a101a" roughness={0.32} metalness={0.76} />
          </RoundedBox>
          <RoundedBox args={[0.65, 7.5, 0.65]} radius={0.24} smoothness={4} position={[-5.45, 3.62, 17.55]}>
            <meshStandardMaterial color="#0a101a" roughness={0.32} metalness={0.76} />
          </RoundedBox>
          <RoundedBox args={[0.65, 7.5, 0.65]} radius={0.24} smoothness={4} position={[5.45, 3.62, 17.55]}>
            <meshStandardMaterial color="#0a101a" roughness={0.32} metalness={0.76} />
          </RoundedBox>

          {ceilingRibs.map((x, index) => (
            <group key={`ceiling-rib-${x}`}>
              <mesh position={[x, 8.05, -0.2]}>
                <boxGeometry args={[0.23, 0.28, 35.3]} />
                <meshStandardMaterial color={index % 3 === 0 ? '#172238' : '#090f1a'} roughness={0.34} metalness={0.78} />
              </mesh>
              {index % 3 === 0 && (
                <EmissiveStrip position={[x, 7.87, -0.2]} scale={[0.04, 0.025, 17.15]} color="#2a9de3" />
              )}
            </group>
          ))}

          {sideLightZs.map((z) => (
            <group key={`wall-light-${z}`}>
              <EmissiveStrip position={[-24.67, 3.8, z]} scale={[0.035, 2.45, 0.035]} />
              <EmissiveStrip position={[24.67, 3.8, z]} scale={[0.035, 2.45, 0.035]} />
            </group>
          ))}

          <EmissiveStrip position={[0, 7.84, -17.66]} scale={[22.8, 0.04, 0.035]} color="#c3f6ff" />
          <EmissiveStrip position={[-15.2, 6.34, 17.25]} scale={[9.2, 0.045, 0.035]} color="#78eaff" />
          <EmissiveStrip position={[15.2, 6.34, 17.25]} scale={[9.2, 0.045, 0.035]} color="#78eaff" />
        </>
      )}

      <group position={[0, 7.18, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.35, 0.2, 24, 128]} />
          <meshStandardMaterial color="#111d30" metalness={0.82} roughness={0.24} emissive="#093f69" emissiveIntensity={1.15} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.75, 0.055, 12, 128]} />
          <meshBasicMaterial color="#4be6ff" toneMapped={false} />
        </mesh>
        <pointLight color="#4edbff" intensity={18 * galleryLighting} distance={18} decay={2} position={[0, -0.25, 0]} />
      </group>

      {[-18.5, 18.5].map((x) => (
        <group key={`atrium-column-${x}`} position={[x, 0, -1.5]}>
          <RoundedBox args={[1.15, 7.4, 1.15]} radius={0.28} smoothness={5} position={[0, 3.7, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#101825" metalness={0.7} roughness={0.32} />
          </RoundedBox>
          <EmissiveStrip position={[0, 3.7, 0.59]} scale={[0.3, 2.7, 0.025]} color="#2fd8ff" />
        </group>
      ))}

      <Text
        position={[0, 6.88, 17.2]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.52}
        letterSpacing={0.12}
        color="#d9fbff"
        anchorX="center"
        anchorY="middle"
      >
        FUTURE ART HALL · 未来艺术馆
      </Text>
    </group>
  )
}
