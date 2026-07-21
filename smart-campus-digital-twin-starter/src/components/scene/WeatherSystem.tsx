import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { getNightFactor } from '@/utils/environment'
import { seededNoise } from '@/utils/math'

const PARTICLE_COUNT = 12_000
const WEATHER_BOX_WIDTH = 64
const WEATHER_BOX_HEIGHT = 34

const particleVertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  varying float vSeed;
  varying float vOpacity;
  varying float vMode;

  uniform float uTime;
  uniform float uIntensity;
  uniform float uWind;
  uniform float uMode;
  uniform vec3 uCameraPosition;

  float wrapValue(float value, float size) {
    return mod(value + size * 0.5, size) - size * 0.5;
  }

  void main() {
    vec3 transformedPosition = position;
    float active = 1.0 - smoothstep(uIntensity - 0.035, uIntensity + 0.035, aSeed);

    if (uMode < 0.5) {
      float fallSpeed = mix(19.0, 34.0, aSeed);
      transformedPosition.y = mod(position.y - uTime * fallSpeed + 4.0, ${WEATHER_BOX_HEIGHT.toFixed(1)}) - 3.0;
      transformedPosition.x = wrapValue(position.x + uTime * uWind * 7.0 + position.y * uWind * 0.36, ${WEATHER_BOX_WIDTH.toFixed(1)});
      transformedPosition.z = wrapValue(position.z + uTime * uWind * 1.8, ${WEATHER_BOX_WIDTH.toFixed(1)});
    } else if (uMode < 1.5) {
      float fallSpeed = mix(1.3, 3.4, aSeed);
      transformedPosition.y = mod(position.y - uTime * fallSpeed + 4.0, ${WEATHER_BOX_HEIGHT.toFixed(1)}) - 3.0;
      transformedPosition.x = wrapValue(
        position.x + sin(uTime * (0.55 + aSeed) + aSeed * 19.0) * (1.2 + uWind * 2.0) + uTime * uWind * 1.6,
        ${WEATHER_BOX_WIDTH.toFixed(1)}
      );
      transformedPosition.z = wrapValue(
        position.z + cos(uTime * (0.46 + aSeed) + aSeed * 13.0) * 1.5,
        ${WEATHER_BOX_WIDTH.toFixed(1)}
      );
    } else {
      float drift = mix(2.0, 7.5, aSeed) * (0.25 + uWind);
      transformedPosition.x = wrapValue(position.x + uTime * drift, ${WEATHER_BOX_WIDTH.toFixed(1)});
      transformedPosition.z = wrapValue(position.z + sin(uTime * 0.45 + aSeed * 26.0) * 5.0, ${WEATHER_BOX_WIDTH.toFixed(1)});
      transformedPosition.y = 1.0 + mod(
        abs(position.y) * 0.62 + sin(uTime * 0.75 + aSeed * 31.0) * 2.4 + aSeed * 13.0,
        20.0
      );
    }

    transformedPosition.x += uCameraPosition.x;
    transformedPosition.z += uCameraPosition.z;

    vec4 viewPosition = modelViewMatrix * vec4(transformedPosition, 1.0);
    float perspective = clamp(260.0 / max(4.0, -viewPosition.z), 0.35, 4.0);
    float modeSize = uMode < 0.5 ? 13.0 : (uMode < 1.5 ? 6.2 : 15.0);
    gl_PointSize = aSize * modeSize * perspective;
    gl_Position = projectionMatrix * viewPosition;

    vSeed = aSeed;
    vOpacity = active;
    vMode = uMode;
  }
`

const particleFragmentShader = /* glsl */ `
  varying float vSeed;
  varying float vOpacity;
  varying float vMode;
  uniform float uNight;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float alpha = 0.0;
    vec3 color = vec3(1.0);

    if (vMode < 0.5) {
      float horizontal = 1.0 - smoothstep(0.025, 0.12, abs(centered.x));
      float vertical = 1.0 - smoothstep(0.22, 0.52, abs(centered.y));
      float head = 1.0 - smoothstep(-0.3, 0.5, centered.y);
      alpha = horizontal * vertical * head * (0.28 + uNight * 0.42);
      color = mix(vec3(0.50, 0.73, 0.88), vec3(0.77, 0.93, 1.0), uNight);
    } else if (vMode < 1.5) {
      float radius = length(centered);
      alpha = 1.0 - smoothstep(0.12, 0.5, radius);
      alpha *= 0.62 + 0.25 * sin(vSeed * 91.0);
      color = vec3(0.91, 0.96, 1.0);
    } else {
      float radius = length(centered * vec2(0.75, 1.0));
      alpha = 1.0 - smoothstep(0.04, 0.5, radius);
      alpha *= 0.18 + 0.18 * sin(vSeed * 83.0);
      color = mix(vec3(0.58, 0.35, 0.17), vec3(0.86, 0.59, 0.29), vSeed);
    }

    alpha *= vOpacity;
    if (alpha < 0.012) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

function WeatherParticles() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const intensity = useDigitalTwinStore((state) => state.weatherIntensity)
  const windSpeed = useDigitalTwinStore((state) => state.windSpeed)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const seeds = new Float32Array(PARTICLE_COUNT)
    const sizes = new Float32Array(PARTICLE_COUNT)

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const seed = seededNoise(index * 41 + 5)
      positions[index * 3] = (seededNoise(index * 13 + 2) - 0.5) * WEATHER_BOX_WIDTH
      positions[index * 3 + 1] = seededNoise(index * 17 + 7) * WEATHER_BOX_HEIGHT
      positions[index * 3 + 2] = (seededNoise(index * 29 + 11) - 0.5) * WEATHER_BOX_WIDTH
      seeds[index] = seed
      sizes[index] = 0.58 + seededNoise(index * 37 + 17) * 1.15
    }

    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    next.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    next.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    next.computeBoundingSphere()
    return next
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uWind: { value: 0 },
      uMode: { value: 0 },
      uNight: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
    }),
    [],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock, camera }) => {
    const material = materialRef.current
    if (!material) return
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uIntensity.value = intensity
    material.uniforms.uWind.value = windSpeed
    material.uniforms.uNight.value = getNightFactor(dayPhase)
    material.uniforms.uCameraPosition.value.copy(camera.position)
    material.uniforms.uMode.value = weatherKind === 'rain' ? 0 : weatherKind === 'snow' ? 1 : 2
  })

  if (weatherKind === 'clear') return null

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={25}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        depthTest
        blending={weatherKind === 'rain' ? THREE.AdditiveBlending : THREE.NormalBlending}
        toneMapped={false}
      />
    </points>
  )
}

const groundVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const groundFragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uMode;
  uniform float uNight;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float rippleField(vec2 uv) {
    vec2 grid = uv * vec2(36.0, 26.0);
    vec2 cell = floor(grid);
    vec2 local = fract(grid) - 0.5;
    float seed = hash(cell);
    float age = fract(uTime * (0.42 + seed * 0.55) + seed * 7.0);
    float radius = age * 0.46;
    float ring = 1.0 - smoothstep(0.015, 0.055, abs(length(local) - radius));
    return ring * (1.0 - smoothstep(0.45, 1.0, age)) * step(0.72, seed);
  }

  float noiseLayer(vec2 uv) {
    vec2 cell = floor(uv * 70.0);
    return hash(cell) * 0.65 + hash(cell * 0.37 + 9.0) * 0.35;
  }

  void main() {
    vec3 color = vec3(0.0);
    float alpha = 0.0;

    if (uMode < 0.5) {
      float ripples = rippleField(vUv);
      float sheen = pow(max(0.0, 1.0 - length(vUv - 0.5) * 1.25), 2.0);
      color = mix(vec3(0.04, 0.12, 0.18), vec3(0.20, 0.70, 0.92), ripples);
      alpha = (0.035 + sheen * 0.055 + ripples * 0.38) * uIntensity * (0.75 + uNight * 0.45);
    } else if (uMode < 1.5) {
      float grain = noiseLayer(vUv + sin(vUv.yx * 25.0) * 0.003);
      float accumulation = smoothstep(0.38, 0.82, grain);
      color = vec3(0.78, 0.89, 0.96);
      alpha = accumulation * uIntensity * 0.17;
    } else {
      float band = sin((vUv.x * 2.3 + vUv.y) * 24.0 - uTime * 1.9);
      float grain = noiseLayer(vUv + vec2(uTime * 0.025, 0.0));
      float wisp = smoothstep(0.5, 0.96, band * 0.5 + grain * 0.7);
      color = vec3(0.62, 0.37, 0.17);
      alpha = wisp * uIntensity * 0.16;
    }

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

function WeatherGroundOverlay() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const intensity = useDigitalTwinStore((state) => state.weatherIntensity)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uMode: { value: 0 },
      uNight: { value: 0 },
    }),
    [],
  )

  useFrame(({ clock }) => {
    const material = materialRef.current
    if (!material) return
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uIntensity.value = intensity
    material.uniforms.uNight.value = getNightFactor(dayPhase)
    material.uniforms.uMode.value = weatherKind === 'rain' ? 0 : weatherKind === 'snow' ? 1 : 2
  })

  if (weatherKind === 'clear') return null

  return (
    <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
      <planeGeometry args={[48, 34, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={groundVertexShader}
        fragmentShader={groundFragmentShader}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        toneMapped={false}
      />
    </mesh>
  )
}

const cloudVertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  varying float vOpacity;
  uniform float uTime;
  uniform float uWind;
  uniform vec3 uCameraPosition;

  void main() {
    vec3 p = position;
    p.x = mod(p.x + uTime * (0.8 + uWind * 2.8) + 42.0, 84.0) - 42.0;
    p.z += sin(uTime * 0.08 + aSeed * 17.0) * 1.8;
    p.x += uCameraPosition.x;
    p.z += uCameraPosition.z;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * clamp(250.0 / max(5.0, -viewPosition.z), 0.8, 3.0);
    gl_Position = projectionMatrix * viewPosition;
    vOpacity = 0.45 + aSeed * 0.4;
  }
`

const cloudFragmentShader = /* glsl */ `
  varying float vOpacity;
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float radius = length(p * vec2(0.62, 1.0));
    float alpha = (1.0 - smoothstep(0.16, 0.5, radius)) * vOpacity * uOpacity;
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`

function CloudDeck() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const intensity = useDigitalTwinStore((state) => state.weatherIntensity)
  const windSpeed = useDigitalTwinStore((state) => state.windSpeed)
  const geometry = useMemo(() => {
    const count = 84
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const sizes = new Float32Array(count)
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (seededNoise(index * 11 + 3) - 0.5) * 84
      positions[index * 3 + 1] = 17 + seededNoise(index * 17 + 7) * 9
      positions[index * 3 + 2] = (seededNoise(index * 23 + 11) - 0.5) * 78
      seeds[index] = seededNoise(index * 31 + 17)
      sizes[index] = 48 + seededNoise(index * 37 + 19) * 72
    }
    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    next.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    next.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    return next
  }, [])
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWind: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      uColor: { value: new THREE.Color('#62778a') },
      uOpacity: { value: 0 },
    }),
    [],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock, camera }) => {
    const material = materialRef.current
    if (!material) return
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uWind.value = windSpeed
    material.uniforms.uCameraPosition.value.copy(camera.position)
    material.uniforms.uOpacity.value = weatherKind === 'clear' ? 0.025 : 0.13 + intensity * 0.22
    material.uniforms.uColor.value.set(
      weatherKind === 'sandstorm' ? '#8a5b34' : weatherKind === 'snow' ? '#b7c6d1' : '#526779',
    )
  })

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={-10}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={cloudVertexShader}
        fragmentShader={cloudFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </points>
  )
}

export function WeatherSystem() {
  return (
    <>
      <CloudDeck />
      <WeatherParticles />
      <WeatherGroundOverlay />
    </>
  )
}
