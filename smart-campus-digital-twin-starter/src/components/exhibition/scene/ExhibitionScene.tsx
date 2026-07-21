import { ContactShadows } from '@react-three/drei'
import { exhibitionExhibits } from '@/data/exhibition'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import { AmbientVisitors } from './AmbientVisitors'
import { ExhibitBooth } from './ExhibitBooth'
import { ExhibitionCameraRig } from './ExhibitionCameraRig'
import { ExhibitionEffects } from './ExhibitionEffects'
import { ExhibitionHall } from './ExhibitionHall'
import { ExhibitionLighting } from './ExhibitionLighting'
import { ExhibitionScreens } from './ExhibitionScreens'

export function ExhibitionScene() {
  const selectExhibit = useExhibitionStore((state) => state.selectExhibit)

  return (
    <>
      <fog attach="fog" args={['#02050b', 28, 82]} />
      <ExhibitionCameraRig />
      <ExhibitionLighting />
      <ExhibitionHall />

      <group>
        {exhibitionExhibits.map((exhibit) => (
          <ExhibitBooth key={exhibit.id} exhibit={exhibit} />
        ))}
      </group>

      <ExhibitionScreens />
      <AmbientVisitors />

      <ContactShadows
        position={[0, 0.035, 0]}
        opacity={0.26}
        scale={52}
        blur={2.8}
        far={20}
        resolution={768}
        frames={1}
      />

      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onClick={() => selectExhibit(null, false)}
      >
        <planeGeometry args={[54, 40]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <ExhibitionEffects />
    </>
  )
}
