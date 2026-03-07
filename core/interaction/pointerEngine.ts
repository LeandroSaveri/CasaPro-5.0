import type { Point } from '@/types'

export interface PointerEngineParams {
  toolMode: string
  isPanning: boolean
  isDrawing: boolean
  isDragSelecting: boolean
  isDraggingElement: boolean
}

export const pointerEngine = {}
