import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import type { Line2 } from 'three-stdlib'
import { campusBuildings, campusRoads } from '@/data/campus'

function AnimatedFlowLine({
  points,
  color,
  speed,
  width = 1.2,
}: {
  points: THREE.Vector3[]
  color: string
  speed: number
  width?: number
}) {
  const lineRef = useRef<Line2>(null)

  useFrame((_, delta) => {
    const material = lineRef.current?.material
    if (material && 'dashOffset' in material) {
      material.dashOffset -= delta * speed
    }
  })

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={width}
      dashed
      dashScale={1}
      dashSize={0.55}
      gapSize={0.42}
      transparent
      opacity={0.76}
      toneMapped={false}
    />
  )
}

export function DataFlows() {
  const roadFlows = useMemo(
    () =>
      campusRoads.map((road) => ({
        id: road.id,
        points: road.points.map(([x, z]) => new THREE.Vector3(x, 0.13, z)),
        color: road.glow ? '#ffd066' : '#36cfff',
      })),
    [],
  )

  const uplinks = useMemo(() => {
    const hub = campusBuildings.find((building) => building.id === 'tower-c')!
    return campusBuildings
      .filter((building) => building.id !== hub.id)
      .slice(0, 7)
      .map((building) => {
        const start = new THREE.Vector3(
          hub.position[0],
          hub.size[1] + 0.6,
          hub.position[1],
        )
        const end = new THREE.Vector3(
          building.position[0],
          building.size[1] + 0.45,
          building.position[1],
        )
        const midpoint = start.clone().lerp(end, 0.5)
        midpoint.y += 3.5 + start.distanceTo(end) * 0.08
        const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end)
        return {
          id: building.id,
          points: curve.getPoints(36),
        }
      })
  }, [])

  return (
    <group>
      {roadFlows.map((flow, index) => (
        <AnimatedFlowLine
          key={flow.id}
          points={flow.points}
          color={flow.color}
          speed={0.85 + index * 0.12}
          width={flow.id === 'ring-road' ? 1.45 : 1.0}
        />
      ))}
      {uplinks.map((flow, index) => (
        <AnimatedFlowLine
          key={flow.id}
          points={flow.points}
          color="#58e7ff"
          speed={1.1 + index * 0.08}
          width={0.75}
        />
      ))}
    </group>
  )
}
