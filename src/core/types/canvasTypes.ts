/**
 * FILE: canvasTypes.ts
 *
 * Tipos centrais do motor Canvas2D
 * Responsabilidades:
 * • Tipos de seleção
 * • Hit test
 * • Estrutura do projeto
 * • Constantes do canvas
 */

import type { Point, Wall, Room, Door, Window, Furniture } from '@/types'

/**
 * Distância padrão de hit test
 */
export const HIT_TEST_THRESHOLD = 0.25

/**
 * Resultado de hit test
 */
export interface HitTestResult {
  id: string
  type: 'wall' | 'room' | 'door' | 'window' | 'furniture'
  distance: number
}

/**
 * Elemento selecionado
 */
export interface SelectedElement {
  id: string
  type: 'wall' | 'room' | 'door' | 'window' | 'furniture'
}

/**
 * Caixa de seleção (drag selection)
 */
export interface SelectionBox {
  start: Point
  current: Point
}

/**
 * Estrutura completa do projeto usada pelo Canvas
 */
export interface CanvasProjectElements {
  walls: Wall[]
  rooms: Room[]
  doors: Door[]
  windows: Window[]
  furniture: Furniture[]
  settings: {
    snapToGrid?: boolean
    snapToAngle?: boolean
    showGrid?: boolean
    showAxes?: boolean
    showMeasurements?: boolean
    gridSize?: number
    unit?: string
    snapAngles?: number[]
  }
}

/**
 * Tipos possíveis de elemento no canvas
 */
export type CanvasElementType =
  | 'wall'
  | 'room'
  | 'door'
  | 'window'
  | 'furniture'
