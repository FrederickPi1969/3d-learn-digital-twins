import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useExhibitionStore } from '@/store/useExhibitionStore'

const PATHS = [
  new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-17, 0, 12),
      new THREE.Vector3(-18, 0, 2),
      new THREE.Vector3(-17, 0, -11),
      new THREE.Vector3(-5, 0, -12),
      new THREE.Vector3(7, 0, -12),
      new THREE.Vector3(18, 0, -6),
      new THREE.Vector3(18, 0, 7),
      new THREE.Vector3(8, 0, 12),
      new THREE.Vector3(-6, 0, 12),
    ],
    true,
    'catmullrom',
    0.25,
  ),
  new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-11, 0, 7),
      new THREE.Vector3(-10, 0, 0),
      new THREE.Vector3(-10, 0, -7),
      new THREE.Vector3(0, 0, -9),
      new THREE.Vector3(10, 0, -6),
      new THREE.Vector3(10, 0, 3),
      new THREE.Vector3(5, 0, 8),
      new THREE.Vector3(-4, 0, 9),
    ],
    true,
    'catmullrom',
    0.28,
  ),
  new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, 15),
      new THREE.Vector3(0, 0, 9),
      new THREE.Vector3(4, 0, 5),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-4, 0, -5),
      new THREE.Vector3(0, 0, -12),
    ],
    true,
    'catmullrom',
    0.2,
  ),
] as const

const BODY_COLORS = ['#395d79', '#566b83', '#385062', '#6b5c75', '#486f71', '#5f6475'] as const

export function AmbientVisitors() {
  const visitorCount = useExhibitionStore((state) => state.ambientVisitors)
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)
  const shadowRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const bodyGeometry = useMemo(() => new THREE.CapsuleGeometry(0.22, 0.76, 4, 10), [])
  const headGeometry = useMemo(() => new THREE.SphereGeometry(0.2, 12, 8), [])
  const shadowGeometry = useMemo(() => new THREE.CircleGeometry(0.34, 18), [])
  const bodyMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.72, metalness: 0.08 }),
    [],
  )
  const headMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#aab5bd', roughness: 0.74, metalness: 0.04 }),
    [],
  )
  const shadowMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false }),
    [],
  )

  useEffect(() => {
    const mesh = bodyRef.current
    if (!mesh) return
    for (let index = 0; index < visitorCount; index += 1) {
      mesh.setColorAt(index, new THREE.Color(BODY_COLORS[index % BODY_COLORS.length]))
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [visitorCount])

  useEffect(
    () => () => {
      bodyGeometry.dispose()
      headGeometry.dispose()
      shadowGeometry.dispose()
      bodyMaterial.dispose()
      headMaterial.dispose()
      shadowMaterial.dispose()
    }, [bodyGeometry, bodyMaterial, headGeometry, headMaterial, shadowGeometry, shadowMaterial],
  )

  useFrame(({ clock }) => {
    const body = bodyRef.current
    const head = headRef.current
    const shadow = shadowRef.current
    if (!body || !head || !shadow) return

    for (let index = 0; index < visitorCount; index += 1) {
      const path = PATHS[index % PATHS.length]
      const speed = 0.011 + (index % 5) * 0.0014
      const offset = index / Math.max(visitorCount, 1) + (index % 3) * 0.071
      const progress = (clock.elapsedTime * speed + offset) % 1
      const position = path.getPointAt(progress)
      const tangent = path.getTangentAt(progress)
      const angle = Math.atan2(tangent.x, tangent.z)
      const walkBob = Math.sin(clock.elapsedTime * 4.2 + index * 0.73) * 0.035

      dummy.position.set(position.x, 1.02 + walkBob, position.z)
      dummy.rotation.set(0, angle, 0)
      dummy.scale.setScalar(0.92 + (index % 4) * 0.035)
      dummy.updateMatrix()
      body.setMatrixAt(index, dummy.matrix)

      dummy.position.set(position.x, 1.74 + walkBob, position.z)
      dummy.rotation.set(0, angle, 0)
      dummy.scale.setScalar(0.92 + (index % 4) * 0.035)
      dummy.updateMatrix()
      head.setMatrixAt(index, dummy.matrix)

      dummy.position.set(position.x, 0.025, position.z)
      dummy.rotation.set(-Math.PI / 2, 0, angle)
      dummy.scale.set(1, 1.45, 1)
      dummy.updateMatrix()
      shadow.setMatrixAt(index, dummy.matrix)
    }

    body.instanceMatrix.needsUpdate = true
    head.instanceMatrix.needsUpdate = true
    shadow.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={shadowRef} args={[shadowGeometry, shadowMaterial, visitorCount]} renderOrder={1} />
      <instancedMesh ref={bodyRef} args={[bodyGeometry, bodyMaterial, visitorCount]} castShadow />
      <instancedMesh ref={headRef} args={[headGeometry, headMaterial, visitorCount]} castShadow />
    </group>
  )
}
