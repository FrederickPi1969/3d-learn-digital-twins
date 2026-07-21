import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getBuildingById } from '@/data/campus'
import { searchlightBuildingIds, streetLightPositions } from '@/data/environment'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { getNightFactor } from '@/utils/environment'
import { dampFactor } from '@/utils/math'

function StreetLights() {
  const poleRef = useRef<THREE.InstancedMesh>(null)
  const bulbRef = useRef<THREE.InstancedMesh>(null)
  const poolRef = useRef<THREE.InstancedMesh>(null)
  const bulbMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const poolMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const lightRefs = useRef<(THREE.PointLight | null)[]>([])
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const enabled = useDigitalTwinStore((state) => state.streetLightsEnabled)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)

  const physicalLightPositions = useMemo(
    () => streetLightPositions.filter((_, index) => index % 4 === 0).slice(0, 16),
    [],
  )

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const poolQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))

    streetLightPositions.forEach(([x, z], index) => {
      dummy.position.set(x, 0.92, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      poleRef.current?.setMatrixAt(index, dummy.matrix)

      dummy.position.set(x, 1.88, z)
      dummy.updateMatrix()
      bulbRef.current?.setMatrixAt(index, dummy.matrix)

      dummy.position.set(x, 0.115, z)
      dummy.quaternion.copy(poolQuaternion)
      dummy.scale.set(1.15, 1.15, 1.15)
      dummy.updateMatrix()
      poolRef.current?.setMatrixAt(index, dummy.matrix)
    })

    ;[poleRef.current, bulbRef.current, poolRef.current].forEach((mesh) => {
      if (!mesh) return
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    })
  }, [])

  useFrame((_, delta) => {
    const night = getNightFactor(dayPhase)
    const target = enabled ? night : 0
    const alpha = dampFactor(4, delta)
    if (bulbMaterialRef.current) {
      bulbMaterialRef.current.opacity = THREE.MathUtils.lerp(
        bulbMaterialRef.current.opacity,
        0.28 + target * 0.72,
        alpha,
      )
    }
    if (poolMaterialRef.current) {
      const wetBoost = weatherKind === 'rain' ? 1.3 : 1
      poolMaterialRef.current.opacity = THREE.MathUtils.lerp(
        poolMaterialRef.current.opacity,
        target * 0.11 * wetBoost,
        alpha,
      )
    }
    lightRefs.current.forEach((light) => {
      if (!light) return
      light.intensity = THREE.MathUtils.lerp(light.intensity, target * 13.5, alpha)
    })
  })

  const count = streetLightPositions.length

  return (
    <group>
      <instancedMesh ref={poleRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, 1.84, 7]} />
        <meshStandardMaterial color="#263d4a" metalness={0.72} roughness={0.38} />
      </instancedMesh>
      <instancedMesh ref={bulbRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.105, 10, 8]} />
        <meshBasicMaterial
          ref={bulbMaterialRef}
          color="#bceeff"
          transparent
          opacity={1}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh ref={poolRef} args={[undefined, undefined, count]} renderOrder={7}>
        <circleGeometry args={[1.2, 24]} />
        <meshBasicMaterial
          ref={poolMaterialRef}
          color="#58cfff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
      {physicalLightPositions.map(([x, z], index) => (
        <pointLight
          key={`${x}-${z}`}
          ref={(light) => {
            lightRefs.current[index] = light
          }}
          position={[x, 1.82, z]}
          color="#8fdfff"
          intensity={0}
          distance={7.4}
          decay={2}
        />
      ))}
    </group>
  )
}

interface SearchlightAnchor {
  id: string
  position: [number, number, number]
  speed: number
  phase: number
}

function Searchlights() {
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const enabled = useDigitalTwinStore((state) => state.searchlightsEnabled)
  const groupRefs = useRef<(THREE.Group | null)[]>([])
  const beamMaterialRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([])

  const anchors = useMemo<SearchlightAnchor[]>(
    () =>
      searchlightBuildingIds.flatMap((id, index) => {
        const building = getBuildingById(id)
        if (!building) return []
        return [
          {
            id,
            position: [
              building.position[0],
              building.size[1] + 0.28,
              building.position[1],
            ] as [number, number, number],
            speed: 0.11 + index * 0.025,
            phase: index * 1.37,
          },
        ]
      }),
    [],
  )

  useFrame(({ clock }, delta) => {
    const targetOpacity = enabled ? getNightFactor(dayPhase) * 0.095 : 0
    const alpha = dampFactor(3.5, delta)
    anchors.forEach((anchor, index) => {
      const group = groupRefs.current[index]
      if (group) group.rotation.y = clock.elapsedTime * anchor.speed + anchor.phase
      const material = beamMaterialRefs.current[index]
      if (material) {
        material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, alpha)
      }
    })
  })

  return (
    <group>
      {anchors.map((anchor, index) => (
        <group
          key={anchor.id}
          ref={(group) => {
            groupRefs.current[index] = group
          }}
          position={anchor.position}
        >
          <mesh>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshBasicMaterial color="#d7f7ff" toneMapped={false} />
          </mesh>
          <group rotation={[0, 0, 0.66]}>
            <mesh position={[0, -6.0, 0]} renderOrder={12}>
              <coneGeometry args={[2.1, 12, 32, 1, true]} />
              <meshBasicMaterial
                ref={(material) => {
                  beamMaterialRefs.current[index] = material
                }}
                color="#75dcff"
                transparent
                opacity={0}
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

export function NightLighting() {
  return (
    <>
      <StreetLights />
      <Searchlights />
    </>
  )
}
