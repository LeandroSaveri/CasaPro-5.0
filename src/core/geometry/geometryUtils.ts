/**
 * FILE: geometry.ts
 *
 * Utilitários matemáticos para operações geométricas 2D.
 * Usado em cálculos de canvas, snapping e transformações.
 */

/**
 * Representa um vetor/ponto 2D no espaço cartesiano
 */
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

/**
 * Representa um retângulo delimitador (bounding box)
 */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Distância euclidiana entre dois vetores/pontos
 */
export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Distância ao quadrado (mais rápida quando não precisa da distância real)
 */
export function distanceSquared(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

/**
 * Ângulo em radianos entre dois vetores/pontos
 */
export function angle(a: Vector2, b: Vector2): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * Ponto médio entre dois vetores/pontos
 */
export function midpoint(a: Vector2, b: Vector2): Vector2 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

/**
 * Interpolação linear entre dois vetores/pontos
 */
export function lerp(a: Vector2, b: Vector2, t: number): Vector2 {
  const clampedT = clamp(t, 0, 1);
  return {
    x: a.x + (b.x - a.x) * clampedT,
    y: a.y + (b.y - a.y) * clampedT
  };
}

/**
 * Projeta um ponto em um segmento de linha
 */
export function projectPointOnLine(point: Vector2, lineStart: Vector2, lineEnd: Vector2): Vector2 {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  
  if (lenSq === 0) return lineStart;
  
  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq));
  
  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };
}

/**
 * Rotaciona um vetor/ponto em torno de um centro
 */
export function rotate(point: Vector2, center: Vector2, angleRad: number): Vector2 {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}

/**
 * Limita um valor dentro de um intervalo
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Converte radianos para graus
 */
export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

/**
 * Converte graus para radianos
 */
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Compara dois vetores com tolerância para erro de ponto flutuante
 */
export function equals(a: Vector2, b: Vector2, epsilon: number = 1e-10): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

/**
 * Verifica se um ponto está dentro de um retângulo
 */
export function pointInRect(point: Vector2, rect: Rect): boolean {
  return point.x >= rect.x && 
         point.x <= rect.x + rect.width &&
         point.y >= rect.y && 
         point.y <= rect.y + rect.height;
}

/**
 * Centro de um retângulo
 */
export function rectCenter(rect: Rect): Vector2 {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}
/**
 * ============================================
 * FUNÇÕES AVANÇADAS EXTRAÍDAS DO CANVAS PREMIUM
 * ============================================
 */

/**
 * Calcula interseção entre dois segmentos de linha
 */
export function getLineIntersection(
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  p4: Vector2
): Vector2 | null {

  const denom =
    (p1.x - p2.x) * (p3.y - p4.y) -
    (p1.y - p2.y) * (p3.x - p4.x)

  if (Math.abs(denom) < 1e-10) return null

  const t =
    ((p1.x - p3.x) * (p3.y - p4.y) -
      (p1.y - p3.y) * (p3.x - p4.x)) / denom

  const u =
    -((p1.x - p2.x) * (p1.y - p3.y) -
      (p1.y - p2.y) * (p1.x - p3.x)) / denom

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y)
    }
  }

  return null
}

/**
 * Calcula área de um polígono usando Shoelace Formula
 */
export function calculatePolygonArea(points: Vector2[]): number {

  if (points.length < 3) return 0

  let area = 0

  for (let i = 0; i < points.length; i++) {

    const j = (i + 1) % points.length

    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }

  return Math.abs(area) / 2
}
