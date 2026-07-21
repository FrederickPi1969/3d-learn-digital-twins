import { useExhibitionStore } from '@/store/useExhibitionStore'

const trackLights = [
  [-20, -12.7], [-14, -12.7], [-8, -12.7], [8, -12.7], [14, -12.7], [20, -12.7],
  [-20, -5], [-12, -5], [-4, -5], [4, -5], [12, -5], [20, -5],
  [-20, 5], [-12, 5], [-4, 5], [4, 5], [12, 5], [20, 5],
  [-20, 12.7], [-14, 12.7], [-8, 12.7], [8, 12.7], [14, 12.7], [20, 12.7],
] as const

export function ExhibitionLighting() {
  const galleryLighting = useExhibitionStore((state) => state.galleryLighting)

  return (
    <>
      <ambientLight intensity={0.92 * galleryLighting} color="#f2f6f8" />
      <hemisphereLight intensity={1.16 * galleryLighting} color="#e8f5ff" groundColor="#9ca4a8" />
      <directionalLight
        castShadow
        position={[-11, 19, 8]}
        color="#fff7ea"
        intensity={2.35 * galleryLighting}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-31}
        shadow-camera-right={31}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={1}
        shadow-camera-far={62}
        shadow-bias={-0.00014}
        shadow-normalBias={0.025}
      />
      <directionalLight position={[14, 13, -10]} color="#d9efff" intensity={0.72 * galleryLighting} />

      {trackLights.map(([x, z], index) => (
        <group key={`${x}-${z}`} position={[x, 7.43, z]}>
          <mesh rotation={[0, 0, index % 2 === 0 ? 0.18 : -0.18]} castShadow>
            <cylinderGeometry args={[0.14, 0.22, 0.48, 18]} />
            <meshStandardMaterial color="#161b20" metalness={0.78} roughness={0.23} />
          </mesh>
          <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.135, 18]} />
            <meshBasicMaterial color={index % 5 === 0 ? '#c8f3ff' : '#fff9ee'} toneMapped={false} />
          </mesh>
          <spotLight
            position={[0, -0.18, 0]}
            target-position={[x * 0.92, 0.4, z * 0.92]}
            color={index % 5 === 0 ? '#d8f6ff' : '#fff8ed'}
            intensity={(index % 5 === 0 ? 6.8 : 5.5) * galleryLighting}
            distance={12.5}
            angle={0.36}
            penumbra={0.78}
            decay={2}
          />
        </group>
      ))}

      <rectAreaLight position={[-9.3, 7.78, -5.15]} rotation={[-Math.PI / 2, 0, 0]} width={7.2} height={8.8} color="#d8efff" intensity={2.8 * galleryLighting} />
      <rectAreaLight position={[9.3, 7.78, 5.15]} rotation={[-Math.PI / 2, 0, 0]} width={7.2} height={8.8} color="#fff5e5" intensity={2.5 * galleryLighting} />

      <pointLight position={[-22, 3.8, -14]} color="#a9e8f4" intensity={3.4 * galleryLighting} distance={10} decay={2} />
      <pointLight position={[22, 3.8, -14]} color="#c5ddff" intensity={3.2 * galleryLighting} distance={10} decay={2} />
      <pointLight position={[-22, 3.2, 14]} color="#ffe5bd" intensity={2.6 * galleryLighting} distance={9} decay={2} />
      <pointLight position={[22, 3.2, 14]} color="#c8f5ec" intensity={2.6 * galleryLighting} distance={9} decay={2} />
    </>
  )
}
