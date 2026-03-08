/**
 * FILE: renderEngine.ts
 *
 * Motor de Renderização 2D Premium
 */

import type { Point, Wall, Room, Door, Window, Furniture } from '@/types'
import { spatialCache } from '@/core/cache/spatialCache'
import type {
  SnapPoint,
  SelectionBox,
  SelectedElement,
  CanvasProjectElements
} from '@/core/types/canvasTypes'

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  scale: number
  offset: { x: number; y: number }
  metrics: {
    width: number
    height: number
    centerX: number
    centerY: number
  }
  worldToCanvas: (point: Point) => Point
  isInViewport: (points: Point[], padding?: number) => boolean
}

export interface RenderState {
  selectedElements: SelectedElement[]
  hoveredElement: { id: string | null; type: string | null }
  highlightedElement: string | null
  snapIndicator: SnapPoint | null
  isDrawing: boolean
  drawStart: Point | null
  drawCurrent: Point | null
  isDragSelecting: boolean
  selectionBox: SelectionBox | null
  showMeasurements: boolean
  projectElements: CanvasProjectElements | null
}

export class RenderEngine {
  private context: RenderContext
  private state: RenderState

  constructor(context: RenderContext, state: RenderState) {
    this.context = context
    this.state = state
  }

  updateState(state: Partial<RenderState>): void {
    this.state = { ...this.state, ...state }
  }

  clear(): void {
    const { ctx, metrics } = this.context
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, metrics.width, metrics.height)
  }

  drawGrid(): void {
    const { ctx, scale, offset, metrics } = this.context
    const { projectElements } = this.state

    if (!projectElements?.settings.showGrid) return

    const { width, height } = metrics
    const gridSize = (projectElements.settings.gridSize ?? 0.5) * scale

    if (gridSize < 1) return

    const startX = offset.x % gridSize
    const startY = offset.y % gridSize

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    ctx.beginPath()

    const xStart = Math.max(0, startX - gridSize)
    const xEnd = width + gridSize

    for (let x = xStart; x < xEnd; x += gridSize) {
      if (x >= 0 && x <= width) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
    }

    const yStart = Math.max(0, startY - gridSize)
    const yEnd = height + gridSize

    for (let y = yStart; y < yEnd; y += gridSize) {
      if (y >= 0 && y <= height) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
    }

    ctx.stroke()

    if (gridSize > 10) {
      ctx.strokeStyle = 'rgba(201,169,98,0.08)'
      ctx.lineWidth = 1.5
      ctx.beginPath()

      const majorGridSize = gridSize * 5
      const majorStartX = offset.x % majorGridSize
      const majorStartY = offset.y % majorGridSize

      for (let x = majorStartX; x < width; x += majorGridSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }

      for (let y = majorStartY; y < height; y += majorGridSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }

      ctx.stroke()
    }

    if (projectElements.settings.showAxes) {
      ctx.strokeStyle = 'rgba(201,169,98,0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()

      ctx.moveTo(metrics.centerX + offset.x, 0)
      ctx.lineTo(metrics.centerX + offset.x, height)

      ctx.moveTo(0, metrics.centerY + offset.y)
      ctx.lineTo(width, metrics.centerY + offset.y)

      ctx.stroke()
    }

    ctx.restore()
  }

  drawRoom(room: Room, isSelected: boolean, isHovered: boolean): void {
    const { ctx, worldToCanvas, isInViewport } = this.context
    
    if (room.points.length < 3) return
    if (!isInViewport(room.points, 20)) return
    
    const canvasPoints = room.points.map(worldToCanvas)
    
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y)
    for (let i = 1; i < canvasPoints.length; i++) {
      ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y)
    }
    ctx.closePath()
    
    if (isSelected) {
      ctx.fillStyle = 'rgba(201, 169, 98, 0.15)'
      ctx.strokeStyle = '#c9a962'
      ctx.lineWidth = 2
    } else if (isHovered) {
      ctx.fillStyle = 'rgba(201, 169, 98, 0.08)'
      ctx.strokeStyle = '#d4b87a'
      ctx.lineWidth = 1.5
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
    }
    
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  drawWall(wall: Wall, isSelected: boolean, isHovered: boolean, isHighlighted: boolean): void {
    const { ctx, scale, worldToCanvas, isInViewport } = this.context
    const { showMeasurements, projectElements } = this.state

    const start = worldToCanvas(wall.start)
    const end = worldToCanvas(wall.end)

    const thickness = Math.max(wall.thickness * scale, 4)

    if (!isInViewport([wall.start, wall.end], thickness)) return

    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.hypot(dx, dy) || 1

    const perpX = (-dy / length) * thickness / 2
    const perpY = (dx / length) * thickness / 2

    ctx.save()

    if (isHighlighted) {
      ctx.shadowColor = 'rgba(201,169,98,0.8)'
      ctx.shadowBlur = 20
    } else if (isSelected || isHovered) {
      ctx.shadowColor = 'rgba(201,169,98,0.5)'
      ctx.shadowBlur = isSelected ? 12 : 8
    }

    ctx.fillStyle = isSelected ? '#c9a962' : isHovered ? '#d4b87a' : (wall.color || '#4a4a5a')

    ctx.beginPath()
    ctx.moveTo(start.x + perpX, start.y + perpY)
    ctx.lineTo(end.x + perpX, end.y + perpY)
    ctx.lineTo(end.x - perpX, end.y - perpY)
    ctx.lineTo(start.x - perpX, start.y - perpY)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = isSelected ? '#ffffff' : isHovered ? '#c9a962' : 'rgba(0,0,0,0.4)'
    ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1
    ctx.lineJoin = 'round'
    ctx.stroke()

    ctx.restore()

    if (showMeasurements && projectElements?.settings.showMeasurements && scale > 5) {
      const wallLength = spatialCache.getDistance(wall.start, wall.end)
      const midX = (start.x + end.x) / 2
      const midY = (start.y + end.y) / 2

      const text = `${wallLength.toFixed(2)}m`

      ctx.font = `bold ${Math.max(10, 11 * (scale / 20))}px Inter`
      const textWidth = ctx.measureText(text).width

      ctx.fillStyle = 'rgba(10,10,15,0.85)'
      ctx.fillRect(midX - textWidth / 2 - 6, midY - 18, textWidth + 12, 20)

      ctx.fillStyle = isSelected ? '#c9a962' : '#e5e5e5'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, midX, midY - 8)
    }
  }

  drawDoor(door: Door, walls: Wall[], isSelected: boolean, isHovered: boolean): void {
    const { ctx, scale, worldToCanvas } = this.context
    
    const wall = walls.find(w => w.id === door.wallId)
    if (!wall) return
    
    const t = door.position
    const doorPos: Point = {
      x: wall.start.x + (wall.end.x - wall.start.x) * t,
      y: wall.start.y + (wall.end.y - wall.start.y) * t
    }
    
    const canvasPos = worldToCanvas(doorPos)
    const doorSize = Math.max(0.8 * scale, 12)
    
    ctx.save()
    ctx.fillStyle = isSelected ? '#c9a962' : isHovered ? '#d4b87a' : '#6a6a7a'
    ctx.strokeStyle = isSelected ? '#ffffff' : '#4a4a5a'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, doorSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    ctx.restore()
  }

  drawWindow(window: Window, walls: Wall[], isSelected: boolean, isHovered: boolean): void {
    const { ctx, scale, worldToCanvas } = this.context
    
    const wall = walls.find(w => w.id === window.wallId)
    if (!wall) return
    
    const t = window.position
    const windowPos: Point = {
      x: wall.start.x + (wall.end.x - wall.start.x) * t,
      y: wall.start.y + (wall.end.y - wall.start.y) * t
    }
    
    const canvasPos = worldToCanvas(windowPos)
    const windowSize = Math.max(0.6 * scale, 10)
    
    ctx.save()
    ctx.fillStyle = isSelected ? '#c9a962' : isHovered ? '#d4b87a' : '#4a8a9a'
    ctx.strokeStyle = isSelected ? '#ffffff' : '#4a4a5a'
    ctx.lineWidth = 2
    
    ctx.fillRect(
      canvasPos.x - windowSize / 2,
      canvasPos.y - windowSize / 2,
      windowSize,
      windowSize
    )
    ctx.strokeRect(
      canvasPos.x - windowSize / 2,
      canvasPos.y - windowSize / 2,
      windowSize,
      windowSize
    )
    
    ctx.restore()
  }

  drawFurniture(furniture: Furniture, isSelected: boolean, isHovered: boolean): void {
    const { ctx, scale, worldToCanvas } = this.context
    
    const pos = worldToCanvas(furniture.position)
    const width = furniture.scale.x * scale
    const height = furniture.scale.y * scale
    
    ctx.save()
    ctx.translate(pos.x, pos.y)
    ctx.rotate(furniture.rotation)
    
    ctx.fillStyle = isSelected ? '#c9a962' : isHovered ? '#d4b87a' : (furniture.color || '#5a5a6a')
    ctx.strokeStyle = isSelected ? '#ffffff' : '#4a4a5a'
    ctx.lineWidth = 2
    
    ctx.fillRect(-width / 2, -height / 2, width, height)
    ctx.strokeRect(-width / 2, -height / 2, width, height)
    
    ctx.restore()
  }

  drawPreview(calculateAngle: (a: Point, b: Point) => number): void {
    const { ctx, worldToCanvas } = this.context
    const { isDrawing, drawStart, drawCurrent } = this.state

    if (!isDrawing || !drawStart || !drawCurrent) return

    const start = worldToCanvas(drawStart)
    const end = worldToCanvas(drawCurrent)

    ctx.save()

    ctx.strokeStyle = '#c9a962'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 5])
    ctx.lineDashOffset = -performance.now() / 20

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

    ctx.setLineDash([])

    const dist = spatialCache.getDistance(drawStart, drawCurrent)
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2

    const text = `${dist.toFixed(2)}m`

    ctx.font = 'bold 13px Inter'
    const textWidth = ctx.measureText(text).width

    ctx.fillStyle = 'rgba(10,10,15,0.95)'
    ctx.fillRect(midX - textWidth / 2 - 8, midY - 26, textWidth + 16, 26)

    ctx.fillStyle = '#c9a962'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, midX, midY - 13)

    const angle = calculateAngle(drawStart, drawCurrent)
    const angleText = `${angle.toFixed(0)}°`
    const angleWidth = ctx.measureText(angleText).width

    ctx.fillStyle = 'rgba(10,10,15,0.95)'
    ctx.fillRect(start.x - angleWidth / 2 - 8, start.y - 32, angleWidth + 16, 22)

    ctx.fillStyle = '#ffffff'
    ctx.fillText(angleText, start.x, start.y - 21)

    ctx.restore()
  }

  drawSnapIndicator(): void {
    const { ctx, worldToCanvas } = this.context
    const { snapIndicator } = this.state
    
    if (!snapIndicator) return
    
    const point = worldToCanvas(snapIndicator.point)
    
    ctx.save()
    ctx.strokeStyle = '#c9a962'
    ctx.fillStyle = 'rgba(201, 169, 98, 0.25)'
    ctx.lineWidth = 2.5
    
    const pulse = 1 + Math.sin(performance.now() / 150) * 0.25
    const baseRadius = 10
    
    ctx.beginPath()
    ctx.arc(point.x, point.y, baseRadius * pulse, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(201, 169, 98, 0.15)'
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(point.x, point.y, baseRadius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(201, 169, 98, 0.35)'
    ctx.fill()
    ctx.stroke()
    
    const crossSize = 18
    ctx.beginPath()
    ctx.moveTo(point.x - crossSize, point.y)
    ctx.lineTo(point.x + crossSize, point.y)
    ctx.moveTo(point.x, point.y - crossSize)
    ctx.lineTo(point.x, point.y + crossSize)
    ctx.lineWidth = 2
    ctx.stroke()
    
    ctx.restore()
  }

  drawSelectionBox(): void {
    const { ctx, worldToCanvas } = this.context
    const { isDragSelecting, selectionBox } = this.state
    
    if (!isDragSelecting || !selectionBox) return
    
    const start = worldToCanvas(selectionBox.start)
    const end = worldToCanvas(selectionBox.current)
    
    const minX = Math.min(start.x, end.x)
    const maxX = Math.max(start.x, end.x)
    const minY = Math.min(start.y, end.y)
    const maxY = Math.max(start.y, end.y)
    
    ctx.save()
    
    ctx.fillStyle = 'rgba(201, 169, 98, 0.15)'
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY)
    
    ctx.strokeStyle = '#c9a962'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.lineDashOffset = -performance.now() / 30
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
    
    ctx.restore()
  }

  renderAll(calculateAngle: (a: Point, b: Point) => number): void {
    const { projectElements, selectedElements, hoveredElement } = this.state

    this.clear()
    this.drawGrid()

    if (!projectElements) return

    projectElements.rooms.forEach((room: Room) => {
      const isSelected = selectedElements.some(e => e.id === room.id && e.type === 'room')
      const isHovered = hoveredElement.id === room.id && hoveredElement.type === 'room'
      this.drawRoom(room, isSelected, isHovered)
    })

    projectElements.walls.forEach((wall: Wall) => {
      const isSelected = selectedElements.some(e => e.id === wall.id && e.type === 'wall')
      const isHovered = hoveredElement.id === wall.id && hoveredElement.type === 'wall'
      const isHighlighted = this.state.highlightedElement === wall.id

      this.drawWall(wall, isSelected, isHovered, isHighlighted)
    })

    projectElements.doors.forEach((door: Door) => {
      const isSelected = selectedElements.some(e => e.id === door.id && e.type === 'door')
      const isHovered = hoveredElement.id === door.id && hoveredElement.type === 'door'

      this.drawDoor(door, projectElements.walls, isSelected, isHovered)
    })

    projectElements.windows.forEach((window: Window) => {
      const isSelected = selectedElements.some(e => e.id === window.id && e.type === 'window')
      const isHovered = hoveredElement.id === window.id && hoveredElement.type === 'window'

      this.drawWindow(window, projectElements.walls, isSelected, isHovered)
    })

    projectElements.furniture.forEach((furniture: Furniture) => {
      const isSelected = selectedElements.some(e => e.id === furniture.id && e.type === 'furniture')
      const isHovered = hoveredElement.id === furniture.id && hoveredElement.type === 'furniture'

      this.drawFurniture(furniture, isSelected, isHovered)
    })

    this.drawPreview(calculateAngle)
    this.drawSnapIndicator()
    this.drawSelectionBox()
  }
}
