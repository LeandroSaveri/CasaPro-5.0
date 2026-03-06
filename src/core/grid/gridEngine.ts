/**
 * FILE: gridEngine.ts
 *
 * O que este arquivo faz:
 * Sistema de grid infinito do CasaPro.
 *
 * Responsabilidade:
 * - calcular grid adaptativo
 * - grid infinito
 * - linhas principais e secundárias
 * - adaptação ao zoom
 * - cálculo da área visível
 * - snap automático ao grid
 * - múltiplas unidades (metros, pés, pixels)
 * - estilos visuais dinâmicos
 * - otimização de performance
 * - labels de coordenadas
 *
 * Usado por:
 * Canvas2D
 * Canvas3D
 */

import type { Vector2 } from '../project/projectTypes'
import type { CameraBounds } from '../camera/cameraEngine'

export type GridUnit = 'meters' | 'feet' | 'pixels' | 'centimeters'
export type GridStyle = 'lines' | 'dots' | 'crosses'

export interface GridStyleConfig {
  majorColor: string
  minorColor: string
  majorWidth: number
  minorWidth: number
  majorOpacity: number
  minorOpacity: number
  dotSize: number
  crossSize: number
}

export interface GridConfig {
  baseSize: number
  subdivisions: number
  showSecondary: boolean
  fadeDistance: number
  unit: GridUnit
  style: GridStyle
  snapEnabled: boolean
  snapRadius: number
  showLabels: boolean
  labelInterval: number
  adaptiveDensity: boolean
  minZoomForLabels: number
  maxLines: number
  styles: GridStyleConfig
}

export interface GridLine {
  start: Vector2
  end: Vector2
  isMajor: boolean
  value: number
  opacity: number
}

export interface GridLabel {
  position: Vector2
  text: string
  isMajor: boolean
}

export interface GridResult {
  vertical: GridLine[]
  horizontal: GridLine[]
  labels: GridLabel[]
  spacing: number
  unit: GridUnit
  opacity: number
}

export interface SnapResult {
  position: Vector2
  snapped: boolean
  gridPosition: Vector2
}

// Configurações de estilo premium
const DEFAULT_GRID_STYLES: GridStyleConfig = {
  majorColor: '#FFD166',
  minorColor: '#118AB2',
  majorWidth: 1.5,
  minorWidth: 0.5,
  majorOpacity: 0.6,
  minorOpacity: 0.2,
  dotSize: 2,
  crossSize: 4,
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  baseSize: 100,
  subdivisions: 5,
  showSecondary: true,
  fadeDistance: 5000,
  unit: 'meters',
  style: 'lines',
  snapEnabled: true,
  snapRadius: 15,
  showLabels: true,
  labelInterval: 5,
  adaptiveDensity: true,
  minZoomForLabels: 0.5,
  maxLines: 200,
  styles: DEFAULT_GRID_STYLES,
}

// Fatores de conversão para metros
const UNIT_FACTORS: Record<GridUnit, number> = {
  meters: 1,
  centimeters: 100,
  feet: 3.28084,
  pixels: 100,
}

// Símbolos das unidades
const UNIT_SYMBOLS: Record<GridUnit, string> = {
  meters: 'm',
  centimeters: 'cm',
  feet: 'ft',
  pixels: 'px',
}

/**
 * Cria configuração personalizada
 */
export function createGridConfig(overrides: Partial<GridConfig>): GridConfig {
  return {
    ...DEFAULT_GRID_CONFIG,
    ...overrides,
    styles: {
      ...DEFAULT_GRID_STYLES,
      ...overrides.styles,
    },
  }
}

/**
 * Converte valor para unidade atual
 */
export function toUnit(value: number, unit: GridUnit): number {
  return value * UNIT_FACTORS[unit]
}

/**
 * Formata valor com unidade
 */
export function formatWithUnit(value: number, unit: GridUnit): string {
  const converted = toUnit(value, unit)
  const symbol = UNIT_SYMBOLS[unit]
  
  if (converted >= 1000) {
    return `${(converted / 1000).toFixed(1)}k${symbol}`
  }
  if (converted >= 1) {
    return `${Math.round(converted)}${symbol}`
  }
  return `${converted.toFixed(2)}${symbol}`
}

/**
 * Calcula tamanho ideal do grid baseado no zoom
 */
export function getGridSpacing(
  zoom: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): number {
  const base = config.baseSize
  const scaled = base / zoom

  const pow = Math.pow(10, Math.floor(Math.log10(scaled)))
  const normalized = scaled / pow

  let step = pow

  if (normalized > 5) step = 5 * pow
  else if (normalized > 2) step = 2 * pow

  // Ajusta densidade se necessário
  if (config.adaptiveDensity && zoom < 0.3) {
    step *= 2
  }

  return step
}

/**
 * Calcula opacidade baseada na distância
 */
function calculateOpacity(
  bounds: CameraBounds,
  config: GridConfig
): number {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const diagonal = Math.sqrt(width * width + height * height)

  if (diagonal >= config.fadeDistance) return 0

  const fadeStart = config.fadeDistance * 0.7
  if (diagonal <= fadeStart) return 1

  return 1 - (diagonal - fadeStart) / (config.fadeDistance - fadeStart)
}

/**
 * Calcula linhas verticais do grid
 */
function generateVerticalLines(
  bounds: CameraBounds,
  spacing: number,
  opacity: number,
  config: GridConfig
): GridLine[] {
  const lines: GridLine[] = []

  const start = Math.floor(bounds.minX / spacing) * spacing
  const end = Math.ceil(bounds.maxX / spacing) * spacing

  let count = 0
  for (let x = start; x <= end && count < config.maxLines / 2; x += spacing) {
    count++

    const divisionIndex = Math.floor(x / spacing)
    const isMajor = Math.abs(divisionIndex) % config.subdivisions === 0

    if (!config.showSecondary && !isMajor) continue

    const lineOpacity = isMajor 
      ? config.styles.majorOpacity 
      : config.styles.minorOpacity

    lines.push({
      start: { x, y: bounds.minY },
      end: { x, y: bounds.maxY },
      isMajor,
      value: x,
      opacity: lineOpacity * opacity,
    })
  }

  return lines
}

/**
 * Calcula linhas horizontais do grid
 */
function generateHorizontalLines(
  bounds: CameraBounds,
  spacing: number,
  opacity: number,
  config: GridConfig
): GridLine[] {
  const lines: GridLine[] = []

  const start = Math.floor(bounds.minY / spacing) * spacing
  const end = Math.ceil(bounds.maxY / spacing) * spacing

  let count = 0
  for (let y = start; y <= end && count < config.maxLines / 2; y += spacing) {
    count++

    const divisionIndex = Math.floor(y / spacing)
    const isMajor = Math.abs(divisionIndex) % config.subdivisions === 0

    if (!config.showSecondary && !isMajor) continue

    const lineOpacity = isMajor 
      ? config.styles.majorOpacity 
      : config.styles.minorOpacity

    lines.push({
      start: { x: bounds.minX, y },
      end: { x: bounds.maxX, y },
      isMajor,
      value: y,
      opacity: lineOpacity * opacity,
    })
  }

  return lines
}

/**
 * Gera labels do grid
 */
function generateLabels(
  vertical: GridLine[],
  horizontal: GridLine[],
  zoom: number,
  config: GridConfig
): GridLabel[] {
  if (!config.showLabels || zoom < config.minZoomForLabels) return []

  const labels: GridLabel[] = []

  // Labels verticais (eixo X)
  for (const line of vertical) {
    const divisionIndex = Math.floor(line.value / (line.isMajor ? config.subdivisions : 1))
    
    if (line.isMajor && Math.abs(divisionIndex) % config.labelInterval === 0) {
      labels.push({
        position: { x: line.value, y: 0 },
        text: formatWithUnit(line.value, config.unit),
        isMajor: true,
      })
    }
  }

  // Labels horizontais (eixo Y)
  for (const line of horizontal) {
    const divisionIndex = Math.floor(line.value / (line.isMajor ? config.subdivisions : 1))
    
    if (line.isMajor && Math.abs(divisionIndex) % config.labelInterval === 0) {
      labels.push({
        position: { x: 0, y: line.value },
        text: formatWithUnit(line.value, config.unit),
        isMajor: true,
      })
    }
  }

  return labels
}

/**
 * Gera grid completo
 */
export function generateGrid(
  bounds: CameraBounds,
  zoom: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): GridResult {
  const opacity = calculateOpacity(bounds, config)

  if (opacity <= 0) {
    return {
      vertical: [],
      horizontal: [],
      labels: [],
      spacing: 0,
      unit: config.unit,
      opacity: 0,
    }
  }

  const spacing = getGridSpacing(zoom, config)

  const vertical = generateVerticalLines(bounds, spacing, opacity, config)
  const horizontal = generateHorizontalLines(bounds, spacing, opacity, config)
  const labels = generateLabels(vertical, horizontal, zoom, config)

  return {
    vertical,
    horizontal,
    labels,
    spacing,
    unit: config.unit,
    opacity,
  }
}

/**
 * Verifica se grid deve ser renderizado
 */
export function shouldRenderGrid(
  bounds: CameraBounds,
  config: GridConfig = DEFAULT_GRID_CONFIG
): boolean {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY

  const distance = Math.sqrt(width * width + height * height)

  return distance < config.fadeDistance
}

/**
 * Calcula snap para o grid mais próximo
 */
export function snapToGrid(
  point: Vector2,
  zoom: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): SnapResult {
  if (!config.snapEnabled) {
    return {
      position: point,
      snapped: false,
      gridPosition: point,
    }
  }

  const spacing = getGridSpacing(zoom, config)

  const gridX = Math.round(point.x / spacing) * spacing
  const gridY = Math.round(point.y / spacing) * spacing

  const dist = Math.sqrt(
    Math.pow(point.x - gridX, 2) + Math.pow(point.y - gridY, 2)
  )

  const screenDist = dist * zoom

  if (screenDist > config.snapRadius) {
    return {
      position: point,
      snapped: false,
      gridPosition: { x: gridX, y: gridY },
    }
  }

  return {
    position: { x: gridX, y: gridY },
    snapped: true,
    gridPosition: { x: gridX, y: gridY },
  }
}

/**
 * Obtém ponto de origem do grid (0,0)
 */
export function getGridOrigin(): Vector2 {
  return { x: 0, y: 0 }
}

/**
 * Calcula distância até a linha de grid mais próxima
 */
export function distanceToNearestGridLine(
  point: Vector2,
  zoom: number,
  config: GridConfig = DEFAULT_GRID_CONFIG
): number {
  const spacing = getGridSpacing(zoom, config)

  const nearestX = Math.round(point.x / spacing) * spacing
  const nearestY = Math.round(point.y / spacing) * spacing

  const distX = Math.abs(point.x - nearestX)
  const distY = Math.abs(point.y - nearestY)

  return Math.min(distX, distY)
}

/**
 * Verifica se ponto está alinhado ao grid
 */
export function isAlignedToGrid(
  point: Vector2,
  zoom: number,
  tolerance: number = 0.5,
  config: GridConfig = DEFAULT_GRID_CONFIG
): boolean {
  const dist = distanceToNearestGridLine(point, zoom, config)
  return dist < tolerance / zoom
}
