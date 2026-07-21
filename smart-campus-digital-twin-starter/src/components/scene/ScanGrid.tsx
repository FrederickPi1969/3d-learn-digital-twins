import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMPUS_SIZE } from '@/data/campus'

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uMinorColor;
  uniform vec3 uMajorColor;

  float gridLine(float value, float density, float width) {
    float cell = fract(value * density);
    float distanceToLine = min(cell, 1.0 - cell);
    return 1.0 - smoothstep(0.0, width, distanceToLine);
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float radius = length(centered);

    float minorGrid = max(
      gridLine(vUv.x, 44.0, 0.055),
      gridLine(vUv.y, 30.0, 0.055)
    );
    float majorGrid = max(
      gridLine(vUv.x, 11.0, 0.025),
      gridLine(vUv.y, 7.5, 0.025)
    );

    float scanRadius = mod(uTime * 0.075, 0.78);
    float scanRing = 1.0 - smoothstep(0.0, 0.018, abs(radius - scanRadius));
    float diagonalPulse = 0.5 + 0.5 * sin((centered.x + centered.y) * 35.0 - uTime * 2.2);
    float edgeFade = 1.0 - smoothstep(0.28, 0.72, radius);

    vec3 color = uMinorColor * minorGrid * 0.26;
    color += uMajorColor * majorGrid * 0.42;
    color += uMajorColor * scanRing * 0.62;
    color += uMinorColor * diagonalPulse * 0.035;

    float alpha = (minorGrid * 0.11 + majorGrid * 0.18 + scanRing * 0.28 + 0.025) * edgeFade;
    gl_FragColor = vec4(color, alpha);
  }
`

export function ScanGrid() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMinorColor: { value: new THREE.Color('#0d6fb6') },
      uMajorColor: { value: new THREE.Color('#42d9ff') },
    }),
    [],
  )

  useFrame(({ clock }) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[CAMPUS_SIZE.width + 5, CAMPUS_SIZE.depth + 5, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}
