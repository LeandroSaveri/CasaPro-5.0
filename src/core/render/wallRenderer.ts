/**
 * FILE: wallRenderer.ts
 *
 * Renderizador de Paredes - CasaPro
 * 
 * Responsabilidades:
 * - Renderização de paredes com espessura
 * - Cálculo de geometria de parede (contorno, preenchimento)
 * - Renderização de handles de seleção
 * - Culling de viewport
 */

import type { Wall, Point } from '@/types'

interface RenderContext {
  scale: number
  worldToCanvas: (point: Point) => Point
}

interface WallRenderOptions {
  isSelected: boolean
  isHovered: boolean
  isHighlighted: boolean
  showMeasurements: boolean
  settingsShowMeasurements: boolean
}

/**
 * Calcula os pontos do contorno de uma parede com espessura
 */
function calculateWallOutline(wall: Wall): { outer: Point[]; inner: Point[] } {
  const dx = wall.end.x - wall.start.x
  const dy = wall.end.y - wall.start.y
  const length = Math.hypot(dx, dy)
  
  if (length === 0) {
    return { outer: [], inner: [] }
  }
  
  // Vetor perpendicular normalizado
  const perpX = (-dy / length) * (wall.thickness / 2)
  const perpY = (dx / length) * (wall.thickness / 2)
  
  // Contorno externo
  const outer = [
    { x: wall.start.x + perpX, y: wall.start.y + perpY },
    { x: wall.end.x + perpX, y: wall.end.y + perpY },
    { x: wall.end.x - perpX, y: wall.end.y - perpY },
    { x: wall.start.x - perpX, y: wall.start.y - perpY }
  ]
  
  // Contorno interno (para paredes com espessura interna, se necessário)
  const inner = [
    { x: wall.start.x - perpX, y: wall.start.y - perpY },
    { x: wall.end.x - perpX, y: wall.end.y - perpY },
    { x: wall.end.x + perpX, y: wall.end.y + perpY },
    { x: wall.start.x + perpX, y: wall.start.y + perpY }
  ]
  
  return { outer, inner }
}

/**
 * Verifica se a parede está visível no viewport
 */
function isWallInViewport(
  wall: Wall, 
  context: RenderContext, 
  viewportCheck: (points: Point[], padding?: number) => boolean
): boolean {
  const outline = calculateWallOutline(wall)
  const allPoints = [...outline.outer, wall.start, wall.end]
  return viewportCheck(allPoints, 20)
}

/**
 * Desenha uma parede no canvas
 */
export function renderWall(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  context: RenderContext,
  options: WallRenderOptions,
  viewportCheck: (points: Point[], padding?: number) => boolean
): void {
  // Culling: não renderiza se não estiver no viewport
  if (!isWallInViewport(wall, context, viewportCheck)) {
    return
  }
  
  const { scale, worldToCanvas } = context
  const { isSelected, isHovered, showMeasurements, settingsShowMeasurements } = options
  
  const outline = calculateWallOutline(wall)
  
  // Converte pontos para canvas
  const canvasPoints = outline.outer.map(worldToCanvas)
  
  ctx.save()
  
  // === PREENCIMENTO DA PAREDE ===
  ctx.beginPath()
  ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y)
  for (let i = 1; i < canvasPoints.length; i++) {
    ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y)
  }
  ctx.closePath()
  
  // Cor de preenchimento base
  let fillColor = '#2a2a35'
  if (isSelected) {
    fillColor = '#3a3a4a'
  } else if (isHovered) {
    fillColor = '#323240'
  }
  
  ctx.fillStyle = fillColor
  ctx.fill()
  
  // === BORDA DA PAREDE ===
  let strokeColor = '#4a4a5a'
  let lineWidth = 2
  
  if (isSelected) {
    strokeColor = '#c9a962'
    lineWidth = 3
  } else if (isHovered) {
    strokeColor = '#8a8a9a'
    lineWidth = 2.5
  }
  
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
  
  // === LINHA CENTRAL (eixo da parede) ===
  const startCanvas = worldToCanvas(wall.start)
  const endCanvas = worldToCanvas(wall.end)
  
  ctx.beginPath()
  ctx.moveTo(startCanvas.x, startCanvas.y)
  ctx.lineTo(endCanvas.x, endCanvas.y)
  ctx.strokeStyle = isSelected ? '#c9a962' : 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.stroke()
  ctx.setLineDash([])
  
  // === PONTOS DE EXTREMIDADE ===
  const endpointRadius = isSelected ? 5 : 4
  
  // Ponto inicial
  ctx.beginPath()
  ctx.arc(startCanvas.x, startCanvas.y, endpointRadius, 0, Math.PI * 2)
  ctx.fillStyle = isSelected ? '#c9a962' : '#6a6a7a'
  ctx.fill()
  ctx.strokeStyle = '#1a1a1f'
  ctx.lineWidth = 2
  ctx.stroke()
  
  // Ponto final
  ctx.beginPath()
  ctx.arc(endCanvas.x, endCanvas.y, endpointRadius, 0, Math.PI * 2)
  ctx.fillStyle = isSelected ? '#c9a962' : '#6a6a7a'
  ctx.fill()
  ctx.stroke()
  
  // === MEDIDAS ===
  if (showMeasurements && settingsShowMeasurements) {
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y)
    const midX = (startCanvas.x + endCanvas.x) / 2
    const midY = (startCanvas.y + endCanvas.y) / 2
    
    // Ângulo da parede para rotacionar o texto
    const angle = Math.atan2(endCanvas.y - startCanvas.y, endCanvas.x - startCanvas.x)
    
    ctx.save()
    ctx.translate(midX, midY)
    
    // Ajusta rotação para não ficar de cabeça pra baixo
    let textAngle = angle
    if (Math.abs(angle) > Math.PI / 2) {
      textAngle += Math.PI
    }
    ctx.rotate(textAngle)
    
    const text = `${length.toFixed(2)}m`
    ctx.font = 'bold 11px Inter, system-ui, sans-serif'
    const textWidth = ctx.measureText(text).width
    
    // Fundo da medida
    ctx.fillStyle = 'rgba(10, 10, 15, 0.9)'
    ctx.fillRect(-textWidth / 2 - 4, -10, textWidth + 8, 20)
    
    // Texto
    ctx.fillStyle = isSelected ? '#c9a962' : '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 0, 0)
    
    ctx.restore()
  }
  
  // === HANDLES DE SELEÇÃO (quando selecionada) ===
  if (isSelected) {
    const handleSize = 8
    
    // Handle central (mover)
    const midCanvas = {
      x: (startCanvas.x + endCanvas.x) / 2,
      y: (startCanvas.y + endCanvas.y) / 2
    }
    
    ctx.fillStyle = '#c9a962'
    ctx.fillRect(midCanvas.x - handleSize / 2, midCanvas.y - handleSize / 2, handleSize, handleSize)
    ctx.strokeStyle = '#1a1a1f'
    ctx.lineWidth = 2
    ctx.strokeRect(midCanvas.x - handleSize / 2, midCanvas.y - handleSize / 2, handleSize, handleSize)
  }
  
  ctx.restore()
}
