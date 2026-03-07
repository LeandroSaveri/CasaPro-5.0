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
}

// ============================================
// UTILIDADES
// ============================================

const distance = (a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
};

const generateId = (): string => {
  return `wall_${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================
// WALL ENGINE
// ============================================

export class WallEngine {

  private config: WallEngineConfig;

  constructor(config?: Partial<WallEngineConfig>) {
    this.config = {
      defaultThickness: 0.2,
      ...config
    };
  }

  // ============================================
  // CRIAR PAREDE
  // ============================================

  createWall(start: Point, end: Point): Wall | null {

    const length = distance(start, end);

    // evita parede zero
    if (length < 0.05) {
      return null;
    }

    const wall: Wall = {
      id: generateId(),
      start,
      end,
      thickness: this.config.defaultThickness
    };

    return wall;
  }

  // ============================================
  // CRIAR PAREDE CONTÍNUA (CHAIN)
  // ============================================

  createChainedWall(
    previousWall: Wall | null,
    endPoint: Point
  ): Wall | null {

    if (!previousWall) return null;

    const start = previousWall.end;

    return this.createWall(start, endPoint);
  }

  // ============================================
  // VERIFICAR SE PONTOS ESTÃO CONECTADOS
  // ============================================

  areConnected(a: Wall, b: Wall): boolean {

    const tolerance = 0.001;

    return (
      distance(a.end, b.start) < tolerance ||
      distance(a.start, b.end) < tolerance
    );
  }

}
