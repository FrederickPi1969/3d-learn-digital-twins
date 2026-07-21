import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges, Html, useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import type { BuildingConfig } from '@/types/digitalTwin'
import { HEALTH_COLORS, healthLabel } from '@/utils/color'
import { getNightFactor } from '@/utils/environment'
import { dampFactor, seededNoise } from '@/utils/math'

interface FacadeTextures {
  colorMap: THREE.CanvasTexture
  emissiveMap: THREE.CanvasTexture
}

function configureFacadeTexture(texture: THREE.CanvasTexture, building: BuildingConfig) {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(
    Math.max(1.7, building.size[0] / 2.15),
    Math.max(2.4, building.size[1] / 3.0),
  )
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
}

function createFacadeTextures(building: BuildingConfig): FacadeTextures {
  const colorCanvas = document.createElement('canvas')
  const emissiveCanvas = document.createElement('canvas')
  colorCanvas.width = 256
  colorCanvas.height = 256
  emissiveCanvas.width = 256
  emissiveCanvas.height = 256

  const colorContext = colorCanvas.getContext('2d')
  const emissiveContext = emissiveCanvas.getContext('2d')
  if (!colorContext || !emissiveContext) {
    throw new Error('Canvas 2D context is unavailable.')
  }

  const facadeGradient = colorContext.createLinearGradient(0, 0, 256, 256)
  facadeGradient.addColorStop(0, '#0a2034')
  facadeGradient.addColorStop(0.48, '#102b43')
  facadeGradient.addColorStop(1, '#061424')
  colorContext.fillStyle = facadeGradient
  colorContext.fillRect(0, 0, 256, 256)

  emissiveContext.fillStyle = '#000000'
  emissiveContext.fillRect(0, 0, 256, 256)

  colorContext.strokeStyle = 'rgba(126, 191, 221, 0.28)'
  colorContext.lineWidth = 2
  for (let x = 0; x <= 256; x += 32) {
    colorContext.beginPath()
    colorContext.moveTo(x, 0)
    colorContext.lineTo(x, 256)
    colorContext.stroke()
  }
  for (let y = 0; y <= 256; y += 24) {
    colorContext.beginPath()
    colorContext.moveTo(0, y)
    colorContext.lineTo(256, y)
    colorContext.stroke()
  }

  const accent = new THREE.Color(building.accent)
  const accentCss = `rgb(${Math.round(accent.r * 255)}, ${Math.round(accent.g * 255)}, ${Math.round(accent.b * 255)})`

  for (let row = 0; row < 10; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const seed = seededNoise(building.floors * 101 + row * 23 + column * 41)
      const x = 6 + column * 32
      const y = 5 + row * 24
      const lit = seed > 0.18
      const warm = seed > 0.69

      colorContext.fillStyle = lit ? (warm ? '#8f815f' : '#1c5b7c') : '#0b2335'
      colorContext.globalAlpha = lit ? 0.82 : 0.72
      colorContext.fillRect(x, y, 20, 13)

      if (lit) {
        emissiveContext.shadowBlur = 12
        emissiveContext.shadowColor = warm ? '#ffd994' : building.accent
        emissiveContext.fillStyle = warm ? '#ffd08a' : accentCss
        emissiveContext.globalAlpha = warm ? 0.93 : 0.86
        emissiveContext.fillRect(x + 1, y + 1, 18, 11)
      }
    }
  }

  colorContext.globalAlpha = 1
  emissiveContext.globalAlpha = 1
  emissiveContext.shadowBlur = 0

  for (const stripX of [1, 126, 253]) {
    emissiveContext.fillStyle = accentCss
    emissiveContext.globalAlpha = 0.78
    emissiveContext.fillRect(stripX, 0, stripX === 126 ? 3 : 2, 256)
  }
  emissiveContext.globalAlpha = 1

  const colorMap = new THREE.CanvasTexture(colorCanvas)
  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas)
  configureFacadeTexture(colorMap, building)
  configureFacadeTexture(emissiveMap, building)
  return { colorMap, emissiveMap }
}

function StatusBeacon({ building }: { building: BuildingConfig }) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const color = HEALTH_COLORS[building.health]

  useFrame(({ clock }) => {
    if (!materialRef.current) return
    materialRef.current.opacity = 0.55 + Math.sin(clock.elapsedTime * 3.2) * 0.3
  })

  return (
    <group position={[building.size[0] * 0.25, building.size[1] / 2 + 0.55, 0]}>
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial
          ref={materialRef}
          color={color}
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export function Building({ building }: { building: BuildingConfig }) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const stripMaterialRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const hoveredBuildingId = useDigitalTwinStore((state) => state.hoveredBuildingId)
  const showLabels = useDigitalTwinStore((state) => state.showLabels)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const weatherIntensity = useDigitalTwinStore((state) => state.weatherIntensity)
  const setHoveredBuilding = useDigitalTwinStore((state) => state.setHoveredBuilding)
  const enterBuilding = useDigitalTwinStore((state) => state.enterBuilding)
  const hovered = hoveredBuildingId === building.id
  const textures = useMemo(() => createFacadeTextures(building), [building])
  const weatherFacadeColor = useMemo(
    () =>
      new THREE.Color(
        weatherKind === 'snow'
          ? '#d8e4e7'
          : weatherKind === 'sandstorm'
            ? '#9a8069'
            : '#a9ccdf',
      ),
    [weatherKind],
  )

  useCursor(hovered, 'pointer', 'default')

  useEffect(
    () => () => {
      textures.colorMap.dispose()
      textures.emissiveMap.dispose()
    },
    [textures],
  )

  useFrame((_, delta) => {
    const alpha = dampFactor(8, delta)
    if (groupRef.current) {
      const scale = hovered ? 1.035 : 1
      targetScale.set(scale, scale, scale)
      groupRef.current.scale.lerp(targetScale, alpha)
    }

    const night = getNightFactor(dayPhase)
    const weatherDimming = weatherKind === 'sandstorm' ? weatherIntensity * 0.45 : 0
    if (materialRef.current) {
      const targetIntensity = Math.max(
        0.12,
        0.18 + night * 2.05 + (hovered ? 1.15 : 0) - weatherDimming,
      )
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetIntensity,
        alpha,
      )
      const targetRoughness = weatherKind === 'rain' ? 0.2 : 0.34
      materialRef.current.roughness = THREE.MathUtils.lerp(
        materialRef.current.roughness,
        targetRoughness,
        alpha,
      )
      materialRef.current.color.lerp(weatherFacadeColor, alpha)
    }

    stripMaterialRefs.current.forEach((material) => {
      if (!material) return
      material.opacity = THREE.MathUtils.lerp(
        material.opacity,
        0.16 + night * 0.82 + (hovered ? 0.3 : 0),
        alpha,
      )
    })
  })

  const [width, height, depth] = building.size
  const stripPositions: readonly [number, number, number][] = [
    [-width / 2 - 0.025, 0, -depth / 2 - 0.025],
    [width / 2 + 0.025, 0, -depth / 2 - 0.025],
    [-width / 2 - 0.025, 0, depth / 2 + 0.025],
    [width / 2 + 0.025, 0, depth / 2 + 0.025],
  ]

  return (
    <group
      ref={groupRef}
      position={[building.position[0], height / 2, building.position[1]]}
      rotation={[0, building.rotation ?? 0, 0]}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHoveredBuilding(building.id)
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        setHoveredBuilding(null)
      }}
      onClick={(event) => {
        event.stopPropagation()
        enterBuilding(building.id, Math.max(1, Math.ceil(building.floors / 2)))
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          ref={materialRef}
          map={textures.colorMap}
          emissiveMap={textures.emissiveMap}
          emissive="#ffffff"
          emissiveIntensity={2.1}
          color="#a9ccdf"
          roughness={0.34}
          metalness={0.48}
        />
        <Edges
          color={hovered ? '#d8fbff' : building.accent}
          threshold={20}
          scale={1.003}
        />
      </mesh>

      {stripPositions.map((position, index) => (
        <mesh key={index} position={position}>
          <boxGeometry args={[0.06, height * 0.96, 0.06]} />
          <meshBasicMaterial
            ref={(material) => {
              stripMaterialRefs.current[index] = material
            }}
            color={building.accent}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
      ))}

      <mesh position={[0, height / 2 + 0.08, 0]}>
        <boxGeometry args={[width + 0.16, 0.12, depth + 0.16]} />
        <meshBasicMaterial color={building.accent} toneMapped={false} />
      </mesh>

      <mesh position={[0, -height / 2 + 0.07, 0]}>
        <boxGeometry args={[width + 0.12, 0.08, depth + 0.12]} />
        <meshBasicMaterial
          color={building.accent}
          transparent
          opacity={0.42}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[-width * 0.22, height / 2 + 0.43, 0]}>
        <cylinderGeometry args={[0.045, 0.07, 0.7, 8]} />
        <meshStandardMaterial
          color="#9feeff"
          emissive={building.accent}
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>

      <StatusBeacon building={building} />

      {showLabels && (
        <Html
          position={[0, height / 2 + 1.0, 0]}
          center
          distanceFactor={16}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className={`building-label building-label--${building.health}`}>
            <span className="building-label__code">{building.code}</span>
            <span className="building-label__name">{building.name}</span>
            <span className="building-label__meta">
              {building.occupancy}/{building.capacity} 人 · {healthLabel(building.health)}
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}
