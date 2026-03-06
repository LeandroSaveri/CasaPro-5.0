/**
 * FILE: advancedSnapEngine.ts
 *
 * Sistema avançado de Snap do CasaPro
 *
 * Responsável por:
 * - snap em endpoints
 * - snap em midpoint
 * - snap em grid
 * - snap em interseções
 * - snap perpendicular
 * - snap angular
 * - snap em segmento de parede
 * - priorização inteligente
 */

import type { Vector2, Wall } from '../project/projectTypes'

import {
  distance,
  midpoint,
  projectPointOnLine,
  getLineIntersection
} from '../geometry/geometryUtils'

export type SnapType =
  | 'endpoint'
  | 'midpoint'
  | 'grid'
  | 'intersection'
  | 'perpendicular'
  | 'extension'
  | 'angle'
  | 'none'

export interface SnapPriority {
  type: SnapType
  priority: number
  maxDistance: number
}

export interface SnapCandidate {
  position: Vector2
  type: SnapType
  distance: number
  priority: number
  source?: string
  metadata?: Record<string, number>
}

export interface SnapResult {
  position: Vector2
  snapped: boolean
  type: SnapType
  candidates: SnapCandidate[]
  originalPosition: Vector2
}

export interface SnapConfig {
  enabled: boolean
  snapRadius: number
  gridSize: number
  priorities: SnapPriority[]
  enableEndpoint: boolean
  enableMidpoint: boolean
  enableGrid: boolean
  enableIntersection: boolean
  enablePerpendicular: boolean
  enableAngle: boolean
  angleSnapDegrees: number[]
  preferNearest: boolean
}

const DEFAULT_PRIORITIES: SnapPriority[] = [
  { type: 'endpoint', priority: 100, maxDistance: 12 },
  { type: 'intersection', priority: 90, maxDistance: 10 },
  { type: 'perpendicular', priority: 85, maxDistance: 10 },
  { type: 'extension', priority: 80, maxDistance: 12 },
  { type: 'midpoint', priority: 70, maxDistance: 8 },
  { type: 'grid', priority: 60, maxDistance: 15 },
  { type: 'angle', priority: 50, maxDistance: 20 },
]

const DEFAULT_CONFIG: SnapConfig = {
  enabled: true,
  snapRadius: 12,
  gridSize: 10,
  priorities: DEFAULT_PRIORITIES,
  enableEndpoint: true,
  enableMidpoint: true,
  enableGrid: true,
  enableIntersection: true,
  enablePerpendicular: true,
  enableAngle: true,
  angleSnapDegrees: [0,45,90,135,180,225,270,315],
  preferNearest: true
}

export function createSnapConfig(
  overrides?: Partial<SnapConfig>
): SnapConfig {

  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    priorities: overrides?.priorities ?? DEFAULT_PRIORITIES
  }
}

function perpendicularProjection(
  point: Vector2,
  lineStart: Vector2,
  lineEnd: Vector2
): Vector2 | null {

  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y

  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return null

  const t =
    ((point.x - lineStart.x) * dx +
      (point.y - lineStart.y) * dy) / lenSq

  if (t < 0 || t > 1) return null

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  }
}

/* ---------- NOVA FUNÇÃO DE SNAP ANGULAR ---------- */

function calculateAngleSnap(
  point: Vector2,
  reference: Vector2,
  angles: number[]
): Vector2 | null {

  const dx = point.x - reference.x
  const dy = point.y - reference.y

  const angle = Math.atan2(dy, dx)
  const dist = Math.sqrt(dx * dx + dy * dy)

  let bestAngle: number | null = null
  let smallestDiff = Infinity

  for (const a of angles) {

    const rad = a * Math.PI / 180
    const diff = Math.abs(angle - rad)

    if (diff < smallestDiff) {
      smallestDiff = diff
      bestAngle = rad
    }
  }

  if (bestAngle === null) return null

  return {
    x: reference.x + Math.cos(bestAngle) * dist,
    y: reference.y + Math.sin(bestAngle) * dist
  }
}

/* ---------- WALL SNAP ---------- */

export function getWallSnapCandidates(
  point: Vector2,
  walls: Wall[],
  config: SnapConfig = DEFAULT_CONFIG
): SnapCandidate[] {

  const candidates: SnapCandidate[] = []

  const priorityMap =
    new Map(config.priorities.map(p => [p.type, p]))

  for (const wall of walls) {

    const wallCenter = midpoint(wall.start, wall.end)
    const wallDist = distance(point, wallCenter)
    if (wallDist > config.snapRadius * 4) continue

    const startDist = distance(point, wall.start)
    const endDist = distance(point, wall.end)

    const endpointPriority =
      priorityMap.get('endpoint')?.priority ?? 100

    candidates.push({
      position: wall.start,
      type: 'endpoint',
      distance: startDist,
      priority: endpointPriority,
      source: wall.id
    })

    candidates.push({
      position: wall.end,
      type: 'endpoint',
      distance: endDist,
      priority: endpointPriority,
      source: wall.id
    })

    const mid = midpoint(wall.start, wall.end)

    const midDist = distance(point, mid)

    const midpointPriority =
      priorityMap.get('midpoint')?.priority ?? 70

    candidates.push({
      position: mid,
      type: 'midpoint',
      distance: midDist,
      priority: midpointPriority,
      source: wall.id
    })

    const perp =
      perpendicularProjection(
        point,
        wall.start,
        wall.end
      )

    if (perp) {

      const perpDist = distance(point, perp)

      const perpPriority =
        priorityMap.get('perpendicular')?.priority ?? 85

      candidates.push({
        position: perp,
        type: 'perpendicular',
        distance: perpDist,
        priority: perpPriority,
        source: wall.id
      })
    }

    const projection =
      projectPointOnLine(
        point,
        wall.start,
        wall.end
      )

    const projDist = distance(point, projection)

    if (projDist < config.snapRadius) {

      candidates.push({
        position: projection,
        type: 'extension',
        distance: projDist,
        priority: 80,
        source: wall.id
      })
    }
  }

  return candidates
}

/* ---------- INTERSECTION SNAP ---------- */

export function getIntersectionCandidates(
  point: Vector2,
  walls: Wall[],
  config: SnapConfig = DEFAULT_CONFIG
): SnapCandidate[] {

  if (!config.enableIntersection)
    return []

  const candidates: SnapCandidate[] = []

  const priorityMap =
    new Map(config.priorities.map(p => [p.type, p]))

  const intersectionPriority =
    priorityMap.get('intersection')?.priority ?? 90

  for (let i = 0; i < walls.length; i++) {

    for (let j = i + 1; j < walls.length; j++) {

      const intersection =
        getLineIntersection(
          walls[i].start,
          walls[i].end,
          walls[j].start,
          walls[j].end
        )

      if (intersection) {

        const dist = distance(point, intersection)

        candidates.push({
          position: intersection,
          type: 'intersection',
          distance: dist,
          priority: intersectionPriority,
          source:
            `${walls[i].id}-${walls[j].id}`
        })
      }
    }
  }

  return candidates
}

/* ---------- GRID SNAP ---------- */

export function snapToGrid(
  point: Vector2,
  config: SnapConfig = DEFAULT_CONFIG
): SnapCandidate {

  const snapped = {
    x:
      Math.round(point.x / config.gridSize)
      * config.gridSize,

    y:
      Math.round(point.y / config.gridSize)
      * config.gridSize
  }

  return {
    position: snapped,
    type: 'grid',
    distance: distance(point, snapped),
    priority: 60
  }
}

/* ---------- SNAP RESOLVER ---------- */

export function resolveSnap(
  point: Vector2,
  walls: Wall[],
  config: SnapConfig = DEFAULT_CONFIG,
  _referencePoints: Vector2[] = []
): SnapResult {

  if (!config.enabled) {

    return {
      position: point,
      snapped: false,
      type: 'none',
      candidates: [],
      originalPosition: { ...point }
    }
  }

  const candidates: SnapCandidate[] = [

    ...getWallSnapCandidates(point, walls, config),

    ...getIntersectionCandidates(point, walls, config)
  ]

  /* ---------- ANGLE SNAP ---------- */

  if (config.enableAngle && _referencePoints.length > 0) {

    for (const ref of _referencePoints) {

      const snapped = calculateAngleSnap(
        point,
        ref,
        config.angleSnapDegrees
      )

      if (snapped) {

        candidates.push({
          position: snapped,
          type: 'angle',
          distance: distance(point, snapped),
          priority: 50
        })
      }
    }
  }

  if (config.enableGrid) {
    candidates.push(snapToGrid(point, config))
  }

  if (candidates.length === 0) {

    return {
      position: point,
      snapped: false,
      type: 'none',
      candidates,
      originalPosition: { ...point }
    }
  }

  const sorted =
    candidates.sort((a, b) => {

      const p =
        b.priority - a.priority

      if (p !== 0) return p

      return a.distance - b.distance
    })

  const best = sorted[0]

  return {
    position: best.position,
    snapped: true,
    type: best.type,
    candidates: sorted,
    originalPosition: { ...point }
  }
}
