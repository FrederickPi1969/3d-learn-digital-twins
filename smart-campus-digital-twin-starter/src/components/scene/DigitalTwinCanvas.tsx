import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import * as THREE from 'three'
import { CampusScene } from './CampusScene'

export function DigitalTwinCanvas() {
  return (
    <Canvas
      className="digital-twin-canvas"
      camera={{ position: [31, 23, 35], fov: 39, near: 0.1, far: 180 }}
      dpr={[1, 1.8]}
      shadows="soft"
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      performance={{ min: 0.55 }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
        gl.shadowMap.enabled = true
        gl.shadowMap.type = THREE.PCFSoftShadowMap
      }}
    >
      <AdaptiveDpr />
      <AdaptiveEvents />
      <Suspense fallback={null}>
        <CampusScene />
      </Suspense>
    </Canvas>
  )
}
