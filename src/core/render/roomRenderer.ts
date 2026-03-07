/**
 * FILE: roomRenderer.ts
 *
 * Renderizador de Cômodos - CasaPro
 * Responsabilidades:
 * • Renderizar área dos cômodos
 * • Hover / seleção
 * • Viewport culling
 */

import type { Room, Point } from '@/types'

export interface RenderContext {
  scale: number
  worldToCanvas: (p: Point) => Point
}

export interface RoomRenderOptions {
  isSelected: boolean
  isHovered: boolean
}

const COLORS = {
  fill: 'rgba(120,120,120,0.12)',
  hover: 'rgba(201,169,98,0.18)',
  selected: 'rgba(201,169,98,0.25)',
  border: 'rgba(255,255,255,0.08)',
  borderSelected: '#c9a962'
}

/**
 * Renderiza um cômodo
 */
export const renderRoom = (
  ctx: CanvasRenderingContext2D,
  room: Room,
  context: RenderContext,
  options: RoomRenderOptions,
  isInViewport: (points: Point[]) => boolean
): boolean => {
  // Early culling - verifica viewport antes de processar pontos
  if (!isInViewport(room.points)) {
    return false
  }

  const { worldToCanvas } = context
  const points = room.points.map(worldToCanvas)

  ctx.save()

  // Constrói path
  ctx.beginPath()
  const first = points[0]
  ctx.moveTo(first.x, first.y)
  
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    ctx.lineTo(p.x, p.y)
  }
  
  ctx.closePath()

  // Aplica fill com base no estado
  const fillColor = options.isSelected 
    ? COLORS.selected 
    : options.isHovered 
      ? COLORS.hover 
      : COLORS.fill
  
  ctx.fillStyle = fillColor
  ctx.fill()

  // Aplica stroke com base no estado
  ctx.lineWidth = options.isSelected ? 2 : 1
  ctx.strokeStyle = options.isSelected ? COLORS.borderSelected : COLORS.border
  ctx.stroke()

  ctx.restore()

  return true
}

/**
 * Renderização em lote com estatísticas
 */
export const renderRooms = (
  ctx: CanvasRenderingContext2D,
  rooms: Room[],
  context: RenderContext,
  selectedId: string | null,
  hoveredId: string | null,
  isInViewport: (points: Point[]) => boolean
): { rendered: number; culled: number } => {
  let rendered = 0
  let culled = 0

  for (const room of rooms) {
    const didRender = renderRoom(
      ctx,
      room,
      context,
      {
        isSelected: selectedId === room.id,
        isHovered: hoveredId === room.id
      },
      isInViewport
    )

    didRender ? rendered++ : culled++
  }

  return { rendered, culled }
}
