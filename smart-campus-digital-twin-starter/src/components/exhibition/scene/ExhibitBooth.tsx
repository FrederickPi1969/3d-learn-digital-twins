import { useEffect, useMemo, useRef, useState } from 'react'
import { Html, Image, Sparkles, Text, useAnimations, useCursor, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group, Mesh } from 'three'
import { includedExhibitionAssets } from '@/data/exhibitionAssets'
import { useExhibitionStore } from '@/store/useExhibitionStore'
import type { ExhibitConfig } from '@/types/exhibition'

interface ExhibitBoothProps {
  exhibit: ExhibitConfig
}

function createGenerativeArtTexture(exhibit: ExhibitConfig) {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  const background = context.createLinearGradient(0, 0, canvas.width, canvas.height)
  background.addColorStop(0, '#04101d')
  background.addColorStop(0.55, '#0a2b4a')
  background.addColorStop(1, '#060812')
  context.fillStyle = background
  context.fillRect(0, 0, canvas.width, canvas.height)

  const seed = exhibit.boothNumber * 9187
  const random = (index: number) => {
    const value = Math.sin(seed + index * 12.9898) * 43758.5453
    return value - Math.floor(value)
  }

  context.globalCompositeOperation = 'screen'
  for (let index = 0; index < 32; index += 1) {
    const x = random(index * 4) * canvas.width
    const y = random(index * 4 + 1) * canvas.height
    const radius = 18 + random(index * 4 + 2) * 140
    const glow = context.createRadialGradient(x, y, 0, x, y, radius)
    glow.addColorStop(0, `${exhibit.accent}aa`)
    glow.addColorStop(0.35, `${exhibit.accent}22`)
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    context.fillStyle = glow
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }

  context.globalCompositeOperation = 'source-over'
  context.strokeStyle = `${exhibit.accent}88`
  context.lineWidth = 2
  for (let index = 0; index < 14; index += 1) {
    context.beginPath()
    const y = 48 + index * 31
    for (let step = 0; step <= 96; step += 1) {
      const x = (step / 96) * canvas.width
      const wave = Math.sin(step * 0.23 + index * 0.8 + exhibit.variant) * (10 + index * 0.6)
      const drift = Math.sin(step * 0.07 + index) * 14
      const pointY = y + wave + drift
      if (step === 0) context.moveTo(x, pointY)
      else context.lineTo(x, pointY)
    }
    context.stroke()
  }

  context.fillStyle = 'rgba(226,250,255,0.92)'
  context.font = '600 22px Inter, sans-serif'
  context.letterSpacing = '4px'
  context.fillText(`NO.${String(exhibit.boothNumber).padStart(2, '0')}`, 34, 43)
  context.fillStyle = 'rgba(134,205,229,0.78)'
  context.font = '500 13px Inter, sans-serif'
  context.fillText('GENERATIVE FIELD STUDY', 34, 67)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.anisotropy = 4
  return texture
}

function ProceduralPainting({ exhibit }: { exhibit: ExhibitConfig }) {
  const texture = useMemo(() => createGenerativeArtTexture(exhibit), [exhibit])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={[0, 2.28, 0.1]}>
      <planeGeometry args={[2.72, 1.78]} />
      <meshStandardMaterial
        map={texture}
        emissive="#ffffff"
        emissiveMap={texture}
        emissiveIntensity={0.38}
        roughness={0.39}
        metalness={0.04}
      />
    </mesh>
  )
}

function ImagePainting({ url }: { url: string }) {
  return <Image url={url} position={[0, 2.28, 0.1]} scale={[2.72, 1.78]} toneMapped={false} />
}

function PaintingDisplay({ exhibit }: { exhibit: ExhibitConfig }) {
  return (
    <group>
      <mesh position={[0, 2.28, -0.015]} castShadow>
        <boxGeometry args={[3.14, 2.2, 0.19]} />
        <meshPhysicalMaterial color="#f7f7f5" roughness={0.35} metalness={0.04} clearcoat={0.34} />
      </mesh>
      <mesh position={[0, 2.28, 0.09]}>
        <boxGeometry args={[2.89, 1.95, 0.035]} />
        <meshStandardMaterial color="#252d33" roughness={0.22} metalness={0.62} />
      </mesh>
      <mesh position={[0, 1.22, 0.095]}>
        <boxGeometry args={[1.65, 0.025, 0.035]} />
        <meshBasicMaterial color={exhibit.accent} toneMapped={false} />
      </mesh>
      {exhibit.imageUrl ? <ImagePainting url={exhibit.imageUrl} /> : <ProceduralPainting exhibit={exhibit} />}
      <spotLight
        position={[0, 5.35, 2.25]}
        target-position={[0, 2.1, 0]}
        color="#fff7eb"
        intensity={7.8}
        distance={8}
        angle={0.34}
        penumbra={0.82}
        decay={2}
      />
    </group>
  )
}

function KineticSculpture({ exhibit }: { exhibit: ExhibitConfig }) {
  const groupRef = useRef<Group>(null)
  const innerRef = useRef<Mesh>(null)

  useFrame(({ clock }, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * (0.13 + exhibit.variant * 0.012)
    if (innerRef.current) {
      innerRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.45 + exhibit.variant) * 0.34
      innerRef.current.rotation.z += delta * 0.11
    }
  })

  const material = (
    <meshPhysicalMaterial
      color={new THREE.Color(exhibit.accent).lerp(new THREE.Color('#f5f5f2'), 0.22)}
      emissive={exhibit.accent}
      emissiveIntensity={0.08}
      roughness={0.17 + (exhibit.variant % 3) * 0.08}
      metalness={0.78}
      clearcoat={1}
      clearcoatRoughness={0.17}
    />
  )

  return (
    <group ref={groupRef} position={[0, 1.48, 0]}>
      {exhibit.variant % 4 === 0 && (
        <mesh castShadow scale={0.72}>
          <torusKnotGeometry args={[0.74, 0.21, 150, 24, 2, 3]} />
          {material}
        </mesh>
      )}
      {exhibit.variant % 4 === 1 && (
        <group>
          {[0, 1, 2].map((index) => (
            <mesh
              key={index}
              ref={index === 1 ? innerRef : undefined}
              rotation={[index * 0.62, index * 0.8, index * 0.34]}
              castShadow
            >
              <torusGeometry args={[0.72 + index * 0.14, 0.075, 18, 96]} />
              {material}
            </mesh>
          ))}
        </group>
      )}
      {exhibit.variant % 4 === 2 && (
        <mesh ref={innerRef} castShadow scale={[0.86, 1.15, 0.86]}>
          <icosahedronGeometry args={[0.9, 3]} />
          {material}
        </mesh>
      )}
      {exhibit.variant % 4 === 3 && (
        <group>
          <mesh ref={innerRef} castShadow>
            <dodecahedronGeometry args={[0.9, 1]} />
            {material}
          </mesh>
          <mesh scale={1.22}>
            <icosahedronGeometry args={[0.9, 1]} />
            <meshBasicMaterial color={exhibit.accent} wireframe transparent opacity={0.24} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function cloneMaterial(material: THREE.Material): THREE.Material {
  const clone = material.clone()
  if (clone instanceof THREE.MeshStandardMaterial) {
    clone.envMapIntensity = 1.18
    clone.roughness = Math.max(0.12, clone.roughness)
  }
  clone.needsUpdate = true
  return clone
}

function ImportedModel({ exhibit }: { exhibit: ExhibitConfig }) {
  const model = useGLTF(exhibit.modelUrl ?? '/models/exhibition/stanford-bunny.glb', '/draco/')
  const clone = useMemo(() => model.scene.clone(true), [model.scene])
  const groupRef = useRef<Group>(null)
  const { actions } = useAnimations(model.animations, clone)

  const normalization = useMemo(() => {
    clone.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const targetHeight = exhibit.modelTargetHeight ?? 1.72
    const scale = targetHeight / Math.max(size.y, 0.001)
    return {
      scale,
      position: [-center.x * scale, 0.61 - box.min.y * scale, -center.z * scale] as const,
    }
  }, [clone, exhibit.modelTargetHeight])

  useEffect(() => {
    const disposableMaterials: THREE.Material[] = []
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true
      if (exhibit.preserveModelMaterials) {
        if (Array.isArray(object.material)) {
          const materials = object.material.map((source) => cloneMaterial(source))
          object.material = materials
          disposableMaterials.push(...materials)
        } else {
          const material = cloneMaterial(object.material)
          object.material = material
          disposableMaterials.push(material)
        }
      } else {
        const material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(exhibit.accent).lerp(new THREE.Color('#f8f8f5'), 0.52),
          metalness: 0.36,
          roughness: 0.2,
          clearcoat: 1,
          clearcoatRoughness: 0.14,
          emissive: new THREE.Color(exhibit.accent),
          emissiveIntensity: 0.035,
        })
        object.material = material
        disposableMaterials.push(material)
      }
    })
    return () => disposableMaterials.forEach((material) => material.dispose())
  }, [clone, exhibit.accent, exhibit.preserveModelMaterials])

  useEffect(() => {
    const activeActions = Object.values(actions).filter((action): action is THREE.AnimationAction => Boolean(action))
    activeActions.forEach((action) => action.reset().fadeIn(0.25).play())
    return () => {
      activeActions.forEach((action) => action.fadeOut(0.15).stop())
    }
  }, [actions])

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.105
  })

  return (
    <group ref={groupRef} rotation={exhibit.modelRotation ?? [0, 0, 0]}>
      <group position={normalization.position} scale={normalization.scale}>
        <primitive object={clone} />
      </group>
    </group>
  )
}

function RelicDisplay({ exhibit }: { exhibit: ExhibitConfig }) {
  const points = useMemo(
    () => [
      new THREE.Vector2(0.03, 0),
      new THREE.Vector2(0.42, 0.08),
      new THREE.Vector2(0.5, 0.35),
      new THREE.Vector2(0.36, 0.66),
      new THREE.Vector2(0.44, 0.98),
      new THREE.Vector2(0.28, 1.24),
      new THREE.Vector2(0.2, 1.36),
      new THREE.Vector2(0.18, 1.48),
    ],
    [],
  )

  return (
    <group>
      <mesh position={[0, 1.05, 0]} castShadow>
        <latheGeometry args={[points, 48]} />
        <meshPhysicalMaterial
          color={exhibit.variant % 2 === 0 ? '#bf8d55' : '#7898aa'}
          roughness={0.31}
          metalness={exhibit.variant % 2 === 0 ? 0.52 : 0.18}
          clearcoat={0.58}
        />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[1.75, 2.5, 1.75]} />
        <meshPhysicalMaterial
          color="#e8fbff"
          transparent
          opacity={0.13}
          roughness={0.03}
          metalness={0.02}
          transmission={0.34}
          thickness={0.08}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <boxGeometry args={[1.82, 0.045, 1.82]} />
        <meshBasicMaterial color={exhibit.accent} transparent opacity={0.38} toneMapped={false} />
      </mesh>
    </group>
  )
}

function HologramDisplay({ exhibit }: { exhibit: ExhibitConfig }) {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.22
    groupRef.current.position.y = 1.35 + Math.sin(clock.elapsedTime * 0.9 + exhibit.variant) * 0.12
  })

  return (
    <group>
      <group ref={groupRef} position={[0, 1.35, 0]}>
        <mesh>
          {exhibit.variant % 2 === 0 ? (
            <torusKnotGeometry args={[0.62, 0.15, 110, 18, 3, 5]} />
          ) : (
            <icosahedronGeometry args={[0.83, 2]} />
          )}
          <meshBasicMaterial
            color={exhibit.accent}
            wireframe
            transparent
            opacity={0.72}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={0.84}>
          <sphereGeometry args={[0.72, 24, 16]} />
          <meshBasicMaterial
            color={exhibit.accent}
            transparent
            opacity={0.07}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
      <Sparkles count={16} scale={[2.2, 2.8, 2.2]} position={[0, 1.4, 0]} size={2.1} speed={0.35} color={exhibit.accent} opacity={0.56} />
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.85, 1.05, 0.22, 48]} />
        <meshPhysicalMaterial color="#e9edef" metalness={0.28} roughness={0.25} clearcoat={0.5} emissive={exhibit.accent} emissiveIntensity={0.08} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color={exhibit.accent} intensity={4.4} distance={4.2} decay={2} />
    </group>
  )
}

function Pedestal({ exhibit }: { exhibit: ExhibitConfig }) {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.28, 0.56, 48]} />
        <meshPhysicalMaterial color="#f1f2f1" metalness={0.1} roughness={0.32} clearcoat={0.4} clearcoatRoughness={0.24} />
      </mesh>
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[1.04, 1.04, 0.045, 48]} />
        <meshBasicMaterial color={exhibit.accent} transparent opacity={0.78} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.14, 1.22, 64]} />
        <meshBasicMaterial color="#b4c0c5" transparent opacity={0.42} />
      </mesh>
    </group>
  )
}

export function ExhibitBooth({ exhibit }: ExhibitBoothProps) {
  const selectedExhibitId = useExhibitionStore((state) => state.selectedExhibitId)
  const hoveredExhibitId = useExhibitionStore((state) => state.hoveredExhibitId)
  const activeZone = useExhibitionStore((state) => state.activeZone)
  const showLabels = useExhibitionStore((state) => state.showLabels)
  const selectExhibit = useExhibitionStore((state) => state.selectExhibit)
  const setHoveredExhibit = useExhibitionStore((state) => state.setHoveredExhibit)
  const [localHovered, setLocalHovered] = useState(false)

  const selected = selectedExhibitId === exhibit.id
  const hovered = hoveredExhibitId === exhibit.id || localHovered
  const filteredOut = activeZone !== 'ALL' && activeZone !== exhibit.zone
  useCursor(localHovered, 'pointer', 'auto')

  return (
    <group
      position={exhibit.position}
      rotation={[0, exhibit.rotationY, 0]}
      visible={!filteredOut || selected}
      onPointerEnter={(event) => {
        event.stopPropagation()
        setLocalHovered(true)
        setHoveredExhibit(exhibit.id)
      }}
      onPointerLeave={(event) => {
        event.stopPropagation()
        setLocalHovered(false)
        setHoveredExhibit(null)
      }}
      onClick={(event) => {
        event.stopPropagation()
        selectExhibit(exhibit.id, true)
      }}
    >
      {exhibit.displayKind === 'painting' ? (
        <PaintingDisplay exhibit={exhibit} />
      ) : (
        <>
          <Pedestal exhibit={exhibit} />
          {exhibit.displayKind === 'procedural-sculpture' && <KineticSculpture exhibit={exhibit} />}
          {exhibit.displayKind === 'imported-model' && <ImportedModel exhibit={exhibit} />}
          {exhibit.displayKind === 'relic' && <RelicDisplay exhibit={exhibit} />}
          {exhibit.displayKind === 'hologram' && <HologramDisplay exhibit={exhibit} />}
        </>
      )}

      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.28, selected ? 1.42 : 1.34, 64]} />
        <meshBasicMaterial
          color={exhibit.accent}
          transparent
          opacity={selected ? 0.8 : hovered ? 0.45 : 0.1}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {showLabels && (
        <Html
          position={[0, exhibit.displayKind === 'painting' ? 0.72 : 2.96, 0.88]}
          center
          distanceFactor={9}
          style={{ pointerEvents: 'none' }}
        >
          <div className={`exhibit-world-label ${selected ? 'is-selected' : ''}`} style={{ '--exhibit-accent': exhibit.accent } as React.CSSProperties}>
            <span>{exhibit.zone}-{String(exhibit.boothNumber).padStart(2, '0')}</span>
            <strong>{exhibit.title}</strong>
          </div>
        </Html>
      )}

      {selected && (
        <Text
          position={[0, 0.74, 1.18]}
          fontSize={0.18}
          color="#2d3940"
          anchorX="center"
          anchorY="middle"
        >
          SELECTED · {exhibit.title}
        </Text>
      )}
    </group>
  )
}

for (const asset of includedExhibitionAssets) {
  useGLTF.preload(asset.url, '/draco/')
}
