import { Suspense } from 'react'
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { ExhibitionScene } from './ExhibitionScene'

export function ExhibitionCanvas() {
  return (
    <Canvas
      className="exhibition-canvas"
      camera={{ position: [27, 18, 31], fov: 45, near: 0.08, far: 160 }}
      dpr={[1, 1.75]}
      shadows="soft"
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      performance={{ min: 0.55 }}
      onCreated={({ gl, scene }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.15
        gl.shadowMap.enabled = true
        gl.shadowMap.type = THREE.PCFSoftShadowMap
        scene.background = new THREE.Color('#02040a')
      }}
    >
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <Suspense fallback={null}>
        <ExhibitionScene />
      </Suspense>
    </Canvas>
  )
}
