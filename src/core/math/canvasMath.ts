/**
 * FILE: canvasMath.ts
 *
 * Utilitários Matemáticos para Canvas2D
 * Responsabilidades:
 * • Cálculos geométricos (interseções, projeções)
 * • Detecção de ciclos em grafos de paredes
 * • Cálculo de áreas de polígonos
 * • Funções de clamp e utilitários numéricos
 */

import type { Point, Wall } from '@/types';

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const getLineIntersection = (
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null => {

  const denom =
    (p1.x - p2.x) * (p3.y - p4.y) -
    (p1.y - p2.y) * (p3.x - p4.x);

  // 🔧 CORREÇÃO CIRÚRGICA (estabilidade numérica)
  if (Math.abs(denom) < 1e-8) return null;

  const t =
    ((p1.x - p3.x) * (p3.y - p4.y) -
      (p1.y - p3.y) * (p3.x - p4.x)) / denom;

  const u =
    -((p1.x - p2.x) * (p1.y - p3.y) -
      (p1.y - p2.y) * (p1.x - p3.x)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {

    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y)
    };

  }

  return null;
};

export const projectPointOnLine = (
  point: Point,
  lineStart: Point,
  lineEnd: Point
): { point: Point; t: number; distance: number } | null => {

  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return null;

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx +
        (point.y - lineStart.y) * dy) / lenSq
    )
  );

  const proj = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };

  const dist = Math.hypot(
    point.x - proj.x,
    point.y - proj.y
  );

  return {
    point: proj,
    t,
    distance: dist
  };
};

export const calculateAngle = (
  start: Point,
  end: Point
): number => {

  const dx = end.x - start.x;
  const dy = end.y - start.y;

  let angle =
    Math.atan2(dy, dx) *
    (180 / Math.PI);

  if (angle < 0) angle += 360;

  return angle;
};

export const findWallCycles = (
  walls: Wall[]
): Point[][] => {

  if (walls.length < 3) return [];

  const graph = new Map<string, Set<string>>();
  const pointMap = new Map<string, Point>();

  const getPointKey = (p: Point) =>
    `${p.x.toFixed(4)},${p.y.toFixed(4)}`;

  for (const wall of walls) {

    const startKey = getPointKey(wall.start);
    const endKey = getPointKey(wall.end);

    pointMap.set(startKey, wall.start);
    pointMap.set(endKey, wall.end);

    if (!graph.has(startKey))
      graph.set(startKey, new Set());

    if (!graph.has(endKey))
      graph.set(endKey, new Set());

    graph.get(startKey)!.add(endKey);
    graph.get(endKey)!.add(startKey);

  }

  const cycles: Point[][] = [];
  const visited = new Set<string>();

  const dfs = (
    start: string,
    current: string,
    path: string[],
    depth: number
  ): void => {

    if (depth > 50) return;

    const neighbors =
      graph.get(current) || new Set();

    for (const neighbor of neighbors) {

      if (neighbor === start && path.length >= 3) {

        const cycle =
          path.map(key => pointMap.get(key)!);

        cycles.push(cycle);

        continue;

      }

      if (path.includes(neighbor)) continue;

      dfs(
        start,
        neighbor,
        [...path, neighbor],
        depth + 1
      );

    }

  };

  for (const node of graph.keys()) {

    if (!visited.has(node)) {

      dfs(node, node, [node], 0);

      visited.add(node);

    }

  }

  const uniqueCycles: Point[][] = [];
  const seen = new Set<string>();

  for (const cycle of cycles) {

    const key =
      cycle
        .map(p => getPointKey(p))
        .sort()
        .join('|');

    if (!seen.has(key)) {

      seen.add(key);

      uniqueCycles.push(cycle);

    }

  }

  return uniqueCycles;
};

export const calculatePolygonArea = (
  points: Point[]
): number => {

  if (points.length < 3) return 0;

  let area = 0;

  for (let i = 0; i < points.length; i++) {

    const j =
      (i + 1) % points.length;

    area +=
      points[i].x * points[j].y;

    area -=
      points[j].x * points[i].y;

  }

  return Math.abs(area) / 2;
};
