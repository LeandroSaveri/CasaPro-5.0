/**
 * FILE: snapVisualUtils.ts
 *
 * O que este arquivo faz:
 * Renderiza indicadores visuais de snap no Canvas2D.
 *
 * Responsabilidade:
 * - desenhar indicadores de snap
 * - animações suaves de transição
 * - múltiplos estilos visuais
 * - preview de candidatos
 * - feedback tátil visual
 */

import type { Vector2 } from '../project/projectTypes'
import type { SnapType, SnapCandidate, SnapResult } from './advancedSnapEngine'

export interface SnapVisualStyle {
  primaryColor: string
  secondaryColor: string
  glowColor: string
  lineWidth: number
  fontSize: number
  fontFamily: string
  showLabel: boolean
  showDistance: boolean
  animated: boolean
  crosshairSize: number
  glowIntensity: number
}

export interface SnapAnimationState {
  opacity: number
  scale: number
  timestamp: number
  pulsePhase: number
}

// Estilos premium predefinidos
export const SNAP_STYLES = {
  default: {
    primaryColor: '#FFD166',
    secondaryColor: '#EF476F',
    glowColor: '#FFD166',
    lineWidth: 2,
    fontSize: 10,
    fontFamily: 'Inter, system-ui, sans-serif',
    showLabel: true,
    showDistance: false,
    animated: true,
    crosshairSize: 6,
    glowIntensity: 15,
  } as SnapVisualStyle,

  endpoint: {
    primaryColor: '#06D6A0',
    secondaryColor: '#118AB2',
    glowColor: '#06D6A0',
    lineWidth: 2.5,
    fontSize: 11,
    fontFamily: 'Inter, system-ui, sans-serif',
    showLabel: true,
    showDistance: true,
    animated: true,
    crosshairSize: 8,
    glowIntensity: 20,
  } as SnapVisualStyle,

  intersection: {
    primaryColor: '#EF476F',
    secondaryColor: '#FFD166',
    glowColor: '#EF476F',
    lineWidth: 2.5,
    fontSize: 11,
    fontFamily: 'Inter, system-ui, sans-serif',
    showLabel: true,
    showDistance: true,
    animated: true,
    crosshairSize: 10,
    glowIntensity: 25,
  } as SnapVisualStyle,

  perpendicular: {
    primaryColor: '#9D4EDD',
    secondaryColor: '#C77DFF',
    glowColor: '#9D4EDD',
    lineWidth: 2,
    fontSize: 10,
    fontFamily: 'Inter, system-ui, sans-serif',
    showLabel: true,
    showDistance: false,
    animated: true,
    crosshairSize: 7,
    glowIntensity: 18,
  } as SnapVisualStyle,

  grid: {
    primaryColor: '#118AB2',
    secondaryColor: '#073B4C',
    glowColor: '#118AB2',
    lineWidth: 1.5,
    fontSize: 9,
    fontFamily: 'Inter, system-ui, sans-serif',
    showLabel: false,
    showDistance: false,
    animated: false,
    crosshairSize: 5,
    glowIntensity: 10,
  } as SnapVisualStyle,

  angle: {
    primaryColor: '#FF6B35',
    secondaryColor: '#F7931E',
    glowColor: '#FF6B35',
    lineWidth: 2,
    fontSize: 10,
    fontFamily: 'Inter, system-ui, sans-serif',
    showLabel: true,
    showDistance: true,
    animated: true,
    crosshairSize: 7,
    glowIntensity: 16,
  } as SnapVisualStyle,
} as const

// Estado de animação global por tipo
const animationStates = new Map<SnapType, SnapAnimationState>()

/**
 * Obtém estilo visual por tipo de snap
 */
export function getStyleForSnapType(type: SnapType): SnapVisualStyle {
  switch (type) {
    case 'endpoint':
      return SNAP_STYLES.endpoint
    case 'midpoint':
      return SNAP_STYLES.default
    case 'intersection':
      return SNAP_STYLES.intersection
    case 'perpendicular':
      return SNAP_STYLES.perpendicular
    case 'grid':
      return SNAP_STYLES.grid
    case 'angle':
      return SNAP_STYLES.angle
    case 'extension':
      return SNAP_STYLES.default
    default:
      return SNAP_STYLES.default
  }
}

/**
 * Atualiza estado de animação por tipo
 */
function updateAnimationState(type: SnapType, style: SnapVisualStyle): SnapAnimationState {
  const now = performance.now()
  const existing = animationStates.get(type)

  if (!existing) {
    const state: SnapAnimationState = {
      opacity: 0,
      scale: 0.5,
      timestamp: now,
      pulsePhase: 0,
    }
    animationStates.set(type, state)
    return state
  }

  const elapsed = now - existing.timestamp
  const pulseSpeed = 0.003

  existing.pulsePhase = (elapsed * pulseSpeed) % (Math.PI * 2)
  existing.opacity = Math.min(1, existing.opacity + 0.15)
  existing.scale = Math.min(1, existing.scale + 0.1)

  if (!style.animated) {
    existing.opacity = 1
    existing.scale = 1
  }

  return existing
}

/**
 * Limpa estados de animação antigos
 */
export function cleanupAnimationStates(maxAge: number = 5000): void {
  const now = performance.now()
  for (const [type, state] of animationStates.entries()) {
    if (now - state.timestamp > maxAge) {
      animationStates.delete(type)
    }
  }
}

/**
 * Desenha indicador de snap principal (premium)
 */
export function drawSnapIndicator(
  ctx: CanvasRenderingContext2D,
  point: Vector2,
  type: SnapType,
  style?: SnapVisualStyle
): void {

  const visualStyle = style ?? getStyleForSnapType(type)
  const animState = updateAnimationState(type, visualStyle)

  ctx.save()

  // Configura glow
  if (visualStyle.glowIntensity > 0) {
    ctx.shadowColor = visualStyle.glowColor
    ctx.shadowBlur = visualStyle.glowIntensity * animState.opacity
  }

  ctx.strokeStyle = visualStyle.primaryColor
  ctx.lineWidth = visualStyle.lineWidth
  ctx.globalAlpha = animState.opacity

  const size = visualStyle.crosshairSize * animState.scale

  // Desenha crosshair animado
  ctx.beginPath()

  // Círculo central pulsante
  const pulseScale = 1 + Math.sin(animState.pulsePhase) * 0.15
  ctx.arc(point.x, point.y, size * pulseScale, 0, Math.PI * 2)
  ctx.stroke()

  // Linhas cruzadas
  ctx.beginPath()
  ctx.moveTo(point.x - size * 1.5, point.y)
  ctx.lineTo(point.x - size * 0.5, point.y)
  ctx.moveTo(point.x + size * 0.5, point.y)
  ctx.lineTo(point.x + size * 1.5, point.y)
  ctx.moveTo(point.x, point.y - size * 1.5)
  ctx.lineTo(point.x, point.y - size * 0.5)
  ctx.moveTo(point.x, point.y + size * 0.5)
  ctx.lineTo(point.x, point.y + size * 1.5)
  ctx.stroke()

  // Label
  if (visualStyle.showLabel) {
    ctx.fillStyle = visualStyle.primaryColor
    ctx.font = `${visualStyle.fontSize}px ${visualStyle.fontFamily}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'

    const label = getSnapLabel(type)
    const labelX = point.x + size + 4
    const labelY = point.y - size - 2

    // Background do label
    const metrics = ctx.measureText(label)
    const padding = 3
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(
      labelX - padding,
      labelY - visualStyle.fontSize - padding,
      metrics.width + padding * 2,
      visualStyle.fontSize + padding * 2
    )

    // Texto do label
    ctx.fillStyle = visualStyle.primaryColor
    ctx.fillText(label, labelX, labelY)
  }

  ctx.restore()
}

/**
 * Desenha preview de múltiplos candidatos de snap
 */
export function drawSnapCandidatesPreview(
  ctx: CanvasRenderingContext2D,
  candidates: SnapCandidate[],
  maxCandidates: number = 3
): void {

  const topCandidates = candidates
    .filter(c => c.type !== 'none')
    .slice(0, maxCandidates)

  for (let i = 0; i < topCandidates.length; i++) {
    const candidate = topCandidates[i]
    const isBest = i === 0
    const opacity = isBest ? 1 : 0.4 - (i * 0.1)

    ctx.save()
    ctx.globalAlpha = opacity

    const style = getStyleForSnapType(candidate.type)

    // Círculo menor para candidatos secundários
    const size = isBest ? style.crosshairSize : style.crosshairSize * 0.6

    ctx.strokeStyle = style.primaryColor
    ctx.lineWidth = isBest ? style.lineWidth : 1
    ctx.setLineDash(isBest ? [] : [2, 2])

    ctx.beginPath()
    ctx.arc(candidate.position.x, candidate.position.y, size, 0, Math.PI * 2)
    ctx.stroke()

    // Linha conectando ao candidato
    if (i > 0 && topCandidates[0]) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(topCandidates[0].position.x, topCandidates[0].position.y)
      ctx.lineTo(candidate.position.x, candidate.position.y)
      ctx.stroke()
    }

    ctx.restore()
  }
}

/**
 * Desenha resultado completo de snap com informações
 */
export function drawSnapResult(
  ctx: CanvasRenderingContext2D,
  result: SnapResult,
  showCandidates: boolean = true
): void {

  if (!result.snapped) return

  // Desenha candidatos secundários primeiro (abaixo)
  if (showCandidates && result.candidates.length > 1) {
    drawSnapCandidatesPreview(ctx, result.candidates.slice(1))
  }

  // Desenha indicador principal
  drawSnapIndicator(ctx, result.position, result.type)

  // Linha guia do ponto original
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(result.originalPosition.x, result.originalPosition.y)
  ctx.lineTo(result.position.x, result.position.y)
  ctx.stroke()
  ctx.restore()
}

/**
 * Desenha linha de snap ativa (durante desenho)
 */
export function drawActiveSnapLine(
  ctx: CanvasRenderingContext2D,
  from: Vector2,
  to: Vector2,
  type: SnapType
): void {

  const style = getStyleForSnapType(type)

  ctx.save()

  // Linha principal
  ctx.strokeStyle = style.primaryColor
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.globalAlpha = 0.8

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  // Pontos de origem e destino
  ctx.fillStyle = style.primaryColor
  ctx.globalAlpha = 0.6

  ctx.beginPath()
  ctx.arc(from.x, from.y, 3, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.arc(to.x, to.y, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * Obtém label localizado para tipo de snap
 */
function getSnapLabel(type: SnapType): string {
  switch (type) {
    case 'endpoint':
      return 'END'
    case 'midpoint':
      return 'MID'
    case 'intersection':
      return 'INT'
    case 'perpendicular':
      return 'PERP'
    case 'grid':
      return 'GRID'
    case 'angle':
      return 'ANG'
    case 'extension':
      return 'EXT'
    case 'none':
      return ''
    default:
      return ''
  }
}

/**
 * Obtém descrição completa do tipo de snap
 */
export function getSnapDescription(type: SnapType): string {
  switch (type) {
    case 'endpoint':
      return 'Endpoint'
    case 'midpoint':
      return 'Midpoint'
    case 'intersection':
      return 'Intersection'
    case 'perpendicular':
      return 'Perpendicular'
    case 'grid':
      return 'Grid'
    case 'angle':
      return 'Angle'
    case 'extension':
      return 'Extension'
    case 'none':
      return 'None'
    default:
      return 'Unknown'
  }
}

/**
 * Cria estilo visual personalizado
 */
export function createCustomStyle(
  baseType: keyof typeof SNAP_STYLES,
  overrides: Partial<SnapVisualStyle>
): SnapVisualStyle {
  return {
    ...SNAP_STYLES[baseType],
    ...overrides,
  }
}
