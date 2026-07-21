import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { vegetationInstances, type VegetationInstance } from '@/data/environment'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { getNightFactor } from '@/utils/environment'
import { dampFactor } from '@/utils/math'

interface CompiledWindShader {
  uniforms: Record<string, { value: number }>
}

function useWindMaterial(
  materialRef: React.RefObject<THREE.MeshStandardMaterial | null>,
  amplitude: number,
) {
  const shaderRef = useRef<CompiledWindShader | null>(null)
  const windSpeed = useDigitalTwinStore((state) => state.windSpeed)
  const motionEnabled = useDigitalTwinStore((state) => state.vegetationMotionEnabled)

  useEffect(() => {
    const material = materialRef.current
    if (!material) return

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = { value: 0 }
      shader.uniforms.uWindAmplitude = { value: amplitude }
      shader.uniforms.uWindSpeed = { value: 0.38 }
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform float uWindTime;
          uniform float uWindAmplitude;
          uniform float uWindSpeed;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          #ifdef USE_INSTANCING
            float instanceSeed = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
          #else
            float instanceSeed = 0.0;
          #endif
          float crownWeight = smoothstep(-0.48, 0.72, position.y);
          float primaryWave = sin(uWindTime * (0.75 + uWindSpeed * 1.85) + instanceSeed);
          float secondaryWave = cos(uWindTime * 1.21 + instanceSeed * 1.73 + position.y * 2.0);
          transformed.x += (primaryWave + secondaryWave * 0.34) * uWindAmplitude * crownWeight;
          transformed.z += cos(uWindTime * 0.63 + instanceSeed * 1.31) * uWindAmplitude * 0.54 * crownWeight;`,
        )
      shaderRef.current = shader as CompiledWindShader
    }
    material.customProgramCacheKey = () => `campus-vegetation-wind-${amplitude}`
    material.needsUpdate = true

    return () => {
      material.onBeforeCompile = () => undefined
    }
  }, [amplitude, materialRef])

  useFrame(({ clock }) => {
    const shader = shaderRef.current
    if (!shader) return
    shader.uniforms.uWindTime.value = clock.elapsedTime
    shader.uniforms.uWindAmplitude.value = motionEnabled ? amplitude : 0
    shader.uniforms.uWindSpeed.value = windSpeed
  })
}

function setInstanceColor(
  mesh: THREE.InstancedMesh,
  index: number,
  instance: VegetationInstance,
  palette: readonly string[],
) {
  const paletteIndex = Math.min(palette.length - 1, Math.floor(instance.tone * palette.length))
  mesh.setColorAt(index, new THREE.Color(palette[paletteIndex]))
}

function VegetationMeshes({ instances }: { instances: readonly VegetationInstance[] }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const deciduousRef = useRef<THREE.InstancedMesh>(null)
  const coniferRef = useRef<THREE.InstancedMesh>(null)
  const shrubRef = useRef<THREE.InstancedMesh>(null)
  const deciduousMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const coniferMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const shrubMaterialRef = useRef<THREE.MeshStandardMaterial>(null)

  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const weatherIntensity = useDigitalTwinStore((state) => state.weatherIntensity)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)

  const trees = useMemo(
    () => instances.filter((instance) => instance.species !== 'shrub'),
    [instances],
  )
  const deciduous = useMemo(
    () => instances.filter((instance) => instance.species === 'deciduous'),
    [instances],
  )
  const conifers = useMemo(
    () => instances.filter((instance) => instance.species === 'conifer'),
    [instances],
  )
  const shrubs = useMemo(
    () => instances.filter((instance) => instance.species === 'shrub'),
    [instances],
  )

  useWindMaterial(deciduousMaterialRef, 0.095)
  useWindMaterial(coniferMaterialRef, 0.055)
  useWindMaterial(shrubMaterialRef, 0.045)

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()

    if (trunkRef.current) {
      trunkRef.current.count = trees.length
      trees.forEach((instance, index) => {
        const [x, z] = instance.position
        dummy.position.set(x, 0.45 * instance.scale, z)
        dummy.rotation.set(0, instance.rotation, 0)
        dummy.scale.set(instance.scale, instance.scale, instance.scale)
        dummy.updateMatrix()
        trunkRef.current?.setMatrixAt(index, dummy.matrix)
        if (trunkRef.current) {
          setInstanceColor(trunkRef.current, index, instance, ['#30251e', '#443126', '#583b27'])
        }
      })
      trunkRef.current.instanceMatrix.needsUpdate = true
      if (trunkRef.current.instanceColor) trunkRef.current.instanceColor.needsUpdate = true
      trunkRef.current.computeBoundingSphere()
    }

    if (deciduousRef.current) {
      deciduousRef.current.count = deciduous.length
      deciduous.forEach((instance, index) => {
        const [x, z] = instance.position
        dummy.position.set(x, 1.14 * instance.scale, z)
        dummy.rotation.set(0, instance.rotation, 0)
        dummy.scale.set(instance.scale, instance.scale * 1.2, instance.scale)
        dummy.updateMatrix()
        deciduousRef.current?.setMatrixAt(index, dummy.matrix)
        if (deciduousRef.current) {
          setInstanceColor(deciduousRef.current, index, instance, [
            '#0a735f',
            '#0c8a6c',
            '#119d76',
            '#0b695d',
          ])
        }
      })
      deciduousRef.current.instanceMatrix.needsUpdate = true
      if (deciduousRef.current.instanceColor) deciduousRef.current.instanceColor.needsUpdate = true
      deciduousRef.current.computeBoundingSphere()
    }

    if (coniferRef.current) {
      coniferRef.current.count = conifers.length
      conifers.forEach((instance, index) => {
        const [x, z] = instance.position
        dummy.position.set(x, 1.05 * instance.scale, z)
        dummy.rotation.set(0, instance.rotation, 0)
        dummy.scale.set(instance.scale, instance.scale, instance.scale)
        dummy.updateMatrix()
        coniferRef.current?.setMatrixAt(index, dummy.matrix)
        if (coniferRef.current) {
          setInstanceColor(coniferRef.current, index, instance, [
            '#07564d',
            '#087064',
            '#0b7f69',
          ])
        }
      })
      coniferRef.current.instanceMatrix.needsUpdate = true
      if (coniferRef.current.instanceColor) coniferRef.current.instanceColor.needsUpdate = true
      coniferRef.current.computeBoundingSphere()
    }

    if (shrubRef.current) {
      shrubRef.current.count = shrubs.length
      shrubs.forEach((instance, index) => {
        const [x, z] = instance.position
        dummy.position.set(x, 0.27 * instance.scale, z)
        dummy.rotation.set(0, instance.rotation, 0)
        dummy.scale.set(instance.scale, instance.scale * 0.72, instance.scale)
        dummy.updateMatrix()
        shrubRef.current?.setMatrixAt(index, dummy.matrix)
        if (shrubRef.current) {
          setInstanceColor(shrubRef.current, index, instance, [
            '#08705d',
            '#0a8469',
            '#0e966f',
          ])
        }
      })
      shrubRef.current.instanceMatrix.needsUpdate = true
      if (shrubRef.current.instanceColor) shrubRef.current.instanceColor.needsUpdate = true
      shrubRef.current.computeBoundingSphere()
    }
  }, [conifers, deciduous, shrubs, trees])

  useFrame((_, delta) => {
    const night = getNightFactor(dayPhase)
    const snowBlend = weatherKind === 'snow' ? weatherIntensity * 0.72 : 0
    const dustBlend = weatherKind === 'sandstorm' ? weatherIntensity * 0.5 : 0
    const alpha = dampFactor(1.8, delta)

    const updateCrownMaterial = (
      material: THREE.MeshStandardMaterial | null,
      baseColor: string,
      baseEmissive: string,
    ) => {
      if (!material) return
      const targetColor = new THREE.Color(baseColor)
      targetColor.lerp(new THREE.Color('#dce8e5'), snowBlend)
      targetColor.lerp(new THREE.Color('#795332'), dustBlend)
      material.color.lerp(targetColor, alpha)
      material.emissive.lerp(new THREE.Color(baseEmissive), alpha)
      material.emissiveIntensity = THREE.MathUtils.lerp(
        material.emissiveIntensity,
        0.08 + night * 0.22,
        alpha,
      )
    }

    updateCrownMaterial(deciduousMaterialRef.current, '#0b8a6c', '#064e49')
    updateCrownMaterial(coniferMaterialRef.current, '#08645b', '#043e3c')
    updateCrownMaterial(shrubMaterialRef.current, '#0c8068', '#06483f')
  })

  const maxCount = Math.max(1, instances.length)

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, maxCount]} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.135, 0.9, 7]} />
        <meshStandardMaterial vertexColors color="#4a3325" roughness={0.98} />
      </instancedMesh>

      <instancedMesh ref={deciduousRef} args={[undefined, undefined, maxCount]} castShadow>
        <icosahedronGeometry args={[0.55, 2]} />
        <meshStandardMaterial
          ref={deciduousMaterialRef}
          vertexColors
          color="#0b8a6c"
          emissive="#064e49"
          emissiveIntensity={0.2}
          roughness={0.86}
        />
      </instancedMesh>

      <instancedMesh ref={coniferRef} args={[undefined, undefined, maxCount]} castShadow>
        <coneGeometry args={[0.58, 1.55, 9, 3]} />
        <meshStandardMaterial
          ref={coniferMaterialRef}
          vertexColors
          color="#08645b"
          emissive="#043e3c"
          emissiveIntensity={0.18}
          roughness={0.9}
        />
      </instancedMesh>

      <instancedMesh ref={shrubRef} args={[undefined, undefined, maxCount]} castShadow>
        <icosahedronGeometry args={[0.38, 1]} />
        <meshStandardMaterial
          ref={shrubMaterialRef}
          vertexColors
          color="#0c8068"
          emissive="#06483f"
          emissiveIntensity={0.16}
          roughness={0.91}
        />
      </instancedMesh>
    </group>
  )
}

export function Trees() {
  const density = useDigitalTwinStore((state) => state.vegetationDensity)
  const visibleInstances = useMemo(
    () => vegetationInstances.slice(0, Math.round(vegetationInstances.length * density)),
    [density],
  )

  return <VegetationMeshes instances={visibleInstances} />
}
