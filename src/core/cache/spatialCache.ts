import type { Point } from '@/types'

interface CacheStats {
  hits: number
  misses: number
}

class SpatialCache {

  private distanceCache = new Map<string, number>()
  private gridCache = new Map<string, Point>()

  private readonly maxSize: number

  private stats: CacheStats = {
    hits: 0,
    misses: 0
  }

  constructor(maxSize: number = 5000) {
    this.maxSize = maxSize
  }

  private getDistanceKey(a: Point, b: Point): string {
    return `${a.x.toFixed(4)},${a.y.toFixed(4)}|${b.x.toFixed(4)},${b.y.toFixed(4)}`
  }

  getDistance(a: Point, b: Point): number {

    const key = this.getDistanceKey(a, b)

    const cached = this.distanceCache.get(key)

    if (cached !== undefined) {
      this.stats.hits++
      return cached
    }

    this.stats.misses++

    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy)

    if (this.distanceCache.size >= this.maxSize) {
      this.distanceCache.clear()
    }

    this.distanceCache.set(key, dist)

    return dist
  }

  getGridPoint(point: Point, gridSize: number): Point {

    const key = `${point.x.toFixed(3)},${point.y.toFixed(3)}|${gridSize}`

    const cached = this.gridCache.get(key)

    if (cached) return cached

    const snapped = {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    }

    this.gridCache.set(key, snapped)

    return snapped
  }

  invalidateAround(point: Point, radius: number): void {

    const keysToDelete: string[] = []

    for (const key of this.distanceCache.keys()) {

      if (key.includes(point.x.toFixed(4)) || key.includes(point.y.toFixed(4))) {
        keysToDelete.push(key)
      }

    }

    keysToDelete.forEach(k => this.distanceCache.delete(k))
  }

  clear(): void {
    this.distanceCache.clear()
    this.gridCache.clear()
  }

  logStats(): void {

    const total = this.stats.hits + this.stats.misses

    const hitRate =
      total === 0
        ? 0
        : (this.stats.hits / total) * 100

    console.log('[SpatialCache]', {
      hitRate: `${hitRate.toFixed(1)}%`,
      size: `${this.distanceCache.size}/${this.maxSize}`,
      hits: this.stats.hits,
      misses: this.stats.misses
    })
  }

}

export const spatialCache = new SpatialCache()
