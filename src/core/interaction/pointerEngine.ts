/**
 * FILE: pointerEngine.ts
 *
 * O que este arquivo faz:
 * Sistema unificado de interação do CasaPro.
 *
 * Responsabilidade:
 * - mouse
 * - touch
 * - drag
 * - posição do ponteiro
 */

import { Vector2 } from '../project/projectTypes'

export interface PointerState {
  isDown: boolean
  position: Vector2
  startPosition: Vector2 | null
}

export function createPointerState(): PointerState {
  return {
    isDown: false,
    position: { x: 0, y: 0 },
    startPosition: null
  }
}

/**
 * Atualiza posição do ponteiro
 */
export function updatePointerPosition(
  state: PointerState,
  position: Vector2
): PointerState {

  return {
    ...state,
    position
  }
}

/**
 * Evento pointer down
 */
export function pointerDown(
  state: PointerState,
  position: Vector2
): PointerState {

  return {
    ...state,
    isDown: true,
    startPosition: position,
    position
  }
}

/**
 * Evento pointer up
 */
export function pointerUp(
  state: PointerState
): PointerState {

  return {
    ...state,
    isDown: false,
    startPosition: null
  }
}
