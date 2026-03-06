/**
 * FILE: advancedSnapEngine.ts
 *
 * O que este arquivo faz:
 * Sistema avançado de Snap do CasaPro.
 *
 * Responsabilidade:
 * - snap em endpoints
 * - snap em midpoint
 * - snap em grid
 * - snap inteligente por distância
 * - snap em interseções
 * - snap angular
 * - snap perpendicular
 * - priorização inteligente
 *
 * Preparado para:
 * - intersection snap
 * - angle snap
 * - perpendicular snap
 * - extension snap
 */

import type { Vector2, Wall } from '../project/projectTypes'
import { distance, midpoint } from '../geometry/geometryUtils'

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

// Configuração padrão premium
const DEFAULT_PRIORITIES: SnapPriority[] = [
  { type: 'endpoint', priority: 100, maxDistance: 12 },
  { type: 'intersection', priority: 90, maxDistance: 10 },
  { type: 'perpendicular', priority: 80, maxDistance: 10 },
  { type: 'midpoint', priority: 70, maxDistance: 8 },
  { type: 'grid', priority: 60, maxDistance: 15 },
  { type: 'angle', priority: 50, maxDistance: 20 },
  { type: 'extension', priority: 40, maxDistance: 25 },
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
  angleSnapDegrees: [0, 45, 90, 135, 180, 225, 270, 315],
  preferNearest: true,
}

/**
 * Cria configuração de snap personalizada
 */
export function createSnapConfig(overrides?: Partial<SnapConfig>): SnapConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    priorities: overrides?.priorities ?? DEFAULT_PRIORITIES,
  }
}

/**
 * Calcula interseção entre duas linhas (segmentos infinitos)
 */
function lineIntersection(
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  p4: Vector2
): Vector2 | null {

  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x)

  if (Math.abs(denom) < 0.0001) return null

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom

  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  }
}

/**
 * Encontra projeção perpendicular de um ponto sobre uma linha
 */
function perpendicularProjection(
  point: Vector2,
  lineStart: Vector2,
  lineEnd: Vector2
): Vector2 | null {

  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y

  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return null

  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq

  if (t < 0 || t > 1) return null

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  }
}

/**
 * Calcula snap angular a partir de um ponto de referência
 */
function calculateAngleSnap(
  point: Vector2,
  reference: Vector2,
  angles: number[]
): Vector2 | null {

  const dx = point.x - reference.x
  const dy = point.y - reference.y
  const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI)
  const dist = Math.sqrt(dx * dx + dy * dy)

  let bestAngle: number | null = null
  let minDiff = Infinity

  for (const angle of angles) {
    let diff = Math.abs(currentAngle - angle)
    if (diff > 180) diff = 360 - diff

    if (diff < minDiff) {
      minDiff = diff
      bestAngle = angle
    }
  }

  if (bestAngle === null || minDiff > 15) return null

  const rad = bestAngle * (Math.PI / 180)
  return {
    x: reference.x + Math.cos(rad) * dist,
    y: reference.y + Math.sin(rad) * dist,
  }
}

/**
 * Gera pontos de snap das paredes (endpoint e midpoint)
 */
export function getWallSnapCandidates(
  point: Vector2,
  walls: Wall[],
  config: SnapConfig = DEFAULT_CONFIG
): SnapCandidate[] {

  const candidates: SnapCandidate[] = []
  const priorityMap = new Map(config.priorities.map(p => [p.type, p]))

  for (const wall of walls) {
    // Endpoint snaps
    if (config.enableEndpoint) {
      const startDist = distance(point, wall.start)
      const endDist = distance(point, wall.end)
      const endpointPriority = priorityMap.get('endpoint')?.priority ?? 100

      candidates.push({
        position: wall.start,
        type: 'endpoint',
        distance: startDist,
        priority: endpointPriority,
        source: wall.id,
      })

      candidates.push({
        position: wall.end,
        type: 'endpoint',
        distance: endDist,
        priority: endpointPriority,
        source: wall.id,
      })
    }

    // Midpoint snap
    if (config.enableMidpoint) {
      const mid = midpoint(wall.start, wall.end)
      const midDist = distance(point, mid)
      const midpointPriority = priorityMap.get('midpoint')?.priority ?? 70

      candidates.push({
        position: mid,
        type: 'midpoint',
        distance: midDist,
        priority: midpointPriority,
        source: wall.id,
      })
    }

    // Perpendicular snap
    if (config.enablePerpendicular) {
      const perp = perpendicularProjection(point, wall.start, wall.end)
      if (perp) {
        const perpDist = distance(point, perp)
        const perpPriority = priorityMap.get('perpendicular')?.priority ?? 80

        candidates.push({
          position: perp,
          type: 'perpendicular',
          distance: perpDist,
          priority: perpPriority,
          source: wall.id,
        })
      }
    }
  }

  return candidates
}

/**
 * Encontra interseções entre todas as paredes
 */
export function getIntersectionCandidates(
  point: Vector2,
  walls: Wall[],
  config: SnapConfig = DEFAULT_CONFIG
): SnapCandidate[] {

  if (!config.enableIntersection) return []

  const candidates: SnapCandidate[] = []
  const priorityMap = new Map(config.priorities.map(p => [p.type, p]))
  const intersectionPriority = priorityMap.get('intersection')?.priority ?? 90

  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const intersection = lineIntersection(
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
          source: `${walls[i].id}-${walls[j].id}`,
        })
      }
    }
  }

  return candidates
}

/**
 * Snap para grid com prioridade dinâmica
 */
export function snapToGrid(
  point: Vector2,
  config: SnapConfig = DEFAULT_CONFIG
): SnapCandidate {

  const priorityMap = new Map(config.priorities.map(p => [p.type, p]))
  const gridPriority = priorityMap.get('grid')?.priority ?? 60

  const snapped: Vector2 = {
    x: Math.round(point.x / config.gridSize) * config.gridSize,
    y: Math.round(point.y / config.gridSize) * config.gridSize,
  }

  return {
    position: snapped,
    type: 'grid',
    distance: distance(point, snapped),
    priority: gridPriority,
  }
}

/**
 * Calcula snap angular a partir de ponto de referência
 */
export function getAngleSnapCandidates(
  point: Vector2,
  referencePoints: Vector2[],
  config: SnapConfig = DEFAULT_CONFIG
): SnapCandidate[] {

  if (!config.enableAngle) return []

  const candidates: SnapCandidate[] = []
  const priorityMap = new Map(config.priorities.map(p => [p.type, p]))
  const anglePriority = priorityMap.get('angle')?.priority ?? 50

  for (const ref of referencePoints) {
    const snapped = calculateAngleSnap(point, ref, config.angleSnapDegrees)
    if (snapped) {
      candidates.push({
        position: snapped,
        type: 'angle',
        distance: distance(point, snapped),
        priority: anglePriority,
        metadata: { referenceAngle: Math.atan2(snapped.y - ref.y, snapped.x - ref.x) * (180 / Math.PI) },
      })
    }
  }

  return candidates
}

/**
 * Resolve melhor snap possível com sistema de prioridade avançado
 */
export function resolveSnap(
  point: Vector2,
  walls: Wall[],
  config: SnapConfig = DEFAULT_CONFIG,
  referencePoints: Vector2[] = []
): SnapResult {

  if (!config.enabled) {
    return {
      position: point,
      snapped: false,
      type: 'none',
      candidates: [],
      originalPosition: { ...point },
    }
  }

  const priorityMap = new Map(config.priorities.map(p => [p.type, p]))

  // Coleta todos os candidatos
  const candidates: SnapCandidate[] = [
    ...getWallSnapCandidates(point, walls, config),
    ...getIntersectionCandidates(point, walls, config),
    ...getAngleSnapCandidates(point, referencePoints, config),
  ]

  if (config.enableGrid) {
    candidates.push(snapToGrid(point, config))
  }

  // Filtra por distância máxima configurada
  const validCandidates = candidates.filter(c => {
    const maxDist = priorityMap.get(c.type)?.maxDistance ?? config.snapRadius
    return c.distance <= maxDist
  })

  if (validCandidates.length === 0) {
    return {
      position: point,
      snapped: false,
      type: 'none',
      candidates,
      originalPosition: { ...point },
    }
  }

  // Ordena por prioridade e distância
  const sorted = validCandidates.sort((a, b) => {
    const priorityDiff = b.priority - a.priority
    if (priorityDiff !== 0) return priorityDiff
    return a.distance - b.distance
  })

  const best = sorted[0]

  return {
    position: best.position,
    snapped: true,
    type: best.type,
    candidates: sorted,
    originalPosition: { ...point },
  }
}

/**
 * Preview visual de snap (para debug/visualização)
 */
export function getSnapPreview(
  point: Vector2,
  walls: Wall[],
  config: SnapConfig = DEFAULT_CONFIG,
  referencePoints: Vector2[] = []
): SnapCandidate[] {

  if (!config.enabled) return []

  const result = resolveSnap(point, walls, config, referencePoints)
  return result.candidates.slice(0, 3) // Top 3 candidatos
}

/**
 * Verifica se há snap disponível sem aplicar
 */
export function hasSnapAvailable(
  point: Vector2,
  walls: Wall[],
  config: SnapConfig = DEFAULT_CONFIG
): boolean {

  const result = resolveSnap(point, walls, config)
  return result.snapped
}

/**
 * Força snap para tipo específico
 */
export function forceSnapToType(
  point: Vector2,
  walls: Wall[],
  type: SnapType,
  config: SnapConfig = DEFAULT_CONFIG
): SnapResult {

  const result = resolveSnap(point, walls, config)

  if (!result.snapped) return result

  const forced = result.candidates.find(c => c.type === type)
  if (!forced) return result

  return {
    ...result,
    position: forced.position,
    type: forced.type,
  }
}
