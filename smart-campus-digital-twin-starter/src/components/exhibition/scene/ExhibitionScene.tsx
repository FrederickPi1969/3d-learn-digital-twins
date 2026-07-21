import { ContactShadows } from '@react-three/drei'
import { exhibitionExhibits } from '@/data/exhibition'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import { AmbientVisitors } from './AmbientVisitors'
import { AnimatedMediaScreens } from './AnimatedMediaScreens'
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
      <fog attach="fog" args={['#f2f5f6', 44, 102]} />
      <ExhibitionCameraRig />
      <ExhibitionLighting />
      <ExhibitionHall />

      <group>
        {exhibitionExhibits.map((exhibit) => (
          <ExhibitBooth key={exhibit.id} exhibit={exhibit} />
        ))}
      </group>

      <AnimatedMediaScreens />
      <ExhibitionScreens />
      <AmbientVisitors />

      <ContactShadows
        position={[0, 0.035, 0]}
        opacity={0.2}
        scale={52}
        blur={3.4}
        far={18}
        resolution={768}
        frames={1}
        color="#647078"
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
