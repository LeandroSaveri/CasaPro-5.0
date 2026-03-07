import type { Point } from '@/types'

export function worldToCanvas(
  point: Point,
  scale: number,
  offset: Point,
  canvasWidth: number,
  canvasHeight: number
): Point {
  return {
    x: point.x * scale + offset.x + canvasWidth / 2,
    y: -point.y * scale + offset.y + canvasHeight / 2,
  }
}

export function canvasToWorld(
  point: Point,
  scale: number,
  offset: Point,
  canvasWidth: number,
  canvasHeight: number
): Point {
  return {
    x: (point.x - offset.x - canvasWidth / 2) / scale,
    y: -(point.y - offset.y - canvasHeight / 2) / scale,
  }
}
