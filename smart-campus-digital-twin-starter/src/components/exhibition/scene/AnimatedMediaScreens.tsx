import { RoundedBox, Text } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Euler, Vector3Tuple } from 'three'
import { useExhibitionStore } from '@/store/useExhibitionStore'

interface ManagedVideoTexture {
  video: HTMLVideoElement
  texture: THREE.VideoTexture
}

function createVideoTexture(src: string, poster?: string): ManagedVideoTexture {
  const video = document.createElement('video')
  video.src = src
  video.loop = true
  video.muted = true
  video.autoplay = true
  video.playsInline = true
  video.preload = 'metadata'
  video.crossOrigin = 'anonymous'
  if (poster) video.poster = poster
  video.setAttribute('aria-hidden', 'true')
  video.style.position = 'fixed'
  video.style.width = '1px'
  video.style.height = '1px'
  video.style.opacity = '0'
  video.style.pointerEvents = 'none'
  video.style.left = '-10px'
  video.style.bottom = '-10px'

  const texture = new THREE.VideoTexture(video)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.anisotropy = 1
  texture.name = `exhibition-video:${src}`
  return { video, texture }
}

function useManagedVideoTexture(src: string, poster?: string) {
  const managed = useMemo(() => createVideoTexture(src, poster), [poster, src])

  useEffect(() => {
    document.body.appendChild(managed.video)
    const tryPlay = () => {
      void managed.video.play().catch(() => {
        // Muted autoplay is normally permitted. If the browser still blocks it,
        // the next pointer interaction or visibility change retries playback.
      })
    }
    const resumeOnInteraction = () => tryPlay()
    const handleVisibility = () => {
      if (document.hidden) managed.video.pause()
      else tryPlay()
    }

    managed.video.addEventListener('canplay', tryPlay)
    document.addEventListener('pointerdown', resumeOnInteraction, { once: true })
    document.addEventListener('visibilitychange', handleVisibility)
    managed.video.load()
    tryPlay()

    return () => {
      managed.video.pause()
      managed.video.removeEventListener('canplay', tryPlay)
      document.removeEventListener('pointerdown', resumeOnInteraction)
      document.removeEventListener('visibilitychange', handleVisibility)
      managed.video.removeAttribute('src')
      managed.video.load()
      managed.video.remove()
      managed.texture.dispose()
    }
  }, [managed])

  return managed.texture
}

interface AnimatedMediaScreenProps {
  position: Vector3Tuple
  rotation?: Euler | Vector3Tuple
  size: readonly [number, number]
  texture: THREE.VideoTexture
  title: string
  code: string
  lightColor: string
  frameColor?: string
  brightness: number
}

function AnimatedMediaScreen({
  position,
  rotation = [0, 0, 0],
  size,
  texture,
  title,
  code,
  lightColor,
  frameColor = '#f5f6f6',
  brightness,
}: AnimatedMediaScreenProps) {
  const [width, height] = size
  const brightnessColor = useMemo(
    () => new THREE.Color(brightness, brightness, brightness),
    [brightness],
  )

  return (
    <group position={position} rotation={rotation as Euler}>
      <RoundedBox args={[width + 0.62, height + 0.78, 0.36]} radius={0.24} smoothness={8} position={[0, 0, -0.13]} castShadow receiveShadow>
        <meshPhysicalMaterial color={frameColor} roughness={0.31} metalness={0.09} clearcoat={0.48} clearcoatRoughness={0.22} />
      </RoundedBox>
      <RoundedBox args={[width + 0.22, height + 0.22, 0.13]} radius={0.12} smoothness={6} position={[0, 0.08, 0.08]}>
        <meshStandardMaterial color="#1a2229" roughness={0.19} metalness={0.68} />
      </RoundedBox>
      <mesh position={[0, 0.08, 0.16]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} color={brightnessColor} toneMapped={false} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.18, 0.17]}>
        <boxGeometry args={[width * 0.82, 0.035, 0.028]} />
        <meshBasicMaterial color={lightColor} toneMapped={false} />
      </mesh>
      <Text
        position={[-width / 2 + 0.06, -height / 2 - 0.36, 0.18]}
        fontSize={0.13}
        letterSpacing={0.05}
        color="#3f4a51"
        anchorX="left"
        anchorY="middle"
      >
        {code} · {title}
      </Text>
      <pointLight position={[0, 0, 1.15]} color={lightColor} intensity={2.5 * brightness} distance={4.8} decay={2} />
    </group>
  )
}

function MediaScreenContent({ brightness }: { brightness: number }) {
  const aurora = useManagedVideoTexture('/media/exhibition/aurora-field.mp4', '/media/exhibition/aurora-field.jpg')
  const matrix = useManagedVideoTexture('/media/exhibition/motion-matrix.mp4', '/media/exhibition/motion-matrix.jpg')
  const chromatic = useManagedVideoTexture('/media/exhibition/chromatic-flux.mp4', '/media/exhibition/chromatic-flux.jpg')

  return (
    <>
      <AnimatedMediaScreen
        position={[-24.62, 4.25, -5.6]}
        rotation={[0, Math.PI / 2, 0]}
        size={[5.8, 3.28]}
        texture={aurora}
        title="Aurora Field"
        code="MEDIA WALL A-07"
        lightColor="#5bdcf2"
        brightness={brightness}
      />
      <AnimatedMediaScreen
        position={[24.62, 4.25, 5.3]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[5.8, 3.28]}
        texture={matrix}
        title="Motion Matrix"
        code="MEDIA WALL C-04"
        lightColor="#49bde8"
        brightness={brightness}
      />
      <AnimatedMediaScreen
        position={[0, 6.48, 16.92]}
        rotation={[0, Math.PI, 0]}
        size={[8.8, 1.48]}
        texture={chromatic}
        title="Chromatic Flux / Now Showing"
        code="ENTRANCE MEDIA RIBBON"
        lightColor="#8d72f3"
        brightness={brightness}
      />
      <AnimatedMediaScreen
        position={[0, 2.58, -0.26]}
        rotation={[0, Math.PI, 0]}
        size={[6.65, 3.25]}
        texture={aurora}
        title="Live Generative Archive"
        code="CENTRAL MEDIA 02"
        lightColor="#56d9d0"
        brightness={brightness}
      />
    </>
  )
}

export function AnimatedMediaScreens() {
  const enabled = useExhibitionStore((state) => state.mediaScreensEnabled)
  const brightness = useExhibitionStore((state) => state.mediaScreenBrightness)
  return enabled ? <MediaScreenContent brightness={brightness} /> : null
}
