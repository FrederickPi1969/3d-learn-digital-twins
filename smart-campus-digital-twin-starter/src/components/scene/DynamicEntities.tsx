import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { campusRoads } from '@/data/campus'
import { pedestrianRoutes } from '@/data/environment'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import { getNightFactor } from '@/utils/environment'
import { seededNoise } from '@/utils/math'

const FORWARD = new THREE.Vector3(0, 0, 1)
const MAX_VEHICLES = 36
const MAX_PEDESTRIANS = 72

interface VehicleSpec {
  routeIndex: number
  offset: number
  speed: number
  scale: number
  color: string
}

interface PedestrianSpec {
  routeIndex: number
  offset: number
  speed: number
  scale: number
  color: string
}

const vehiclePalette = ['#2bc8ff', '#e5f4ff', '#ffb54b', '#647dff', '#21ddb0', '#d95d79']
const pedestrianPalette = ['#47cfff', '#67edc7', '#ffbd66', '#9f91ff', '#e9f5ff']

function createVehicleCurves(): THREE.CatmullRomCurve3[] {
  return campusRoads.map((road) => {
    const closed = road.points[0][0] === road.points.at(-1)?.[0] && road.points[0][1] === road.points.at(-1)?.[1]
    return new THREE.CatmullRomCurve3(
      road.points.map(([x, z]) => new THREE.Vector3(x, 0.22, z)),
      closed,
      'catmullrom',
      0.16,
    )
  })
}

function createPedestrianCurves(): THREE.CatmullRomCurve3[] {
  return pedestrianRoutes.map(
    (route) =>
      new THREE.CatmullRomCurve3(
        route.map(([x, z]) => new THREE.Vector3(x, 0.05, z)),
        true,
        'centripetal',
        0.2,
      ),
  )
}

function Vehicles() {
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const cabinRef = useRef<THREE.InstancedMesh>(null)
  const glassRef = useRef<THREE.InstancedMesh>(null)
  const headlightRef = useRef<THREE.InstancedMesh>(null)
  const taillightRef = useRef<THREE.InstancedMesh>(null)
  const movingLightsRef = useRef<(THREE.PointLight | null)[]>([])
  const vehicleCount = useDigitalTwinStore((state) => state.vehicleCount)
  const entitySpeed = useDigitalTwinStore((state) => state.entitySpeed)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)

  const curves = useMemo(() => createVehicleCurves(), [])
  const scratchRef = useRef({
    point: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    rootMatrix: new THREE.Matrix4(),
    localMatrix: new THREE.Matrix4(),
    finalMatrix: new THREE.Matrix4(),
    rootScale: new THREE.Vector3(),
    localPosition: new THREE.Vector3(),
    localScale: new THREE.Vector3(),
    localQuaternion: new THREE.Quaternion(),
  })
  const specs = useMemo<VehicleSpec[]>(
    () =>
      Array.from({ length: MAX_VEHICLES }, (_, index) => ({
        routeIndex: index % curves.length,
        offset: seededNoise(index * 19 + 3),
        speed: 0.72 + seededNoise(index * 23 + 7) * 0.72,
        scale: 0.82 + seededNoise(index * 29 + 11) * 0.28,
        color: vehiclePalette[Math.floor(seededNoise(index * 31 + 17) * vehiclePalette.length)],
      })),
    [curves.length],
  )

  useLayoutEffect(() => {
    const meshes = [bodyRef.current, cabinRef.current, glassRef.current, headlightRef.current, taillightRef.current]
    meshes.forEach((mesh) => {
      if (!mesh) return
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      mesh.frustumCulled = false
    })

    specs.forEach((spec, index) => {
      bodyRef.current?.setColorAt(index, new THREE.Color(spec.color))
    })
    if (bodyRef.current?.instanceColor) bodyRef.current.instanceColor.needsUpdate = true
  }, [specs])

  useFrame(({ clock }) => {
    const body = bodyRef.current
    const cabin = cabinRef.current
    const glass = glassRef.current
    const headlights = headlightRef.current
    const taillights = taillightRef.current
    if (!body || !cabin || !glass || !headlights || !taillights) return

    const count = Math.min(vehicleCount, MAX_VEHICLES)
    body.count = count
    cabin.count = count
    glass.count = count
    headlights.count = count
    taillights.count = count

    const {
      point,
      tangent,
      quaternion,
      rootMatrix,
      localMatrix,
      finalMatrix,
      rootScale,
      localPosition,
      localScale,
      localQuaternion,
    } = scratchRef.current

    for (let index = 0; index < count; index += 1) {
      const spec = specs[index]
      const curve = curves[spec.routeIndex]
      const progress = (spec.offset + clock.elapsedTime * 0.017 * spec.speed * entitySpeed) % 1
      curve.getPointAt(progress, point)
      curve.getTangentAt(progress, tangent).setY(0).normalize()
      quaternion.setFromUnitVectors(FORWARD, tangent)
      rootScale.set(spec.scale, spec.scale, spec.scale)
      rootMatrix.compose(point, quaternion, rootScale)
      body.setMatrixAt(index, rootMatrix)

      localPosition.set(0, 0.22, -0.05)
      localScale.set(1, 1, 1)
      localMatrix.compose(localPosition, localQuaternion, localScale)
      finalMatrix.multiplyMatrices(rootMatrix, localMatrix)
      cabin.setMatrixAt(index, finalMatrix)

      localPosition.set(0, 0.255, -0.03)
      localScale.set(1, 1, 1)
      localMatrix.compose(localPosition, localQuaternion, localScale)
      finalMatrix.multiplyMatrices(rootMatrix, localMatrix)
      glass.setMatrixAt(index, finalMatrix)

      localPosition.set(0, 0.02, 0.645)
      localMatrix.compose(localPosition, localQuaternion, localScale)
      finalMatrix.multiplyMatrices(rootMatrix, localMatrix)
      headlights.setMatrixAt(index, finalMatrix)

      localPosition.set(0, 0.015, -0.645)
      localMatrix.compose(localPosition, localQuaternion, localScale)
      finalMatrix.multiplyMatrices(rootMatrix, localMatrix)
      taillights.setMatrixAt(index, finalMatrix)

      if (index < movingLightsRef.current.length) {
        const light = movingLightsRef.current[index]
        if (light) {
          light.position.copy(point)
          light.position.y += 0.34
          light.intensity = getNightFactor(dayPhase) * 8.5
        }
      }
    }

    body.instanceMatrix.needsUpdate = true
    cabin.instanceMatrix.needsUpdate = true
    glass.instanceMatrix.needsUpdate = true
    headlights.instanceMatrix.needsUpdate = true
    taillights.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, MAX_VEHICLES]} castShadow>
        <boxGeometry args={[0.7, 0.28, 1.28]} />
        <meshStandardMaterial
          vertexColors
          color="#ffffff"
          roughness={0.28}
          metalness={0.58}
        />
      </instancedMesh>
      <instancedMesh ref={cabinRef} args={[undefined, undefined, MAX_VEHICLES]} castShadow>
        <boxGeometry args={[0.56, 0.24, 0.62]} />
        <meshStandardMaterial color="#17364c" roughness={0.2} metalness={0.64} />
      </instancedMesh>
      <instancedMesh ref={glassRef} args={[undefined, undefined, MAX_VEHICLES]}>
        <boxGeometry args={[0.51, 0.2, 0.55]} />
        <meshPhysicalMaterial
          color="#73c8e8"
          emissive="#164c68"
          emissiveIntensity={0.4}
          roughness={0.08}
          metalness={0.55}
          transparent
          opacity={0.72}
        />
      </instancedMesh>
      <instancedMesh ref={headlightRef} args={[undefined, undefined, MAX_VEHICLES]}>
        <boxGeometry args={[0.48, 0.075, 0.035]} />
        <meshBasicMaterial color="#e8fbff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={taillightRef} args={[undefined, undefined, MAX_VEHICLES]}>
        <boxGeometry args={[0.44, 0.07, 0.035]} />
        <meshBasicMaterial color="#ff315c" toneMapped={false} />
      </instancedMesh>
      {Array.from({ length: 4 }, (_, index) => (
        <pointLight
          key={index}
          ref={(light) => {
            movingLightsRef.current[index] = light
          }}
          color="#bdefff"
          intensity={0}
          distance={4.8}
          decay={2}
        />
      ))}
    </group>
  )
}

function Pedestrians() {
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)
  const leftLegRef = useRef<THREE.InstancedMesh>(null)
  const rightLegRef = useRef<THREE.InstancedMesh>(null)
  const pedestrianCount = useDigitalTwinStore((state) => state.pedestrianCount)
  const entitySpeed = useDigitalTwinStore((state) => state.entitySpeed)
  const curves = useMemo(() => createPedestrianCurves(), [])
  const scratchRef = useRef({
    point: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    rootQuaternion: new THREE.Quaternion(),
    rootMatrix: new THREE.Matrix4(),
    localMatrix: new THREE.Matrix4(),
    finalMatrix: new THREE.Matrix4(),
    scale: new THREE.Vector3(),
    localPosition: new THREE.Vector3(),
    localQuaternion: new THREE.Quaternion(),
    localScale: new THREE.Vector3(1, 1, 1),
    legEuler: new THREE.Euler(),
  })
  const specs = useMemo<PedestrianSpec[]>(
    () =>
      Array.from({ length: MAX_PEDESTRIANS }, (_, index) => ({
        routeIndex: index % curves.length,
        offset: seededNoise(index * 17 + 5),
        speed: 0.62 + seededNoise(index * 23 + 9) * 0.62,
        scale: 0.82 + seededNoise(index * 29 + 13) * 0.26,
        color: pedestrianPalette[
          Math.floor(seededNoise(index * 37 + 19) * pedestrianPalette.length)
        ],
      })),
    [curves.length],
  )

  useLayoutEffect(() => {
    const meshes = [bodyRef.current, headRef.current, leftLegRef.current, rightLegRef.current]
    meshes.forEach((mesh) => {
      if (!mesh) return
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      mesh.frustumCulled = false
    })
    specs.forEach((spec, index) => bodyRef.current?.setColorAt(index, new THREE.Color(spec.color)))
    if (bodyRef.current?.instanceColor) bodyRef.current.instanceColor.needsUpdate = true
  }, [specs])

  useFrame(({ clock }) => {
    const body = bodyRef.current
    const head = headRef.current
    const leftLeg = leftLegRef.current
    const rightLeg = rightLegRef.current
    if (!body || !head || !leftLeg || !rightLeg) return

    const count = Math.min(pedestrianCount, MAX_PEDESTRIANS)
    body.count = count
    head.count = count
    leftLeg.count = count
    rightLeg.count = count

    const {
      point,
      tangent,
      rootQuaternion,
      rootMatrix,
      localMatrix,
      finalMatrix,
      scale,
      localPosition,
      localQuaternion,
      localScale,
      legEuler,
    } = scratchRef.current

    for (let index = 0; index < count; index += 1) {
      const spec = specs[index]
      const curve = curves[spec.routeIndex]
      const progress = (spec.offset + clock.elapsedTime * 0.012 * spec.speed * entitySpeed) % 1
      curve.getPointAt(progress, point)
      curve.getTangentAt(progress, tangent).setY(0).normalize()
      rootQuaternion.setFromUnitVectors(FORWARD, tangent)
      const gait = clock.elapsedTime * 8.0 * spec.speed * entitySpeed + spec.offset * 12.0
      const bob = Math.abs(Math.sin(gait)) * 0.025
      point.y = 0.38 * spec.scale + bob
      scale.set(spec.scale, spec.scale, spec.scale)
      rootMatrix.compose(point, rootQuaternion, scale)
      body.setMatrixAt(index, rootMatrix)

      localPosition.set(0, 0.42, 0)
      localQuaternion.identity()
      localMatrix.compose(localPosition, localQuaternion, localScale)
      finalMatrix.multiplyMatrices(rootMatrix, localMatrix)
      head.setMatrixAt(index, finalMatrix)

      const swing = Math.sin(gait) * 0.55
      localPosition.set(-0.075, -0.34, 0)
      legEuler.set(swing, 0, 0)
      localQuaternion.setFromEuler(legEuler)
      localMatrix.compose(localPosition, localQuaternion, localScale)
      finalMatrix.multiplyMatrices(rootMatrix, localMatrix)
      leftLeg.setMatrixAt(index, finalMatrix)

      localPosition.set(0.075, -0.34, 0)
      legEuler.set(-swing, 0, 0)
      localQuaternion.setFromEuler(legEuler)
      localMatrix.compose(localPosition, localQuaternion, localScale)
      finalMatrix.multiplyMatrices(rootMatrix, localMatrix)
      rightLeg.setMatrixAt(index, finalMatrix)
    }

    body.instanceMatrix.needsUpdate = true
    head.instanceMatrix.needsUpdate = true
    leftLeg.instanceMatrix.needsUpdate = true
    rightLeg.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, MAX_PEDESTRIANS]} castShadow>
        <capsuleGeometry args={[0.12, 0.38, 4, 8]} />
        <meshStandardMaterial
          vertexColors
          color="#ffffff"
          emissive="#082c3f"
          emissiveIntensity={0.24}
          roughness={0.72}
        />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, MAX_PEDESTRIANS]} castShadow>
        <sphereGeometry args={[0.125, 10, 8]} />
        <meshStandardMaterial color="#d8ae88" roughness={0.86} />
      </instancedMesh>
      <instancedMesh ref={leftLegRef} args={[undefined, undefined, MAX_PEDESTRIANS]} castShadow>
        <capsuleGeometry args={[0.045, 0.28, 3, 6]} />
        <meshStandardMaterial color="#172736" roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={rightLegRef} args={[undefined, undefined, MAX_PEDESTRIANS]} castShadow>
        <capsuleGeometry args={[0.045, 0.28, 3, 6]} />
        <meshStandardMaterial color="#172736" roughness={0.92} />
      </instancedMesh>
    </group>
  )
}

export function DynamicEntities() {
  return (
    <group>
      <Vehicles />
      <Pedestrians />
    </group>
  )
}
