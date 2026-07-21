import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { getNightFactor } from '@/utils/environment'
import { dampFactor, seededNoise } from '@/utils/math'

const blocks = Array.from({ length: 180 }, (_, index) => {
  const column = index % 18
  const row = Math.floor(index / 18)
  const x = -42 + column * 4.8 + (seededNoise(index * 5) - 0.5) * 1.1
  const z = -30 + row * 6.2 + (seededNoise(index * 7) - 0.5) * 1.1
  const insideCampus = Math.abs(x) < 25 && Math.abs(z) < 18
  const height = 0.7 + seededNoise(index * 11) * 3.8
  return { x, z, height, insideCampus }
}).filter((block) => !block.insideCampus)

function BackdropWindows() {
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const geometry = useMemo(() => {
    const positions: number[] = []
    blocks.forEach((block, blockIndex) => {
      const windowCount = 1 + Math.floor(seededNoise(blockIndex * 47 + 3) * 3)
      for (let index = 0; index < windowCount; index += 1) {
        positions.push(
          block.x + (seededNoise(blockIndex * 71 + index * 13) - 0.5) * 1.4,
          0.2 + seededNoise(blockIndex * 73 + index * 17) * Math.max(0.5, block.height),
          block.z + (seededNoise(blockIndex * 79 + index * 19) - 0.5) * 1.5,
        )
      }
    })
    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return next
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }, delta) => {
    if (!materialRef.current) return
    const night = getNightFactor(dayPhase)
    const flicker = 0.9 + Math.sin(clock.elapsedTime * 0.7) * 0.06
    materialRef.current.opacity = THREE.MathUtils.lerp(
      materialRef.current.opacity,
      night * 0.74 * flicker,
      dampFactor(2, delta),
    )
  })

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color="#9edcff"
        size={0.17}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

export function BackdropCity() {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const targetColor = useMemo(
    () =>
      new THREE.Color(
        weatherKind === 'sandstorm'
          ? '#17100c'
          : getNightFactor(dayPhase) > 0.5
            ? '#050b13'
            : '#13232c',
      ),
    [dayPhase, weatherKind],
  )

  useFrame((_, delta) => {
    const material = materialRef.current
    if (!material) return
    const night = getNightFactor(dayPhase)
    const alpha = dampFactor(1.6, delta)
    material.color.lerp(targetColor, alpha)
    material.emissiveIntensity = THREE.MathUtils.lerp(
      material.emissiveIntensity,
      0.1 + night * 0.42,
      alpha,
    )
  })

  return (
    <group>
      <Instances limit={blocks.length} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#07101b"
          emissive="#071a2a"
          emissiveIntensity={0.35}
          roughness={0.95}
        />
        {blocks.map((block, index) => (
          <Instance
            key={index}
            position={[block.x, block.height / 2 - 0.3, block.z]}
            scale={[
              2.0 + seededNoise(index * 13) * 1.6,
              block.height,
              2.2 + seededNoise(index * 17) * 1.8,
            ]}
          />
        ))}
      </Instances>
      <BackdropWindows />
    </group>
  )
}
