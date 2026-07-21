import * as THREE from 'three'
import type { Vec2 } from '@/types/digitalTwin'

export function createRibbonGeometry(points: readonly Vec2[], width: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  if (points.length < 2) return geometry

  const vertices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const halfWidth = width / 2

  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)]
    const next = points[Math.min(points.length - 1, index + 1)]
    const tangentX = next[0] - previous[0]
    const tangentZ = next[1] - previous[1]
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1
    const normalX = -tangentZ / tangentLength
    const normalZ = tangentX / tangentLength

    vertices.push(
      point[0] + normalX * halfWidth,
      0,
      point[1] + normalZ * halfWidth,
      point[0] - normalX * halfWidth,
      0,
      point[1] - normalZ * halfWidth,
    )
    normals.push(0, 1, 0, 0, 1, 0)
    const progress = index / (points.length - 1)
    uvs.push(0, progress, 1, progress)

    if (index < points.length - 1) {
      const start = index * 2
      indices.push(start, start + 2, start + 1, start + 2, start + 3, start + 1)
    }
  })

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}
