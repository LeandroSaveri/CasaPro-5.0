/**
 * FILE: geometryUtils.ts
 *
 * O que este arquivo faz:
 * Funções matemáticas usadas pelo motor do CasaPro.
 *
 * Responsabilidade:
 * - cálculo de distância
 * - ângulo entre pontos
 * - utilidades geométricas
 */

import { Vector2 } from '../project/projectTypes'

/**
 * Calcula distância entre dois pontos
 */
export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calcula ângulo entre dois pontos
 */
export function angle(a: Vector2, b: Vector2): number {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

/**
 * Ponto médio entre dois pontos
 */
export function midpoint(a: Vector2, b: Vector2): Vector2 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  }
}
