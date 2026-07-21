import { ContactShadows, Sparkles } from '@react-three/drei'
import { campusBuildings, getBuildingById } from '@/data/campus'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { BackdropCity } from './BackdropCity'
import { Building } from './Building'
import { BuildingInterior } from './BuildingInterior'
import { CameraRig } from './CameraRig'
import { CampusGround } from './CampusGround'
import { DataFlows } from './DataFlows'
import { DynamicEntities } from './DynamicEntities'
import { EnvironmentRig } from './EnvironmentRig'
import { NightLighting } from './NightLighting'
import { Roads } from './Roads'
import { SceneEffects } from './SceneEffects'
import { Trees } from './Trees'
import { WeatherSystem } from './WeatherSystem'

export function CampusScene() {
  const viewMode = useDigitalTwinStore((state) => state.viewMode)
  const selectedBuildingId = useDigitalTwinStore((state) => state.selectedBuildingId)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const selectedBuilding = getBuildingById(selectedBuildingId)

  return (
    <>
      <EnvironmentRig />
      <CameraRig />
      <BackdropCity />
      <CampusGround />

      {viewMode === 'campus' ? (
        <>
          <Roads />
          <Trees />
          {campusBuildings.map((building) => (
            <Building key={building.id} building={building} />
          ))}
          <DynamicEntities />
          <NightLighting />
          <DataFlows />
          <ContactShadows
            position={[0, 0.04, 0]}
            opacity={weatherKind === 'rain' ? 0.25 : 0.44}
            scale={46}
            blur={weatherKind === 'rain' ? 3.2 : 2.4}
            far={24}
            resolution={512}
            frames={1}
          />
        </>
      ) : (
        selectedBuilding && (
          <>
            <BuildingInterior building={selectedBuilding} />
            <ContactShadows
              position={[selectedBuilding.position[0], 0.04, selectedBuilding.position[1]]}
              opacity={0.5}
              scale={18}
              blur={2.2}
              far={25}
              resolution={512}
              frames={1}
            />
          </>
        )
      )}

      {weatherKind === 'clear' && (
        <Sparkles
          count={86}
          scale={[60, 20, 60]}
          position={[0, 8, 0]}
          size={1.15}
          speed={0.12}
          opacity={0.22}
          color="#66ddff"
        />
      )}

      <WeatherSystem />
      <SceneEffects />
    </>
  )
}
