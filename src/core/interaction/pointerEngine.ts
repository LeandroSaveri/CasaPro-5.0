/**
 * FILE: pointerEngine.ts
 *
 * Sistema unificado de interação do CasaPro.
 */

import type { Vector2 } from '../project/projectTypes'

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

export function updatePointerPosition(
  state: PointerState,
  position: Vector2
): PointerState {
  return {
    ...state,
    position
  }
}

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

export function pointerUp(state: PointerState): PointerState {
  return {
    ...state,
    isDown: false,
    startPosition: null
  }
}

export const pointerEngine = {
  pointerDown,
  pointerUp,
  updatePointerPosition,
  createPointerState
}
