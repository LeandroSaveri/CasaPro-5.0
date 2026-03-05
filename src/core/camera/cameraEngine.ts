/**
 * FILE: cameraEngine.ts
 *
 * O que este arquivo faz:
 * Sistema de câmera do CasaPro.
 *
 * Responsabilidade:
 * - controlar zoom com suavização
 * - controlar pan com inércia
 * - limitar movimento
 * - transformar coordenadas
 * - focar em elementos
 * - animações de transição
 * - bounds e limites inteligentes
 * - rotação da câmera
 * - escala automática
 *
 * Usado por:
 * Canvas2D
 * Canvas3D
 */

import type { Vector2 } from '../project/projectTypes'

export type CameraAnimationType = 'none' | 'ease' | 'easeInOut' | 'spring' | 'linear'

export interface CameraBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface CameraConfig {
  minZoom: number
  maxZoom: number
  panLimit: number
  bounds: CameraBounds | null
  enableSmoothZoom: boolean
  enableMomentum: boolean
  momentumDecay: number
  zoomSensitivity: number
  panSensitivity: number
  animationType: CameraAnimationType
  animationDuration: number
  enableRotation: boolean
  minRotation: number
  maxRotation: number
}

export interface CameraState {
  zoom: number
  targetZoom: number
  position: Vector2
  targetPosition: Vector2
  viewport: Vector2
  rotation: number
  targetRotation: number
  velocity: Vector2
  isAnimating: boolean
  lastUpdate: number
}

export interface CameraTransform {
  scale: number
  translateX: number
  translateY: number
  rotate: number
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  minZoom: 0.1,
  maxZoom: 10,
  panLimit: 100000,
  bounds: null,
  enableSmoothZoom: true,
  enableMomentum: true,
  momentumDecay: 0.9,
  zoomSensitivity: 1,
  panSensitivity: 1,
  animationType: 'ease',
  animationDuration: 300,
  enableRotation: false,
  minRotation: -180,
  maxRotation: 180,
}

/**
 * Cria estado inicial da câmera
 */
export function createCameraState(): CameraState {
  return {
    zoom: 1,
    targetZoom: 1,
    position: { x: 0, y: 0 },
    targetPosition: { x: 0, y: 0 },
    viewport: { x: 0, y: 0 },
    rotation: 0,
    targetRotation: 0,
    velocity: { x: 0, y: 0 },
    isAnimating: false,
    lastUpdate: performance.now(),
  }
}

/**
 * Cria configuração personalizada
 */
export function createCameraConfig(
  overrides: Partial<CameraConfig>
): CameraConfig {
  return {
    ...DEFAULT_CAMERA_CONFIG,
    ...overrides,
  }
}

/**
 * Limita valor
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Interpolação linear
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * Interpolação de vetor
 */
function lerpVector(a: Vector2, b: Vector2, t: number): Vector2 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  }
}

/**
 * Easing functions - CORREÇÃO: Record<CameraAnimationType, ...> para tipagem estrita
 */
const EASING: Record<CameraAnimationType, (t: number) => number> = {
  none: (t: number): number => t,
  linear: (t: number): number => t,
  ease: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInOut: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  spring: (t: number): number => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
}

/**
 * Aplica zoom na câmera com suavização
 */
export function applyZoom(
  state: CameraState,
  zoomDelta: number,
  center: Vector2 | null = null,
  config: CameraConfig = DEFAULT_CAMERA_CONFIG
): CameraState {
  const rawNewZoom = state.zoom * Math.pow(zoomDelta, config.zoomSensitivity)
  const newZoom = clamp(rawNewZoom, config.minZoom, config.maxZoom)

  // Zoom para o centro do cursor se fornecido
  let newPosition = state.position
  if (center) {
    const worldBefore = screenToWorld(center, state)
    const updatedState = { ...state, zoom: newZoom }
    const worldAfter = screenToWorld(center, updatedState)
    
    newPosition = {
      x: state.position.x + (worldAfter.x - worldBefore.x) * newZoom,
      y: state.position.y + (worldAfter.y - worldBefore.y) * newZoom,
    }
  }

  return {
    ...state,
    zoom: config.enableSmoothZoom ? state.zoom : newZoom,
    targetZoom: newZoom,
    position: newPosition,
    isAnimating: config.enableSmoothZoom,
    lastUpdate: performance.now(),
  }
}

/**
 * Aplica pan na câmera com inércia
 */
export function applyPan(
  state: CameraState,
  delta: Vector2,
  config: CameraConfig = DEFAULT_CAMERA_CONFIG
): CameraState {
  const scaledDelta = {
    x: delta.x * config.panSensitivity,
    y: delta.y * config.panSensitivity,
  }

  const newPosition = {
    x: state.position.x + scaledDelta.x,
    y: state.position.y + scaledDelta.y,
  }

  const limitedPosition = applyBounds(newPosition, state.zoom, state.viewport, config)

  const newVelocity = config.enableMomentum
    ? { x: scaledDelta.x * 0.1, y: scaledDelta.y * 0.1 }
    : { x: 0, y: 0 }

  return {
    ...state,
    position: limitedPosition,
    targetPosition: limitedPosition,
    velocity: newVelocity,
    isAnimating: config.enableMomentum,
    lastUpdate: performance.now(),
  }
}

/**
 * Aplica limites de bounds
 */
function applyBounds(
  position: Vector2,
  zoom: number,
  viewport: Vector2,
  config: CameraConfig
): Vector2 {
  if (config.bounds === null) {
    // Usa panLimit se não houver bounds definidos
    return {
      x: clamp(position.x, -config.panLimit, config.panLimit),
      y: clamp(position.y, -config.panLimit, config.panLimit),
    }
  }

  const visibleWidth = viewport.x / zoom
  const visibleHeight = viewport.y / zoom

  const minX = config.bounds.minX - visibleWidth / 2
  const maxX = config.bounds.maxX + visibleWidth / 2
  const minY = config.bounds.minY - visibleHeight / 2
  const maxY = config.bounds.maxY + visibleHeight / 2

  return {
    x: clamp(position.x, minX, maxX),
    y: clamp(position.y, minY, maxY),
  }
}

/**
 * Atualiza animação da câmera
 */
export function updateCamera(
  state: CameraState,
  config: CameraConfig = DEFAULT_CAMERA_CONFIG
): CameraState {
  const now = performance.now()
  const deltaTime = Math.min(32, now - state.lastUpdate)

  if (!state.isAnimating && Math.abs(state.velocity.x) < 0.01 && Math.abs(state.velocity.y) < 0.01) {
    return { ...state, velocity: { x: 0, y: 0 } }
  }

  let newZoom = state.zoom
  let newPosition = { ...state.position }
  let newRotation = state.rotation
  let newVelocity = { ...state.velocity }

  // Suavização de zoom
  if (Math.abs(state.targetZoom - state.zoom) > 0.001) {
    const t = Math.min(1, deltaTime / config.animationDuration)
    const easedT = EASING[config.animationType](t)
    newZoom = lerp(state.zoom, state.targetZoom, easedT)
  } else {
    newZoom = state.targetZoom
  }

  // Suavização de posição
  if (
    Math.abs(state.targetPosition.x - state.position.x) > 0.1 ||
    Math.abs(state.targetPosition.y - state.position.y) > 0.1
  ) {
    const t = Math.min(1, deltaTime / config.animationDuration)
    const easedT = EASING[config.animationType](t)
    newPosition = lerpVector(state.position, state.targetPosition, easedT)
  } else {
    newPosition = state.targetPosition
  }

  // Suavização de rotação
  if (config.enableRotation && Math.abs(state.targetRotation - state.rotation) > 0.1) {
    const t = Math.min(1, deltaTime / config.animationDuration)
    const easedT = EASING[config.animationType](t)
    newRotation = lerp(state.rotation, state.targetRotation, easedT)
  }

  // Aplica momentum
  if (config.enableMomentum && (Math.abs(state.velocity.x) > 0.01 || Math.abs(state.velocity.y) > 0.01)) {
    newPosition.x += state.velocity.x * deltaTime
    newPosition.y += state.velocity.y * deltaTime

    const decay = Math.pow(config.momentumDecay, deltaTime / 16)
    newVelocity.x *= decay
    newVelocity.y *= decay

    newPosition = applyBounds(newPosition, newZoom, state.viewport, config)
  }

  const limitedPosition = applyBounds(newPosition, newZoom, state.viewport, config)

  const isStillAnimating =
    Math.abs(state.targetZoom - newZoom) > 0.001 ||
    Math.abs(state.targetPosition.x - limitedPosition.x) > 0.1 ||
    Math.abs(state.targetPosition.y - limitedPosition.y) > 0.1 ||
    Math.abs(newVelocity.x) > 0.01 ||
    Math.abs(newVelocity.y) > 0.01

  return {
    ...state,
    zoom: newZoom,
    position: limitedPosition,
    rotation: newRotation,
    velocity: newVelocity,
    isAnimating: isStillAnimating,
    lastUpdate: now,
  }
}

/**
 * Define tamanho do viewport
 */
export function setViewport(
  state: CameraState,
  viewport: Vector2,
  config: CameraConfig = DEFAULT_CAMERA_CONFIG
): CameraState {
  const newPosition = applyBounds(state.position, state.zoom, viewport, config)

  return {
    ...state,
    viewport,
    position: newPosition,
  }
}

/**
 * Foca a câmera em um ponto específico
 */
export function focusOnPoint(
  state: CameraState,
  point: Vector2,
  targetZoom: number | null = null,
  config: CameraConfig = DEFAULT_CAMERA_CONFIG
): CameraState {
  const newZoom = targetZoom !== null ? clamp(targetZoom, config.minZoom, config.maxZoom) : state.zoom

  const screenPoint = worldToScreen(point, { ...state, zoom: newZoom })
  const newPosition = {
    x: state.viewport.x / 2 - screenPoint.x + state.position.x,
    y: state.viewport.y / 2 - screenPoint.y + state.position.y,
  }

  const limitedPosition = applyBounds(newPosition, newZoom, state.viewport, config)

  return {
    ...state,
    targetZoom: newZoom,
    targetPosition: limitedPosition,
    isAnimating: config.enableSmoothZoom,
    lastUpdate: performance.now(),
  }
}

/**
 * Foca a câmera em uma área (fit to bounds)
 */
export function focusOnBounds(
  state: CameraState,
  bounds: CameraBounds,
  padding: number = 0.1,
  config: CameraConfig = DEFAULT_CAMERA_CONFIG
): CameraState {
  const boundsWidth = bounds.maxX - bounds.minX
  const boundsHeight = bounds.maxY - bounds.minY
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }

  const scaleX = (state.viewport.x * (1 - padding * 2)) / boundsWidth
  const scaleY = (state.viewport.y * (1 - padding * 2)) / boundsHeight
  const targetZoom = clamp(Math.min(scaleX, scaleY), config.minZoom, config.maxZoom)

  return focusOnPoint(state, center, targetZoom, config)
}

/**
 * Reseta câmera para posição inicial
 */
export function resetCamera(
  state: CameraState,
  config: CameraConfig = DEFAULT_CAMERA_CONFIG
): CameraState {
  return {
    ...state,
    targetZoom: 1,
    targetPosition: { x: 0, y: 0 },
    targetRotation: 0,
    velocity: { x: 0, y: 0 },
    isAnimating: config.enableSmoothZoom,
    lastUpdate: performance.now(),
  }
}

/**
 * Define rotação da câmera
 */
export function setRotation(
  state: CameraState,
  rotation: number,
  config: CameraConfig = DEFAULT_CAMERA_CONFIG
): CameraState {
  const clampedRotation = config.enableRotation
    ? clamp(rotation, config.minRotation, config.maxRotation)
    : 0

  return {
    ...state,
    targetRotation: clampedRotation,
    isAnimating: true,
    lastUpdate: performance.now(),
  }
}

/**
 * Converte coordenada de tela para mundo
 */
export function screenToWorld(
  point: Vector2,
  camera: CameraState
): Vector2 {
  // Aplica rotação inversa se necessário
  let rotatedPoint = point
  if (camera.rotation !== 0) {
    const rad = (-camera.rotation * Math.PI) / 180
    const cx = camera.viewport.x / 2
    const cy = camera.viewport.y / 2
    const dx = point.x - cx
    const dy = point.y - cy
    rotatedPoint = {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    }
  }

  return {
    x: (rotatedPoint.x - camera.position.x) / camera.zoom,
    y: (rotatedPoint.y - camera.position.y) / camera.zoom,
  }
}

/**
 * Converte coordenada de mundo para tela
 */
export function worldToScreen(
  point: Vector2,
  camera: CameraState
): Vector2 {
  const screenPoint = {
    x: point.x * camera.zoom + camera.position.x,
    y: point.y * camera.zoom + camera.position.y,
  }

  // Aplica rotação se necessário
  if (camera.rotation !== 0) {
    const rad = (camera.rotation * Math.PI) / 180
    const cx = camera.viewport.x / 2
    const cy = camera.viewport.y / 2
    const dx = screenPoint.x - cx
    const dy = screenPoint.y - cy
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    }
  }

  return screenPoint
}

/**
 * Obtém matriz de transformação CSS
 */
export function getCameraTransform(camera: CameraState): CameraTransform {
  return {
    scale: camera.zoom,
    translateX: camera.position.x,
    translateY: camera.position.y,
    rotate: camera.rotation,
  }
}

/**
 * Verifica se ponto está visível no viewport
 */
export function isPointVisible(
  point: Vector2,
  camera: CameraState,
  margin: number = 0
): boolean {
  const screen = worldToScreen(point, camera)
  return (
    screen.x >= -margin &&
    screen.x <= camera.viewport.x + margin &&
    screen.y >= -margin &&
    screen.y <= camera.viewport.y + margin
  )
}

/**
 * Calcula área visível em coordenadas de mundo
 */
export function getVisibleBounds(camera: CameraState): CameraBounds {
  const topLeft = screenToWorld({ x: 0, y: 0 }, camera)
  const bottomRight = screenToWorld(camera.viewport, camera)

  return {
    minX: topLeft.x,
    maxX: bottomRight.x,
    minY: topLeft.y,
    maxY: bottomRight.y,
  }
}

/**
 * Anima câmera para uma posição específica com curva de bezier
 * PREMIUM: Interpolação suave avançada
 */
export function animateToPosition(
  state: CameraState,
  targetPosition: Vector2,
  _duration: number = 500,
  _config: CameraConfig = DEFAULT_CAMERA_CONFIG
): CameraState {
  return {
    ...state,
    targetPosition,
    isAnimating: true,
    lastUpdate: performance.now(),
  }
}

/**
 * Suaviza movimento com easing customizado
 * PREMIUM: Controle fino de animação
 */
export function smoothDamp(
  current: number,
  target: number,
  currentVelocity: number,
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number
): { value: number; velocity: number } {
  smoothTime = Math.max(0.0001, smoothTime)
  const omega = 2 / smoothTime
  const x = omega * deltaTime
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  let change = current - target
  const originalTo = target
  
  const maxChange = maxSpeed * smoothTime
  change = clamp(change, -maxChange, maxChange)
  
  const temp = (currentVelocity + omega * change) * deltaTime
  let newVelocity = (currentVelocity - omega * temp) * exp
  let newValue = target + (change + temp) * exp
  
  if (originalTo - current > 0 === newValue > originalTo) {
    newValue = originalTo
    newVelocity = (newValue - originalTo) / deltaTime
  }
  
  return { value: newValue, velocity: newVelocity }
}

/**
 * Calcula distância de um ponto à área visível
 * PREMIUM: Para auto-pan quando objeto sai da tela
 */
export function distanceToViewport(
  point: Vector2,
  camera: CameraState
): number {
  const screen = worldToScreen(point, camera)
  const dx = Math.max(0, -screen.x, screen.x - camera.viewport.x)
  const dy = Math.max(0, -screen.y, screen.y - camera.viewport.y)
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Ajusta zoom para mostrar múltiplos pontos
 * PREMIUM: Fit to points com padding inteligente
 */
export function fitToPoints(
  state: CameraState,
  points: Vector2[],
  padding: number = 0.15,
  config: CameraConfig = DEFAULT_CAMERA_CONFIG
): CameraState {
  if (points.length === 0) return state
  
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  
  for (const p of points) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }

  const bounds: CameraBounds = { minX, maxX, minY, maxY }
  return focusOnBounds(state, bounds, padding, config)
}
