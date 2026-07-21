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
      dpr={[1, 1.35]}
      shadows="soft"
      gl={{
        // SMAA is applied once in the post-process pass. Native MSAA here
        // duplicates that cost on high-density displays.
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      performance={{ min: 0.7 }}
      onCreated={({ gl, scene }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.86
        gl.shadowMap.enabled = true
        gl.shadowMap.type = THREE.PCFSoftShadowMap
        scene.background = new THREE.Color('#cfd7dc')
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
