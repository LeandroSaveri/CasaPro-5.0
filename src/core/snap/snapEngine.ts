/**
 * FILE: snapEngine.ts
 *
 * O que este arquivo faz:
 * Sistema de snapping usado pelo motor do CasaPro.
 *
 * Responsabilidade:
 * - Snap no grid
 * - Snap angular (0°, 45°, 90°)
 * - Snap em vértices existentes
 * - Snap em paredes
 * - Escolher o melhor snap disponível
 */

import type { Vector2 } from '../project/projectTypes'
import { distance, degToRad, projectPointOnLine } from '../geometry/geometryUtils'

/**
 * Cache simples de snapping (melhora performance)
 */
let lastSnapPoint: Vector2 | null = null
let lastSnapResult: SnapResult | null = null

export interface SnapPoint {
  position: Vector2
  type: 'grid' | 'vertex' | 'wall'
  distance: number
  sourceId?: string
}

export interface SnapResult {
  point: Vector2
  snapped: boolean
  source?: SnapPoint
}

export interface Wall {
  start: Vector2
  end: Vector2
  id?: string
}

/**
 * Snap para grid
 */
export function snapToGrid(point: Vector2, gridSize: number): Vector2 {

  const invGrid = 1 / gridSize

  return {
    x: Math.round(point.x * invGrid) * gridSize,
    y: Math.round(point.y * invGrid) * gridSize
  }

}

/**
 * Snap angular
 */
export function snapAngle(
  start: Vector2,
  end: Vector2,
  stepDeg = 45
): Vector2 {

  const dx = end.x - start.x
  const dy = end.y - start.y

  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist === 0) return { ...end }

  const currentAngle = Math.atan2(dy, dx)
  const step = degToRad(stepDeg)

  const snappedAngle =
    Math.round(currentAngle / step) * step

  return {
    x: start.x + Math.cos(snappedAngle) * dist,
    y: start.y + Math.sin(snappedAngle) * dist
  }

}

/**
 * Snap para vértices existentes
 */
export function findVertexSnap(
  point: Vector2,
  vertices: Vector2[],
  threshold: number,
  options?: { sourceIds?: string[] }
): SnapPoint | null {

  const thresholdSq = threshold * threshold

  let bestDistSq = thresholdSq
  let best: SnapPoint | null = null

  for (let i = 0; i < vertices.length; i++) {

    const v = vertices[i]

    const dx = point.x - v.x
    const dy = point.y - v.y

    const distSq = dx * dx + dy * dy

    if (distSq < bestDistSq) {

      bestDistSq = distSq

      best = {
        position: v,
        type: 'vertex',
        distance: Math.sqrt(distSq),
        sourceId: options?.sourceIds?.[i]
      }

    }

  }

  return best
}

/**
 * Snap para paredes
 */
export function findWallSnap(
  point: Vector2,
  walls: Wall[],
  threshold: number
): SnapPoint | null {

  const thresholdSq = threshold * threshold

  let bestDistSq = thresholdSq
  let best: SnapPoint | null = null

  for (const wall of walls) {

    const centerX = (wall.start.x + wall.end.x) / 2
    const centerY = (wall.start.y + wall.end.y) / 2

    const dxCenter = point.x - centerX
    const dyCenter = point.y - centerY

    const centerDistSq =
      dxCenter * dxCenter + dyCenter * dyCenter

    if (centerDistSq > thresholdSq * 16) continue

    const projected =
      projectPointOnLine(point, wall.start, wall.end)

    const dx = point.x - projected.x
    const dy = point.y - projected.y

    const distSq = dx * dx + dy * dy

    if (distSq < bestDistSq) {

      bestDistSq = distSq

      best = {
        position: projected,
        type: 'wall',
        distance: Math.sqrt(distSq),
        sourceId: wall.id
      }

    }

  }

  return best
}

/**
 * Escolhe o melhor snap disponível
 */
export function findBestSnap(
  point: Vector2,
  options: {
    vertices?: Vector2[]
    walls?: Wall[]
    gridSize?: number
    threshold: number
    preferGrid?: boolean
  }
): SnapResult {

  const {
    vertices,
    walls,
    gridSize,
    threshold,
    preferGrid
  } = options

  if (lastSnapPoint && lastSnapResult) {

    const dx = point.x - lastSnapPoint.x
    const dy = point.y - lastSnapPoint.y

    const moveDistSq = dx * dx + dy * dy

    if (moveDistSq < 1) {
      return lastSnapResult
    }

  }

  if (vertices && vertices.length > 0) {

    const vertexSnap =
      findVertexSnap(point, vertices, threshold)

    if (vertexSnap) {

      const result: SnapResult = {
        point: vertexSnap.position,
        snapped: true,
        source: vertexSnap
      }

      lastSnapPoint = { ...point }
      lastSnapResult = result

      return result
    }

  }

  if (walls && walls.length > 0) {

    const wallSnap =
      findWallSnap(point, walls, threshold)

    if (wallSnap) {

      const result: SnapResult = {
        point: wallSnap.position,
        snapped: true,
        source: wallSnap
      }

      lastSnapPoint = { ...point }
      lastSnapResult = result

      return result
    }

  }

  if (gridSize && !preferGrid) {

    const gridPoint =
      snapToGrid(point, gridSize)

    const dist =
      distance(point, gridPoint)

    if (dist < threshold) {

      const result: SnapResult = {
        point: gridPoint,
        snapped: true,
        source: {
          position: gridPoint,
          type: 'grid',
          distance: dist
        }
      }

      lastSnapPoint = { ...point }
      lastSnapResult = result

      return result
    }

  }

  const result: SnapResult = {
    point,
    snapped: false
  }

  lastSnapPoint = { ...point }
  lastSnapResult = result

  return result

}

/**
 * Verifica se ponto está próximo de um snap
 */
export function isNearSnap(
  point: Vector2,
  snap: SnapPoint,
  tolerance: number
): boolean {

  return distance(point, snap.position) <= tolerance

}
