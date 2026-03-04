/**
 * FILE: gestureEngine.ts
 *
 * O que este arquivo faz:
 * Sistema de gestos do CasaPro.
 *
 * Responsabilidade:
 * - pinch zoom (dois dedos)
 * - pan com dois dedos
 * - rotate com dois dedos
 * - tap duplo
 * - long press
 * - cálculo de distância entre toques
 * - cálculo de centro do gesto
 * - velocidade e momentum
 * - limites de zoom e pan
 *
 * Compatível com:
 * - celular
 * - tablet
 * - desktop
 * - stylus
 * - mouse com modifiers
 */

import type { Vector2 } from '../project/projectTypes'

export type GestureType = 'none' | 'pan' | 'pinch' | 'rotate' | 'tap' | 'doubleTap' | 'longPress'

export interface TouchPoint {
  id: number
  position: Vector2
  timestamp: number
  pressure?: number
}

export interface GestureConfig {
  minZoom: number
  maxZoom: number
  minPanDistance: number
  pinchThreshold: number
  rotateThreshold: number
  doubleTapDelay: number
  longPressDelay: number
  momentumDecay: number
  enableMomentum: boolean
  enableRotation: boolean
}

export interface GestureMetrics {
  velocity: Vector2
  speed: number
  direction: number
  duration: number
}

export interface GestureState {
  type: GestureType
  touches: TouchPoint[]
  startDistance: number | null
  startCenter: Vector2 | null
  startAngle: number | null
  zoom: number
  pan: Vector2
  rotate: number
  lastCenter: Vector2 | null
  lastTimestamp: number
  metrics: GestureMetrics
  isActive: boolean
  tapCount: number
  tapStartTime: number | null
  initialTouch: TouchPoint | null
}

export interface GestureResult {
  type: GestureType
  zoom: number
  pan: Vector2
  rotate: number
  center: Vector2 | null
  metrics: GestureMetrics
  isComplete: boolean
}

// Configuração padrão premium
export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  minZoom: 0.1,
  maxZoom: 10,
  minPanDistance: 5,
  pinchThreshold: 10,
  rotateThreshold: 5,
  doubleTapDelay: 300,
  longPressDelay: 500,
  momentumDecay: 0.9,
  enableMomentum: true,
  enableRotation: true,
}

/**
 * Cria estado inicial de gesto
 */
export function createGestureState(): GestureState {
  return {
    type: 'none',
    touches: [],
    startDistance: null,
    startCenter: null,
    startAngle: null,
    zoom: 1,
    pan: { x: 0, y: 0 },
    rotate: 0,
    lastCenter: null,
    lastTimestamp: 0,
    metrics: {
      velocity: { x: 0, y: 0 },
      speed: 0,
      direction: 0,
      duration: 0,
    },
    isActive: false,
    tapCount: 0,
    tapStartTime: null,
    initialTouch: null,
  }
}

/**
 * Calcula distância entre dois pontos
 */
export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calcula centro entre dois pontos
 */
export function midpoint(a: Vector2, b: Vector2): Vector2 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

/**
 * Calcula ângulo entre dois pontos (em graus)
 */
export function angle(a: Vector2, b: Vector2): number {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)
}

/**
 * Calcula velocidade entre dois pontos e tempo
 */
function calculateVelocity(
  from: Vector2,
  to: Vector2,
  deltaTime: number
): Vector2 {
  if (deltaTime <= 0) return { x: 0, y: 0 }

  return {
    x: (to.x - from.x) / deltaTime,
    y: (to.y - from.y) / deltaTime,
  }
}

/**
 * Limita valor entre min e max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Aplica momentum ao pan
 */
function applyMomentum(
  velocity: Vector2,
  decay: number,
  deltaTime: number
): Vector2 {
  const factor = Math.pow(decay, deltaTime / 16)

  return {
    x: velocity.x * factor,
    y: velocity.y * factor,
  }
}

/**
 * Detecta tipo de gesto baseado nos toques
 */
function detectGestureType(
  state: GestureState,
  touches: TouchPoint[],
  config: GestureConfig
): GestureType {
  const count = touches.length

  if (count === 0) return 'none'
  if (count === 1) {
    if (state.tapCount === 1) return 'tap'
    return 'pan'
  }
  if (count >= 2) {
    if (config.enableRotation && state.startAngle !== null) {
      const currentAngle = angle(touches[0].position, touches[1].position)
      const angleDiff = Math.abs(currentAngle - state.startAngle)
      if (angleDiff > config.rotateThreshold) return 'rotate'
    }
    return 'pinch'
  }

  return 'none'
}

/**
 * Atualiza lista de toques com métricas avançadas
 */
export function updateTouches(
  state: GestureState,
  touches: TouchPoint[],
  config: GestureConfig = DEFAULT_GESTURE_CONFIG
): GestureResult {
  const now = performance.now()
  const deltaTime = now - state.lastTimestamp

  // Atualiza métricas de velocidade
  let velocity = { x: 0, y: 0 }
  if (state.lastCenter && touches.length > 0) {
    const currentCenter =
      touches.length === 1
        ? touches[0].position
        : midpoint(touches[0].position, touches[1].position)
    velocity = calculateVelocity(state.lastCenter, currentCenter, deltaTime)
  }

  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
  const direction = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI)

  const metrics: GestureMetrics = {
    velocity,
    speed,
    direction,
    duration: state.metrics.duration + deltaTime,
  }

  // Caso sem toques suficientes
  if (touches.length < 2) {
    const newState: GestureState = {
      ...state,
      touches,
      type: detectGestureType(state, touches, config),
      lastTimestamp: now,
      metrics,
      isActive: touches.length > 0,
    }

    return {
      type: newState.type,
      zoom: 1,
      pan: touches.length === 1 ? velocity : { x: 0, y: 0 },
      rotate: 0,
      center: touches.length === 1 ? touches[0].position : null,
      metrics,
      isComplete: touches.length === 0,
    }
  }

  // Processa gesto com dois ou mais dedos
  const a = touches[0].position
  const b = touches[1].position

  const dist = distance(a, b)
  const center = midpoint(a, b)
  const currentAngle = angle(a, b)

  // Inicializa gesto
  if (state.startDistance === null || state.startCenter === null) {
    const newState: GestureState = {
      ...state,
      touches,
      startDistance: dist,
      startCenter: center,
      startAngle: currentAngle,
      lastCenter: center,
      lastTimestamp: now,
      metrics,
      isActive: true,
    }

    return {
      type: 'pinch',
      zoom: 1,
      pan: { x: 0, y: 0 },
      rotate: 0,
      center,
      metrics,
      isComplete: false,
    }
  }

  // Calcula transformações
  let zoomFactor = dist / state.startDistance
  zoomFactor = clamp(zoomFactor, config.minZoom, config.maxZoom)

  let rotateDelta = 0
  if (config.enableRotation && state.startAngle !== null) {
    rotateDelta = currentAngle - state.startAngle
  }

  const panDelta = {
    x: center.x - state.startCenter.x,
    y: center.y - state.startCenter.y,
  }

  // Aplica momentum se habilitado
  let finalPan = panDelta
  if (config.enableMomentum && state.metrics.speed > 0.1) {
    const momentum = applyMomentum(state.metrics.velocity, config.momentumDecay, deltaTime)
    finalPan = {
      x: panDelta.x + momentum.x * deltaTime,
      y: panDelta.y + momentum.y * deltaTime,
    }
  }

  const newState: GestureState = {
    ...state,
    touches,
    type: detectGestureType(state, touches, config),
    zoom: zoomFactor,
    pan: finalPan,
    rotate: rotateDelta,
    lastCenter: center,
    lastTimestamp: now,
    metrics,
    isActive: true,
  }

  return {
    type: newState.type,
    zoom: zoomFactor,
    pan: finalPan,
    rotate: rotateDelta,
    center,
    metrics,
    isComplete: false,
  }
}

/**
 * Processa evento de tap
 */
export function processTap(
  state: GestureState,
  position: Vector2,
  config: GestureConfig = DEFAULT_GESTURE_CONFIG
): GestureResult {
  const now = performance.now()

  // Detecta double tap
  if (
    state.tapCount === 1 &&
    state.tapStartTime &&
    now - state.tapStartTime < config.doubleTapDelay
  ) {
    const newState: GestureState = {
      ...createGestureState(),
      tapCount: 0,
      tapStartTime: null,
    }

    return {
      type: 'doubleTap',
      zoom: 1,
      pan: { x: 0, y: 0 },
      rotate: 0,
      center: position,
      metrics: createGestureState().metrics,
      isComplete: true,
    }
  }

  const newState: GestureState = {
    ...state,
    tapCount: 1,
    tapStartTime: now,
    initialTouch: { id: 0, position, timestamp: now },
  }

  return {
    type: 'tap',
    zoom: 1,
    pan: { x: 0, y: 0 },
    rotate: 0,
    center: position,
    metrics: newState.metrics,
    isComplete: false,
  }
}

/**
 * Verifica long press
 */
export function checkLongPress(
  state: GestureState,
  currentPosition: Vector2,
  config: GestureConfig = DEFAULT_GESTURE_CONFIG
): GestureResult | null {
  if (!state.initialTouch || !state.tapStartTime) return null

  const now = performance.now()
  const elapsed = now - state.tapStartTime

  if (elapsed < config.longPressDelay) return null

  const moveDistance = distance(state.initialTouch.position, currentPosition)
  if (moveDistance > config.minPanDistance) return null

  return {
    type: 'longPress',
    zoom: 1,
    pan: { x: 0, y: 0 },
    rotate: 0,
    center: currentPosition,
    metrics: state.metrics,
    isComplete: true,
  }
}

/**
 * Limpa estado de gesto
 */
export function resetGesture(state: GestureState): GestureState {
  return createGestureState()
}

/**
 * Verifica se gesto está ativo
 */
export function isGestureActive(state: GestureState): boolean {
  return state.isActive && state.touches.length > 0
}

/**
 * Obtém escala normalizada do zoom
 */
export function getNormalizedZoom(
  state: GestureState,
  config: GestureConfig = DEFAULT_GESTURE_CONFIG
): number {
  return clamp(state.zoom, config.minZoom, config.maxZoom)
}

/**
 * Cria configuração personalizada
 */
export function createGestureConfig(
  overrides: Partial<GestureConfig>
): GestureConfig {
  return {
    ...DEFAULT_GESTURE_CONFIG,
    ...overrides,
  }
}
