/**
 * FILE: hitTestEngine.ts
 *
 * Motor de Hit Test e Seleção
 */

import type { Point, Wall, Room, Door, Window, Furniture } from '@/types'
import { spatialCache } from '../cache/spatialCache'

import type {
  HitTestResult,
  SelectionBox,
  SelectedElement,
  CanvasProjectElements
} from '../types/canvasTypes'

import { HIT_TEST_THRESHOLD } from '../types/canvasTypes'

export interface HitTestConfig {
  threshold?: number
}

export class HitTestEngine {

  private projectElements: CanvasProjectElements | null
  private threshold: number

  constructor(
    projectElements: CanvasProjectElements | null,
    config: HitTestConfig = {}
  ) {

    this.projectElements = projectElements
    this.threshold = config.threshold ?? HIT_TEST_THRESHOLD

  }

  updateProjectElements(elements: CanvasProjectElements | null): void {
    this.projectElements = elements
  }

  hitTestFurniture(point: Point): HitTestResult | null {

    if (!this.projectElements?.furniture) return null

    let closest: HitTestResult | null = null
    let minDist = this.threshold

    for (const furniture of this.projectElements.furniture) {

      const halfWidth = furniture.scale.x / 2
      const halfDepth = furniture.scale.y / 2

      const dx = point.x - furniture.position.x
      const dy = point.y - furniture.position.y

      const cos = Math.cos(furniture.rotation)
      const sin = Math.sin(furniture.rotation)

      const localX = dx * cos + dy * sin
      const localY = -dx * sin + dy * cos

      if (
        Math.abs(localX) <= halfWidth &&
        Math.abs(localY) <= halfDepth
      ) {

        const dist = Math.hypot(dx, dy)

        if (dist < minDist) {

          minDist = dist

          closest = {
            id: furniture.id,
            type: 'furniture',
            distance: dist
          }

        }

      }

    }

    return closest

  }

  hitTestDoor(point: Point): HitTestResult | null {

    if (!this.projectElements?.doors || !this.projectElements?.walls)
      return null

    let closest: HitTestResult | null = null
    let minDist = this.threshold

    for (const door of this.projectElements.doors) {

      const wall = this.projectElements.walls.find(
        (w: Wall) => w.id === door.wallId
      )

      if (!wall) continue

      const t = door.position

      const doorPos: Point = {
        x: wall.start.x + (wall.end.x - wall.start.x) * t,
        y: wall.start.y + (wall.end.y - wall.start.y) * t
      }

      const dist = spatialCache.getDistance(doorPos, point)

      if (dist < minDist) {

        minDist = dist

        closest = {
          id: door.id,
          type: 'door',
          distance: dist
        }

      }

    }

    return closest

  }

  hitTestWindow(point: Point): HitTestResult | null {

    if (!this.projectElements?.windows || !this.projectElements?.walls)
      return null

    let closest: HitTestResult | null = null
    let minDist = this.threshold

    for (const window of this.projectElements.windows) {

      const wall = this.projectElements.walls.find(
        (w: Wall) => w.id === window.wallId
      )

      if (!wall) continue

      const t = window.position

      const windowPos: Point = {
        x: wall.start.x + (wall.end.x - wall.start.x) * t,
        y: wall.start.y + (wall.end.y - wall.start.y) * t
      }

      const dist = spatialCache.getDistance(windowPos, point)

      if (dist < minDist) {

        minDist = dist

        closest = {
          id: window.id,
          type: 'window',
          distance: dist
        }

      }

    }

    return closest

  }

  hitTestWall(point: Point): HitTestResult | null {

    if (!this.projectElements?.walls) return null

    let closest: HitTestResult | null = null
    let minDist = this.threshold

    for (const wall of this.projectElements.walls) {

      const dx = wall.end.x - wall.start.x
      const dy = wall.end.y - wall.start.y

      const len = Math.hypot(dx, dy)

      if (len === 0) continue

      const t = Math.max(
        0,
        Math.min(
          1,
          ((point.x - wall.start.x) * dx +
            (point.y - wall.start.y) * dy) /
            (len * len)
        )
      )

      const projX = wall.start.x + t * dx
      const projY = wall.start.y + t * dy

      const dist = spatialCache.getDistance(
        { x: projX, y: projY },
        point
      )

      const threshold =
        wall.thickness / 2 + this.threshold

      if (dist < threshold && dist < minDist) {

        minDist = dist

        closest = {
          id: wall.id,
          type: 'wall',
          distance: dist
        }

      }

    }

    return closest

  }

  hitTest(point: Point): HitTestResult | null {

    return (
      this.hitTestFurniture(point) ||
      this.hitTestDoor(point) ||
      this.hitTestWindow(point) ||
      this.hitTestWall(point)
    )

  }

}
