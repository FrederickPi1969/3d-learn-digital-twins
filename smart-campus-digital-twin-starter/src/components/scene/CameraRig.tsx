import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MapControls } from '@react-three/drei'
import * as THREE from 'three'
import type { MapControls as MapControlsImpl } from 'three-stdlib'
import { getBuildingById } from '@/data/campus'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { dampFactor } from '@/utils/math'

const CAMPUS_CAMERA_POSITION = new THREE.Vector3(31, 23, 35)
const CAMPUS_CAMERA_TARGET = new THREE.Vector3(0, 2.2, 0)

export function CameraRig() {
  const controlsRef = useRef<MapControlsImpl>(null)
  const transitioningRef = useRef(true)
  const { camera, performance } = useThree()
  const viewMode = useDigitalTwinStore((state) => state.viewMode)
  const selectedBuildingId = useDigitalTwinStore((state) => state.selectedBuildingId)
  const cameraResetNonce = useDigitalTwinStore((state) => state.cameraResetNonce)
  const cameraOrbitDelta = useDigitalTwinStore((state) => state.cameraOrbitDelta)
  const building = getBuildingById(selectedBuildingId)
  const appliedOrbitDeltaRef = useRef(cameraOrbitDelta)

  const destination = useMemo(() => {
    if (viewMode !== 'building' || !building) {
      return {
        position: CAMPUS_CAMERA_POSITION.clone(),
        target: CAMPUS_CAMERA_TARGET.clone(),
      }
    }

    const [width, height, depth] = building.size
    const orbitRadius = Math.max(width, depth) * 2.0 + 7.5
    return {
      position: new THREE.Vector3(
        building.position[0] + orbitRadius,
        Math.max(8, height * 0.72 + 5),
        building.position[1] + orbitRadius * 0.84,
      ),
      target: new THREE.Vector3(
        building.position[0],
        Math.min(height * 0.46, 7.0),
        building.position[1],
      ),
    }
  }, [building, viewMode])

  useEffect(() => {
    transitioningRef.current = true
    if (controlsRef.current) controlsRef.current.enabled = false
  }, [cameraResetNonce, destination])

  useEffect(() => {
    const orbitSteps = cameraOrbitDelta - appliedOrbitDeltaRef.current
    appliedOrbitDeltaRef.current = cameraOrbitDelta
    const controls = controlsRef.current
    if (!controls || !orbitSteps || transitioningRef.current) return

    camera.position
      .sub(controls.target)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitSteps * (Math.PI / 12))
      .add(controls.target)
    controls.update()
  }, [camera, cameraOrbitDelta])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls || !transitioningRef.current) return

    const alpha = dampFactor(3.8, delta)
    camera.position.lerp(destination.position, alpha)
    controls.target.lerp(destination.target, alpha)
    controls.update()

    const positionSettled = camera.position.distanceTo(destination.position) < 0.045
    const targetSettled = controls.target.distanceTo(destination.target) < 0.035
    if (positionSettled && targetSettled) {
      camera.position.copy(destination.position)
      controls.target.copy(destination.target)
      controls.update()
      controls.enabled = true
      transitioningRef.current = false
    }
  })

  return (
    <MapControls
      ref={controlsRef}
      makeDefault
      onStart={performance.regress}
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableZoom
      enableRotate
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      screenSpacePanning={false}
      minDistance={viewMode === 'building' ? 5 : 13}
      maxDistance={viewMode === 'building' ? 28 : 72}
      minPolarAngle={0.4}
      maxPolarAngle={viewMode === 'building' ? 1.42 : 1.28}
      zoomSpeed={0.9}
      panSpeed={0.8}
      rotateSpeed={0.55}
    />
  )
}
