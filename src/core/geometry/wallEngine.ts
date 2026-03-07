// ============================================
// FILE: wallEngine.ts
// CasaPro Geometry Engine
// ============================================

import type { Point, Wall } from '@/types';

export interface WallDraft {
  start: Point;
  end: Point;
}

export interface WallEngineConfig {
  defaultThickness: number;
  minWallLength: number;      // NOVO: evita hardcoded 0.05
  connectionTolerance: number; // NOVO: evita hardcoded 0.001
}

// ============================================
// CONSTANTES (evita magic numbers)
// ============================================

const DEFAULT_CONFIG: Required<WallEngineConfig> = {
  defaultThickness: 0.2,
  minWallLength: 0.05,
  connectionTolerance: 0.001
} as const;

// ============================================
// UTILIDADES (memoização interna, pure functions)
// ============================================

/**
 * Calcula distância euclidiana entre dois pontos
 * Otimizado: Math.hypot é mais preciso que Math.sqrt(dx*dx + dy*dy)
 */
const distance = (a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
};

/**
 * Gera ID único com timestamp para evitar colisões em burst
 */
const generateId = (): string => {
  return `wall_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
};

/**
 * Verifica se dois pontos são aproximadamente iguais
 * UX: tolerância configurável para snapping visual
 */
const pointsEqual = (a: Point, b: Point, tolerance: number): boolean => {
  return Math.abs(a.x - b.x) < tolerance && Math.abs(a.y - b.y) < tolerance;
};

// ============================================
// WALL ENGINE
// ============================================

export class WallEngine {

  private config: Required<WallEngineConfig>;

  constructor(config?: Partial<WallEngineConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }

// ============================================
// CRIAR PAREDE
// ============================================

/**
 * Cria uma parede entre dois pontos
 * UX: retorna null se muito curta (evita paredes acidentais)
 */
createWall(start: Point, end: Point): Wall | null {

  // ==========================================
  // SNAP PARA PONTOS EXISTENTES
  // ==========================================

  const snapThreshold = 0.2;

  for (const wall of this.walls ?? []) {

    if (pointsEqual(wall.start, start, snapThreshold)) {
      start = wall.start;
    }

    if (pointsEqual(wall.end, start, snapThreshold)) {
      start = wall.end;
    }

    if (pointsEqual(wall.start, end, snapThreshold)) {
      end = wall.start;
    }

    if (pointsEqual(wall.end, end, snapThreshold)) {
      end = wall.end;
    }

  }

  // ==========================================
  // CALCULA COMPRIMENTO
  // ==========================================

  const length = distance(start, end);

  // Validação: evita parede zero ou acidental
  if (length < this.config.minWallLength) {
    return null;
  }

  return {
    id: generateId(),
    start,
    end,
    thickness: this.config.defaultThickness,
    height: 2.8,
    color: "#444444",
    material: "default",
    layer: "structure",
    metadata: {
      length,
      angle: Math.atan2(end.y - start.y, end.x - start.x)
    }
  };
}

/**
 * Cria parede a partir de um draft (UX melhorado para UI)
 */
createWallFromDraft(draft: WallDraft): Wall | null {
  return this.createWall(draft.start, draft.end);
}

  // ============================================
  // CRIAR PAREDE CONTÍNUA (CHAIN)
  // ============================================

  /**
   * Cria parede conectada ao final da anterior
   * UX: mantém fluxo contínuo de desenho (ex: SketchUp style)
   */
  createChainedWall(
    previousWall: Wall | null,
    endPoint: Point
  ): Wall | null {
    if (!previousWall) return null;
    
    // UX: snapping automático ao ponto final anterior
    const start = previousWall.end;
    
    return this.createWall(start, endPoint);
  }

  /**
   * Cria parede reversa (conectada ao início da anterior)
   * UX: permite extender para trás também
   */
  createReverseChainedWall(
    previousWall: Wall | null,
    endPoint: Point
  ): Wall | null {
    if (!previousWall) return null;
    
    return this.createWall(previousWall.start, endPoint);
  }

  // ============================================
  // VERIFICAÇÃO DE CONEXÕES
  // ============================================

  /**
   * Verifica se duas paredes estão conectadas (topologia)
   * Performance: early return com verificações mais baratas primeiro
   */
  areConnected(a: Wall, b: Wall): boolean {
    const { connectionTolerance: tol } = this.config;
    
    // Early returns: verificações mais prováveis primeiro
    if (pointsEqual(a.end, b.start, tol)) return true;
    if (pointsEqual(a.start, b.end, tol)) return true;
    
    // Conexões invertidas (paredes desenhadas em direções opostas)
    if (pointsEqual(a.end, b.end, tol)) return true;
    if (pointsEqual(a.start, b.start, tol)) return true;
    
    return false;
  }

  /**
   * Encontra o ponto de conexão entre duas paredes
   * UX: útil para snapping e merge de paredes
   */
  getConnectionPoint(a: Wall, b: Wall): Point | null {
    const { connectionTolerance: tol } = this.config;
    
    if (pointsEqual(a.end, b.start, tol) || pointsEqual(a.end, b.end, tol)) {
      return a.end;
    }
    if (pointsEqual(a.start, b.start, tol) || pointsEqual(a.start, b.end, tol)) {
      return a.start;
    }
    return null;
  }

  // ============================================
  // GEOMETRIA DERIVADA (helpers para render)
  // ============================================

  /**
   * Calcula o ângulo da parede em radianos
   * UX: útil para rotação de texturas e handles
   */
  getAngle(wall: Wall): number {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    return Math.atan2(dy, dx);
  }

  /**
   * Calcula o ponto médio da parede
   * UX: útil para labels e handles de seleção
   */
  getMidpoint(wall: Wall): Point {
    return {
      x: (wall.start.x + wall.end.x) / 2,
      y: (wall.start.y + wall.end.y) / 2
    };
  }

  /**
   * Calcula o comprimento da parede
   */
  getLength(wall: Wall): number {
    return distance(wall.start, wall.end);
  }

  // ============================================
  // VALIDAÇÃO E SANITIZAÇÃO
  // ============================================

  /**
   * Verifica se a parede é válida (sem NaN, comprimento > 0)
   * UX: segurança para dados importados/salvos
   */
  isValidWall(wall: Wall): boolean {
    if (!wall.id || typeof wall.id !== 'string') return false;
    if (typeof wall.start.x !== 'number' || isNaN(wall.start.x)) return false;
    if (typeof wall.start.y !== 'number' || isNaN(wall.start.y)) return false;
    if (typeof wall.end.x !== 'number' || isNaN(wall.end.x)) return false;
    if (typeof wall.end.y !== 'number' || isNaN(wall.end.y)) return false;
    if (wall.thickness <= 0) return false;
    
    const len = this.getLength(wall);
    return len >= this.config.minWallLength;
  }

  // ============================================
  // GETTERS (acesso seguro à config)
  // ============================================

  getConfig(): Readonly<Required<WallEngineConfig>> {
    return Object.freeze({ ...this.config });
  }

}
