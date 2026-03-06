/**
 * FILE: snapEngine.ts
 *
 * Sistema de snapping para precisão em desenho arquitetônico.
 * Suporta grid, ângulos e snapping a elementos existentes.
 */

import type { Vector2 } from '../project/projectTypes'
fix: remove unused angle import

export interface SnapPoint {
  position: Vector2
  type: 'grid' | 'vertex' | 'wall'
  distance: number
  /** ID opcional do elemento que gerou o snap (para highlight) */
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
 * Snap para grid - versão otimizada com cache de divisão
 */
export function snapToGrid(point: Vector2, gridSize: number): Vector2 {
  const invGrid = 1 / gridSize // Evita divisão dupla
  return {
    x: Math.round(point.x * invGrid) * gridSize,
    y: Math.round(point.y * invGrid) * gridSize
  }
}

/**
 * Snap angular com múltiplos ângulos suportados (0°, 45°, 90°, etc)
 */
export function snapAngle(start: Vector2, end: Vector2, stepDeg = 45): Vector2 {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  
  if (dist === 0) return { ...end } // Evita NaN
  
  const currentAngle = Math.atan2(dy, dx)
  const step = degToRad(stepDeg)
  const snappedAngle = Math.round(currentAngle / step) * step

  return {
    x: start.x + Math.cos(snappedAngle) * dist,
    y: start.y + Math.sin(snappedAngle) * dist
  }
}

/**
 * Snap para vértices existentes - versão otimizada com early exit
 */
export function findVertexSnap(
  point: Vector2,
  vertices: Vector2[],
  threshold: number,
  options?: { sourceIds?: string[] }
): SnapPoint | null {
  
  const thresholdSq = threshold * threshold // Evita sqrt no loop
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
 * Snap para paredes (linhas) - versão otimizada
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
    const projected = projectPointOnLine(point, wall.start, wall.end)
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
 * Snap combinado: tenta vértice → parede → grid
 * Retorna o melhor resultado priorizando precisão
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
  
  const { vertices, walls, gridSize, threshold, preferGrid } = options

  // 1. Tentar vértice (mais preciso)
  if (vertices && vertices.length > 0) {
    const vertexSnap = findVertexSnap(point, vertices, threshold)
    if (vertexSnap) {
      return { point: vertexSnap.position, snapped: true, source: vertexSnap }
    }
  }

  // 2. Tentar parede
  if (walls && walls.length > 0) {
    const wallSnap = findWallSnap(point, walls, threshold)
    if (wallSnap) {
      return { point: wallSnap.position, snapped: true, source: wallSnap }
    }
  }

  // 3. Fallback para grid
  if (gridSize && !preferGrid) {
    const gridPoint = snapToGrid(point, gridSize)
    const dist = distance(point, gridPoint)
    if (dist < threshold) {
      return {
        point: gridPoint,
        snapped: true,
        source: { position: gridPoint, type: 'grid', distance: dist }
      }
    }
  }

  // Sem snap
  return { point, snapped: false }
}

/**
 * Verifica se um ponto está próximo de um snap existente
 * Útil para evitar snaps redundantes
 */
export function isNearSnap(point: Vector2, snap: SnapPoint, tolerance: number): boolean {
  return distance(point, snap.position) <= tolerance
}
