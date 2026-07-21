import { Sparkles } from '@react-three/drei'
import { useExhibitionStore } from '@/store/useExhibitionStore'

const trackLights = [
  [-16, -10], [-8, -10], [8, -10], [16, -10],
  [-16, 0], [-8, 0], [8, 0], [16, 0],
  [-16, 10], [-8, 10], [8, 10], [16, 10],
] as const

export function ExhibitionLighting() {
  const galleryLighting = useExhibitionStore((state) => state.galleryLighting)

  return (
    <>
      <ambientLight intensity={0.46 * galleryLighting} color="#8eb7d8" />
      <hemisphereLight intensity={0.72 * galleryLighting} color="#bfe7ff" groundColor="#05070d" />
      <directionalLight
        castShadow
        position={[9, 17, 12]}
        color="#ccecff"
        intensity={1.5 * galleryLighting}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={58}
        shadow-bias={-0.00018}
      />

      {trackLights.map(([x, z], index) => (
        <group key={`${x}-${z}`} position={[x, 7.55, z]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.24, 0.42, 18]} />
            <meshStandardMaterial color="#101a27" metalness={0.82} roughness={0.25} />
          </mesh>
          <spotLight
            position={[0, -0.18, 0]}
            target-position={[x * 0.86, 0, z * 0.9]}
            color={index % 4 === 0 ? '#75dfff' : '#dceeff'}
            intensity={(index % 4 === 0 ? 8.5 : 6.5) * galleryLighting}
            distance={13}
            angle={0.4}
            penumbra={0.76}
            decay={2}
          />
        </group>
      ))}

      <pointLight position={[-22, 4.5, -14]} color="#348eff" intensity={9 * galleryLighting} distance={12} decay={2} />
      <pointLight position={[22, 4.5, -14]} color="#6c49ff" intensity={9 * galleryLighting} distance={12} decay={2} />
      <pointLight position={[-22, 3.5, 14]} color="#f0b75f" intensity={6.5 * galleryLighting} distance={10} decay={2} />
      <pointLight position={[22, 3.5, 14]} color="#39e6b2" intensity={6.5 * galleryLighting} distance={10} decay={2} />

      <Sparkles
        count={74}
        scale={[46, 8, 32]}
        position={[0, 4.2, 0]}
        size={0.72}
        speed={0.08}
        opacity={0.16}
        color="#c8f6ff"
      />
    </>
  )
}
