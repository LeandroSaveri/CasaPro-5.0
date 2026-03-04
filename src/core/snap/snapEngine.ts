/**
 * FILE: snapEngine.ts
 *
 * O que este arquivo faz:
 * Sistema de Snap (encaixe automático) do CasaPro.
 *
 * Responsabilidade:
 * Permitir:
 * - encaixe em pontos
 * - alinhamento automático
 * - precisão ao desenhar paredes
 */

import { Vector2, Wall } from '../project/projectTypes'
import { distance } from '../geometry/geometryUtils'

export interface SnapResult {
  position: Vector2
  snapped: boolean
}

const SNAP_DISTANCE = 10

/**
 * Verifica snap em uma lista de pontos
 */
export function snapToPoints(
  point: Vector2,
  points: Vector2[]
): SnapResult {

  for (const p of points) {
    if (distance(point, p) < SNAP_DISTANCE) {
      return {
        position: p,
        snapped: true
      }
    }
  }

  return {
    position: point,
    snapped: false
  }
}

/**
 * Extrai pontos de paredes
 */
export function getWallSnapPoints(walls: Wall[]): Vector2[] {

  const points: Vector2[] = []

  for (const wall of walls) {
    points.push(wall.start)
    points.push(wall.end)
  }

  return points
}
