/**
 * FILE: wallEditingEngine.ts
 *
 * Sistema de Edição de Paredes - CasaPro
 */

import type { Wall, Point } from '@/types'

export interface WallHandle {
  type: 'start' | 'end' | 'move'
  wallId: string
  position: Point
}

export class WallEditingEngine {

  static getWallHandles(wall: Wall): WallHandle[] {
    return [
      { 
        type: 'start', 
        wallId: wall.id,
        position: wall.start 
      },
      { 
        type: 'end', 
        wallId: wall.id,
        position: wall.end 
      },
      { 
        type: 'move', 
        wallId: wall.id,
        position: {
          x: (wall.start.x + wall.end.x) / 2,
          y: (wall.start.y + wall.end.y) / 2
        }
      }
    ]
  }

  static moveWall(wall: Wall, delta: Point): Wall {
    return {
      ...wall,
      start: {
        x: wall.start.x + delta.x,
        y: wall.start.y + delta.y
      },
      end: {
        x: wall.end.x + delta.x,
        y: wall.end.y + delta.y
      }
    }
  }

  static moveWallStart(wall: Wall, newPoint: Point): Wall {
    return {
      ...wall,
      start: newPoint
    }
  }

  static moveWallEnd(wall: Wall, newPoint: Point): Wall {
    return {
      ...wall,
      end: newPoint
    }
  }
}
