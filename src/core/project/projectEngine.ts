/**
 * FILE: projectEngine.ts
 *
 * O que este arquivo faz:
 * Motor principal de manipulação do projeto CasaPro.
 *
 * Responsabilidade:
 * Controlar operações básicas do projeto:
 * - criar projeto
 * - adicionar parede
 * - remover parede
 *
 * Este arquivo será usado futuramente pelo Canvas2D e Canvas3D.
 */

import { ProjectData, Wall } from './projectTypes'

/**
 * Cria um projeto vazio
 */
export function createEmptyProject(name: string): ProjectData {
  return {
    id: crypto.randomUUID(),
    name,

    walls: [],
    doors: [],
    windows: [],
    furnitures: []
  }
}

/**
 * Adiciona uma parede ao projeto
 */
export function addWall(project: ProjectData, wall: Wall): ProjectData {
  return {
    ...project,
    walls: [...project.walls, wall]
  }
}

/**
 * Remove uma parede
 */
export function removeWall(project: ProjectData, wallId: string): ProjectData {
  return {
    ...project,
    walls: project.walls.filter(w => w.id !== wallId)
  }
}
