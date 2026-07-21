import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { resolveDayPhase } from '@/utils/environment'
import { dampFactor, lerp, seededNoise } from '@/utils/math'

interface EnvironmentTarget {
  background: string
  fog: string
  fogNear: number
  fogFar: number
  ambient: number
  hemisphere: number
  sun: number
  sunColor: string
  skyColor: string
  groundColor: string
  accent: number
  night: number
}

function getTargetEnvironment(
  dayPhase: ReturnType<typeof resolveDayPhase>,
  weatherKind: ReturnType<typeof useDigitalTwinStore.getState>['weatherKind'],
  intensity: number,
): EnvironmentTarget {
  const targets: Record<ReturnType<typeof resolveDayPhase>, EnvironmentTarget> = {
    day: {
      background: '#6f9fbd',
      fog: '#88a8b8',
      fogNear: 52,
      fogFar: 128,
      ambient: 0.72,
      hemisphere: 1.38,
      sun: 3.1,
      sunColor: '#fff1cf',
      skyColor: '#a7dfff',
      groundColor: '#18302d',
      accent: 0.35,
      night: 0,
    },
    dusk: {
      background: '#15253d',
      fog: '#1a2c43',
      fogNear: 38,
      fogFar: 104,
      ambient: 0.46,
      hemisphere: 1.08,
      sun: 2.25,
      sunColor: '#ffb86b',
      skyColor: '#6d7fa8',
      groundColor: '#09151a',
      accent: 0.68,
      night: 0.58,
    },
    night: {
      background: '#020611',
      fog: '#07101d',
      fogNear: 31,
      fogFar: 88,
      ambient: 0.26,
      hemisphere: 0.82,
      sun: 1.35,
      sunColor: '#7ab9ff',
      skyColor: '#174371',
      groundColor: '#01040a',
      accent: 1,
      night: 1,
    },
  }

  const base = targets[dayPhase]
  if (weatherKind === 'sandstorm') {
    return {
      ...base,
      background: '#4d3825',
      fog: '#6a4a2c',
      fogNear: lerp(base.fogNear, 8, intensity),
      fogFar: lerp(base.fogFar, 44, intensity),
      sun: lerp(base.sun, 1.1, intensity),
      sunColor: '#d69a55',
      skyColor: '#a56735',
      groundColor: '#24170f',
      accent: base.accent * (1 - intensity * 0.45),
    }
  }

  if (weatherKind === 'rain') {
    return {
      ...base,
      background: dayPhase === 'day' ? '#344b5d' : '#050b14',
      fog: dayPhase === 'day' ? '#4d6573' : '#081522',
      fogNear: lerp(base.fogNear, 22, intensity),
      fogFar: lerp(base.fogFar, 67, intensity),
      ambient: base.ambient * 0.82,
      hemisphere: base.hemisphere * 0.82,
      sun: base.sun * 0.62,
      skyColor: '#4f718d',
      accent: Math.min(1.2, base.accent + intensity * 0.12),
    }
  }

  if (weatherKind === 'snow') {
    return {
      ...base,
      background: dayPhase === 'day' ? '#a9bdc7' : '#162333',
      fog: dayPhase === 'day' ? '#bac8cf' : '#1c2a3b',
      fogNear: lerp(base.fogNear, 29, intensity),
      fogFar: lerp(base.fogFar, 76, intensity),
      ambient: base.ambient * 1.08,
      hemisphere: base.hemisphere * 1.1,
      sun: base.sun * 0.76,
      skyColor: '#d5e9f2',
      groundColor: '#182027',
    }
  }

  return base
}

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const skyFragmentShader = /* glsl */ `
  varying vec3 vWorldPosition;
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uGroundColor;
  uniform float uNight;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec3 direction = normalize(vWorldPosition);
    float horizon = smoothstep(-0.08, 0.38, direction.y);
    vec3 color = mix(uGroundColor, uHorizonColor, smoothstep(-0.32, 0.02, direction.y));
    color = mix(color, uTopColor, horizon);

    float atmosphericBand = exp(-abs(direction.y) * 16.0) * (0.03 + 0.05 * sin(uTime * 0.05));
    color += uHorizonColor * atmosphericBand;

    float starCell = hash(floor(direction.xz * 720.0));
    float star = step(0.9974, starCell) * smoothstep(0.08, 0.55, direction.y) * uNight;
    color += vec3(0.68, 0.84, 1.0) * star * 0.8;

    gl_FragColor = vec4(color, 1.0);
  }
`

function SkyDome({ target }: { target: EnvironmentTarget }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTopColor: { value: new THREE.Color('#020611') },
      uHorizonColor: { value: new THREE.Color('#174371') },
      uGroundColor: { value: new THREE.Color('#01040a') },
      uNight: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  )

  useFrame(({ clock }, delta) => {
    const material = materialRef.current
    if (!material) return
    const alpha = dampFactor(1.8, delta)
    material.uniforms.uTopColor.value.lerp(new THREE.Color(target.background), alpha)
    material.uniforms.uHorizonColor.value.lerp(new THREE.Color(target.skyColor), alpha)
    material.uniforms.uGroundColor.value.lerp(new THREE.Color(target.groundColor), alpha)
    material.uniforms.uNight.value = THREE.MathUtils.lerp(
      material.uniforms.uNight.value,
      target.night,
      alpha,
    )
    material.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh scale={1} renderOrder={-1000} frustumCulled={false}>
      <sphereGeometry args={[92, 32, 18]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={skyVertexShader}
        fragmentShader={skyFragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}

const starPositions = (() => {
  const positions = new Float32Array(760 * 3)
  for (let index = 0; index < 760; index += 1) {
    const theta = seededNoise(index * 17 + 3) * Math.PI * 2
    const phi = Math.acos(0.08 + seededNoise(index * 23 + 11) * 0.88)
    const radius = 74 + seededNoise(index * 31 + 7) * 8
    positions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius
    positions[index * 3 + 1] = Math.cos(phi) * radius
    positions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius
  }
  return positions
})()

function StarField({ nightFactor }: { nightFactor: number }) {
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const geometry = useMemo(() => {
    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    return next
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }, delta) => {
    if (!materialRef.current) return
    materialRef.current.opacity = THREE.MathUtils.lerp(
      materialRef.current.opacity,
      nightFactor * 0.86,
      dampFactor(2.3, delta),
    )
    materialRef.current.size = 0.2 + Math.sin(clock.elapsedTime * 0.8) * 0.025
  })

  return (
    <points geometry={geometry} rotation={[0, 0.2, 0]} frustumCulled={false}>
      <pointsMaterial
        ref={materialRef}
        color="#d5ecff"
        size={0.22}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

function Moon({ nightFactor }: { nightFactor: number }) {
  const coreRef = useRef<THREE.MeshBasicMaterial>(null)
  const haloRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((_, delta) => {
    const alpha = dampFactor(2.2, delta)
    if (coreRef.current) {
      coreRef.current.opacity = THREE.MathUtils.lerp(
        coreRef.current.opacity,
        nightFactor * 0.95,
        alpha,
      )
    }
    if (haloRef.current) {
      haloRef.current.opacity = THREE.MathUtils.lerp(
        haloRef.current.opacity,
        nightFactor * 0.13,
        alpha,
      )
    }
  })

  return (
    <group position={[-31, 27, -38]}>
      <mesh>
        <sphereGeometry args={[1.25, 32, 24]} />
        <meshBasicMaterial
          ref={coreRef}
          color="#d8e8ff"
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.25, 24, 18]} />
        <meshBasicMaterial
          ref={haloRef}
          color="#65aaff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export function EnvironmentRig() {
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const hemisphereRef = useRef<THREE.HemisphereLight>(null)
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const accentARef = useRef<THREE.PointLight>(null)
  const accentBRef = useRef<THREE.PointLight>(null)
  const lightningRef = useRef<THREE.PointLight>(null)
  const nextLightningAtRef = useRef(4.8)
  const lightningLevelRef = useRef(0)
  const backgroundRef = useRef<THREE.Color>(null)
  const fogRef = useRef<THREE.Fog>(null)

  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const weatherIntensity = useDigitalTwinStore((state) => state.weatherIntensity)
  const lightningEnabled = useDigitalTwinStore((state) => state.lightningEnabled)
  const resolvedDayPhase = resolveDayPhase(dayPhase)
  const target = useMemo(
    () => getTargetEnvironment(resolvedDayPhase, weatherKind, weatherIntensity),
    [resolvedDayPhase, weatherIntensity, weatherKind],
  )

  const targetColors = useMemo(
    () => ({
      background: new THREE.Color(target.background),
      fog: new THREE.Color(target.fog),
      sky: new THREE.Color(target.skyColor),
      ground: new THREE.Color(target.groundColor),
      sun: new THREE.Color(target.sunColor),
    }),
    [target.background, target.fog, target.groundColor, target.skyColor, target.sunColor],
  )

  useFrame(({ clock }, delta) => {
    const alpha = dampFactor(1.65, delta)
    backgroundRef.current?.lerp(targetColors.background, alpha)

    if (fogRef.current) {
      fogRef.current.color.lerp(targetColors.fog, alpha)
      fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, target.fogNear, alpha)
      fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, target.fogFar, alpha)
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        target.ambient,
        alpha,
      )
    }
    if (hemisphereRef.current) {
      hemisphereRef.current.intensity = THREE.MathUtils.lerp(
        hemisphereRef.current.intensity,
        target.hemisphere,
        alpha,
      )
      hemisphereRef.current.color.lerp(targetColors.sky, alpha)
      hemisphereRef.current.groundColor.lerp(targetColors.ground, alpha)
    }
    if (sunRef.current) {
      sunRef.current.intensity = THREE.MathUtils.lerp(sunRef.current.intensity, target.sun, alpha)
      sunRef.current.color.lerp(targetColors.sun, alpha)
    }
    if (accentARef.current) {
      accentARef.current.intensity = THREE.MathUtils.lerp(
        accentARef.current.intensity,
        54 * target.accent,
        alpha,
      )
    }
    if (accentBRef.current) {
      accentBRef.current.intensity = THREE.MathUtils.lerp(
        accentBRef.current.intensity,
        42 * target.accent,
        alpha,
      )
    }

    const rainLightningActive =
      weatherKind === 'rain' && weatherIntensity > 0.44 && lightningEnabled
    if (rainLightningActive && clock.elapsedTime >= nextLightningAtRef.current) {
      lightningLevelRef.current = 1
      nextLightningAtRef.current = clock.elapsedTime + 4.5 + Math.random() * 8.5
    }
    lightningLevelRef.current = Math.max(0, lightningLevelRef.current - delta * 3.4)
    if (lightningRef.current) {
      const pulse = lightningLevelRef.current > 0.62 ? 1 : lightningLevelRef.current * 0.25
      lightningRef.current.intensity = pulse * 540 * weatherIntensity
    }
  })

  return (
    <>
      <color ref={backgroundRef} attach="background" args={['#020611']} />
      <fog ref={fogRef} attach="fog" args={['#07101d', 31, 88]} />
      <SkyDome target={target} />
      <StarField nightFactor={target.night} />
      <Moon nightFactor={target.night} />

      <ambientLight ref={ambientRef} intensity={target.ambient} />
      <hemisphereLight
        ref={hemisphereRef}
        args={[target.skyColor, target.groundColor, target.hemisphere]}
      />
      <directionalLight
        ref={sunRef}
        position={[16, 28, 18]}
        intensity={target.sun}
        color={target.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={78}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-bias={-0.00018}
      />
      <pointLight
        ref={accentARef}
        position={[-18, 9, -10]}
        color="#1377ff"
        intensity={54 * target.accent}
        distance={44}
        decay={2}
      />
      <pointLight
        ref={accentBRef}
        position={[18, 7, 10]}
        color="#00d9ff"
        intensity={42 * target.accent}
        distance={40}
        decay={2}
      />
      <pointLight
        ref={lightningRef}
        position={[0, 33, -4]}
        color="#d9efff"
        intensity={0}
        distance={110}
        decay={1.2}
      />
    </>
  )
}
