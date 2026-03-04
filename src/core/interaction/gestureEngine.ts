/**
 * FILE: gestureEngine.ts
 *
 * O que este arquivo faz:
 * Sistema avançado de gestos do CasaPro.
 *
 * Responsabilidade:
 * - pinch zoom (dois dedos)
 * - pan com dois dedos
 * - suavização de movimento
 * - suporte para mobile, tablet e desktop touch
 *
 * Compatível com:
 * Canvas2D
 * Canvas3D
 */

export interface GestureCallbacks {
  onPan?: (dx: number, dy: number) => void
  onZoom?: (scale: number, centerX: number, centerY: number) => void
}

interface TouchPoint {
  x: number
  y: number
}

export class GestureEngine {

  private element: HTMLElement | null = null
  private callbacks: GestureCallbacks | null = null

  private pointers: Map<number, TouchPoint> = new Map()

  private lastDistance = 0
  private lastCenter: TouchPoint | null = null

  attach(element: HTMLElement, callbacks: GestureCallbacks) {

    this.element = element
    this.callbacks = callbacks

    element.addEventListener('pointerdown', this.handlePointerDown, { passive: false })
    element.addEventListener('pointermove', this.handlePointerMove, { passive: false })
    element.addEventListener('pointerup', this.handlePointerUp)
    element.addEventListener('pointercancel', this.handlePointerUp)

  }

  detach() {

    if (!this.element) return

    this.element.removeEventListener('pointerdown', this.handlePointerDown)
    this.element.removeEventListener('pointermove', this.handlePointerMove)
    this.element.removeEventListener('pointerup', this.handlePointerUp)
    this.element.removeEventListener('pointercancel', this.handlePointerUp)

    this.pointers.clear()
    this.lastDistance = 0
    this.lastCenter = null
  }

  private handlePointerDown = (e: PointerEvent) => {

    if (!this.element) return

    this.element.setPointerCapture(e.pointerId)

    this.pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    })

  }

  private handlePointerMove = (e: PointerEvent) => {

    if (!this.pointers.has(e.pointerId)) return

    this.pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY
    })

    if (this.pointers.size === 2) {

      const points = Array.from(this.pointers.values())

      const p1 = points[0]
      const p2 = points[1]

      const dx = p2.x - p1.x
      const dy = p2.y - p1.y

      const distance = Math.sqrt(dx * dx + dy * dy)

      const center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
      }

      if (this.lastDistance !== 0 && this.callbacks?.onZoom) {

        const scale = distance / this.lastDistance

        this.callbacks.onZoom(scale, center.x, center.y)

      }

      if (this.lastCenter && this.callbacks?.onPan) {

        const panX = center.x - this.lastCenter.x
        const panY = center.y - this.lastCenter.y

        this.callbacks.onPan(panX, panY)

      }

      this.lastDistance = distance
      this.lastCenter = center

    }

  }

  private handlePointerUp = (e: PointerEvent) => {

    this.pointers.delete(e.pointerId)

    if (this.pointers.size < 2) {
      this.lastDistance = 0
      this.lastCenter = null
    }

  }

}
