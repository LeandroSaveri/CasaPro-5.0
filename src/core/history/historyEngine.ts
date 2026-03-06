/**
 * FILE: historyEngine.ts
 *
 * O que este arquivo faz:
 * Sistema de histórico do CasaPro.
 *
 * Responsabilidade:
 * Permitir:
 * - undo
 * - redo
 * - histórico de alterações do projeto
 */

import type { ProjectData } from '../project/projectTypes'

export interface HistoryState {
  past: ProjectData[]
  present: ProjectData
  future: ProjectData[]
}

/**
 * Inicializa histórico
 */
export function createHistory(initial: ProjectData): HistoryState {
  return {
    past: [],
    present: initial,
    future: []
  }
}

/**
 * Registra nova alteração
 */
export function pushHistory(
  history: HistoryState,
  newState: ProjectData
): HistoryState {
  return {
    past: [...history.past, history.present],
    present: newState,
    future: []
  }
}

/**
 * Desfazer ação
 */
export function undo(history: HistoryState): HistoryState {
  if (history.past.length === 0) return history

  const previous = history.past[history.past.length - 1]

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future]
  }
}

/**
 * Refazer ação
 */
export function redo(history: HistoryState): HistoryState {
  if (history.future.length === 0) return history

  const next = history.future[0]

  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1)
  }
}
