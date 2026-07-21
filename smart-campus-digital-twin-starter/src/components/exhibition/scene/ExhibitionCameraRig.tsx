import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type CameraControlsImpl from 'camera-controls'
import * as THREE from 'three'
import { getExhibitById } from '@/data/exhibition'
import { useExhibitionStore } from '@/store/useExhibitionStore'

const OVERVIEW = {
  position: new THREE.Vector3(27, 20, 31),
  target: new THREE.Vector3(0, 2.1, 0),
}

const PRESETS = {
  entrance: {
    position: new THREE.Vector3(0, 5.6, 25.5),
    target: new THREE.Vector3(0, 2.1, -4.8),
  },
  'floor-screen': {
    position: new THREE.Vector3(0, 5.2, -7.4),
    target: new THREE.Vector3(0, 4.4, -17.1),
  },
  kiosk: {
    position: new THREE.Vector3(0, 4.55, -4.8),
    target: new THREE.Vector3(0, 4.3, -16.64),
  },
} as const

export function ExhibitionCameraRig() {
  const controlsRef = useRef<CameraControlsImpl>(null)
  const heldKeysRef = useRef(new Set<string>())
  const cameraPreset = useExhibitionStore((state) => state.cameraPreset)
  const cameraRequestNonce = useExhibitionStore((state) => state.cameraRequestNonce)
  const selectedExhibitId = useExhibitionStore((state) => state.selectedExhibitId)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    if (cameraPreset === 'overview') {
      void controls.setLookAt(
        OVERVIEW.position.x,
        OVERVIEW.position.y,
        OVERVIEW.position.z,
        OVERVIEW.target.x,
        OVERVIEW.target.y,
        OVERVIEW.target.z,
        true,
      )
      return
    }

    if (cameraPreset === 'entrance' || cameraPreset === 'floor-screen' || cameraPreset === 'kiosk') {
      const preset = PRESETS[cameraPreset]
      void controls.setLookAt(
        preset.position.x,
        preset.position.y,
        preset.position.z,
        preset.target.x,
        preset.target.y,
        preset.target.z,
        true,
      )
      return
    }

    const exhibit = getExhibitById(selectedExhibitId)
    if (!exhibit) return
    const front = new THREE.Vector3(Math.sin(exhibit.rotationY), 0, Math.cos(exhibit.rotationY))
    const side = new THREE.Vector3(front.z, 0, -front.x)
    const cameraPosition = new THREE.Vector3(...exhibit.position)
      .addScaledVector(front, 5.2)
      .addScaledVector(side, 1.1)
      .add(new THREE.Vector3(0, 3.2, 0))
    const target = new THREE.Vector3(...exhibit.position).add(new THREE.Vector3(0, 1.5, 0))
    void controls.setLookAt(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z,
      target.x,
      target.y,
      target.z,
      true,
    )
  }, [cameraPreset, cameraRequestNonce, selectedExhibitId])

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (!['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'].includes(event.code)) return
      event.preventDefault()
      heldKeysRef.current.add(event.code)
    }
    const onKeyUp = (event: KeyboardEvent) => heldKeysRef.current.delete(event.code)
    const clearKeys = () => heldKeysRef.current.clear()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearKeys)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearKeys)
    }
  }, [])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return
    const held = heldKeysRef.current
    const speed = (held.has('ShiftLeft') || held.has('ShiftRight') ? 11 : 4.8) * Math.min(delta, 0.05)
    const forward = (held.has('KeyW') ? 1 : 0) - (held.has('KeyS') ? 1 : 0)
    const strafe = (held.has('KeyD') ? 1 : 0) - (held.has('KeyA') ? 1 : 0)
    if (forward) void controls.forward(forward * speed, false)
    if (strafe) void controls.truck(strafe * speed, 0, false)
  })

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      smoothTime={0.62}
      draggingSmoothTime={0.12}
      maxSpeed={45}
      minDistance={2.6}
      maxDistance={62}
      minPolarAngle={0.22}
      maxPolarAngle={Math.PI / 2.04}
      truckSpeed={1.35}
      dollySpeed={0.72}
      azimuthRotateSpeed={0.62}
      polarRotateSpeed={0.62}
      dollyToCursor
    />
  )
}
