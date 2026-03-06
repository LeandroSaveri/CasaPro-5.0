/**
 * FILE: projectTypes.ts
 *
 * O que este arquivo faz:
 * Define os tipos principais do projeto CasaPro.
 *
 * Responsabilidade:
 * Estrutura de dados usada por todo o sistema:
 * - paredes
 * - portas
 * - janelas
 * - móveis
 * - terreno
 */

export interface Vector2 {
  x: number
  y: number
}

export interface Wall {
  id: string
  start: Vector2
  end: Vector2
  thickness: number
  height: number
}

export interface Door {
  id: string
  position: Vector2
  width: number
  height: number
  wallId: string
}

export interface Window {
  id: string
  position: Vector2
  width: number
  height: number
  wallId: string
}

export interface Furniture {
  id: string
  type: string
  position: Vector2
  rotation: number
}

export interface ProjectData {
  id: string
  name: string

  walls: Wall[]
  doors: Door[]
  windows: Window[]
  furnitures: Furniture[]
}
