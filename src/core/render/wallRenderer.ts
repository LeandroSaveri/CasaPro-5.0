/**
 * FILE: wallRenderer.ts
 *
 * Renderizador Premium de Paredes - CasaPro
 */

import type { Point, Wall } from '@/types'
import { spatialCache } from '../cache/spatialCache'

// ============================================
// CONTEXTO DE RENDERIZAÇÃO
// (criamos aqui porque renderEngine está desativado)
// ============================================

export interface RenderContext {
  scale: number
  worldToCanvas: (p: Point) => Point
}

// ============================================
// CONSTANTES VISUAIS
// ============================================

const MIN_WALL_THICKNESS_PX = 4
const GLOW_INTENSITY_SELECTED = 12
const GLOW_INTENSITY_HOVER = 8
const GLOW_INTENSITY_HIGHLIGHT = 20
const TEXT_BG_PADDING = 6
const MEASUREMENT_SCALE_THRESHOLD = 5
// ============================================
// CORES PREMIUM
// ============================================
const COLORS = {
  selected: '#c9a962',           // Dourado premium
  hover: '#d4b87a',              // Dourado claro
  highlight: 'rgba(201, 169, 98, 0.8)',  // Glow dourado
  shadowSelected: 'rgba(201, 169, 98, 0.5)',
  shadowHover: 'rgba(201, 169, 98, 0.5)',
  shadowHighlight: 'rgba(201, 169, 98, 0.8)',
  borderSelected: '#ffffff',
  borderHover: '#c9a962',
  borderDefault: 'rgba(0, 0, 0, 0.4)',
  textBg: 'rgba(10, 10, 15, 0.85)',
  textSelected: '#c9a962',
  textDefault: '#e5e5e5',
} as const;

// ============================================
// TIPOS
// ============================================
export interface WallRenderOptions {
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  showMeasurements: boolean;
  settingsShowMeasurements: boolean;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Calcula vetor perpendicular normalizado
 */
const getPerpendicular = (dx: number, dy: number, thickness: number): { x: number; y: number } => {
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: (-dy / length) * thickness / 2,
    y: (dx / length) * thickness / 2,
  };
};

/**
 * Desenha o corpo da parede (retângulo com espessura)
 */
const drawWallBody = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  perp: { x: number; y: number },
  color: string
): void => {
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(start.x + perp.x, start.y + perp.y);
  ctx.lineTo(end.x + perp.x, end.y + perp.y);
  ctx.lineTo(end.x - perp.x, end.y - perp.y);
  ctx.lineTo(start.x - perp.x, start.y - perp.y);
  ctx.closePath();

  ctx.fill();
};

/**
 * Desenha borda da parede
 * (usa o mesmo path já criado pelo drawWallBody)
 */
const drawWallBorder = (
  ctx: CanvasRenderingContext2D,
  color: string,
  lineWidth: number
): void => {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.stroke();
};

/**
 * Desenha medida da parede
 */
const drawMeasurement = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  wall: Wall,
  scale: number,
  isSelected: boolean
): void => {

  const wallLength = spatialCache.getDistance(wall.start, wall.end);

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  const text = `${wallLength.toFixed(2)}m`;

  // Fonte adaptativa ao zoom
  const fontSize = Math.max(10, 11 * (scale / 20));
  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

  const textWidth = ctx.measureText(text).width;

  const bgHeight = fontSize + 4;
  const bgY = midY - bgHeight / 2 - 2;

  ctx.fillStyle = COLORS.textBg;

  ctx.fillRect(
    midX - textWidth / 2 - TEXT_BG_PADDING,
    bgY,
    textWidth + TEXT_BG_PADDING * 2,
    bgHeight
  );

  ctx.fillStyle = isSelected ? COLORS.textSelected : COLORS.textDefault;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(text, midX, bgY + bgHeight / 2);
};
/**
 * Desenha medida da parede
 */
const drawMeasurement = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  wall: Wall,
  scale: number,
  isSelected: boolean
): void => {
  const wallLength = spatialCache.getDistance(wall.start, wall.end);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const text = `${wallLength.toFixed(2)}m`;

  // Fonte responsiva ao zoom
  const fontSize = Math.max(10, 11 * (scale / 20));
  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

  // Background do texto
  const textWidth = ctx.measureText(text).width;
  const bgHeight = fontSize + 4;
  const bgY = midY - bgHeight / 2 - 2;

  ctx.fillStyle = COLORS.textBg;
  ctx.fillRect(
    midX - textWidth / 2 - TEXT_BG_PADDING,
    bgY,
    textWidth + TEXT_BG_PADDING * 2,
    bgHeight
  );

  // Texto
  ctx.fillStyle = isSelected ? COLORS.textSelected : COLORS.textDefault;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, midX, bgY + bgHeight / 2);
};

/**
 * Configura sombra baseada no estado
 */
const setupShadow = (
  ctx: CanvasRenderingContext2D,
  options: WallRenderOptions
): void => {
  if (options.isHighlighted) {
    ctx.shadowColor = COLORS.shadowHighlight;
    ctx.shadowBlur = GLOW_INTENSITY_HIGHLIGHT;
  } else if (options.isSelected) {
    ctx.shadowColor = COLORS.shadowSelected;
    ctx.shadowBlur = GLOW_INTENSITY_SELECTED;
  } else if (options.isHovered) {
    ctx.shadowColor = COLORS.shadowHover;
    ctx.shadowBlur = GLOW_INTENSITY_HOVER;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
};

/**
 * Determina cor da parede baseada no estado
 */
const getWallColor = (wall: Wall, options: WallRenderOptions): string => {
  if (options.isSelected) return COLORS.selected;
  if (options.isHovered) return COLORS.hover;
  return wall.color;
};

/**
 * Determina cor da borda baseada no estado
 */
const getBorderColor = (options: WallRenderOptions): string => {
  if (options.isSelected) return COLORS.borderSelected;
  if (options.isHovered) return COLORS.borderHover;
  return COLORS.borderDefault;
};

/**
 * Determina espessura da borda baseada no estado
 */
const getBorderWidth = (options: WallRenderOptions): number => {
  if (options.isSelected) return 2.5;
  if (options.isHovered) return 2;
  return 1;
};

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

/**
 * Renderiza uma parede no canvas
 * 
 * @param ctx - Contexto 2D do canvas
 * @param wall - Dados da parede
 * @param context - Contexto de renderização (scale, offset, etc)
 * @param options - Opções visuais (selected, hover, etc)
 * @param isInViewport - Função de culling
 * @returns true se renderizou, false se fora do viewport
 */
export const renderWall = (
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  context: RenderContext,
  options: WallRenderOptions,
  isInViewport: (points: Point[], padding?: number) => boolean
): boolean => {
  const { scale, worldToCanvas } = context;

  // Converte coordenadas mundo -> canvas
  const start = worldToCanvas(wall.start);
  const end = worldToCanvas(wall.end);

  // Calcula espessura em pixels (mínimo garantido)
  const thickness = Math.max(wall.thickness * scale, MIN_WALL_THICKNESS_PX);

  // Viewport culling - não renderiza se fora da tela
  if (!isInViewport([wall.start, wall.end], thickness)) {
    return false;
  }

  // Vetor perpendicular para espessura
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const perp = getPerpendicular(dx, dy, thickness);

  // Salva estado do contexto
  ctx.save();

  // Configura sombra/glow
  setupShadow(ctx, options);

  // Cor baseada no estado
  const wallColor = getWallColor(wall, options);

  // Desenha corpo da parede
  drawWallBody(ctx, start, end, perp, wallColor);

  // Desenha borda
  const borderColor = getBorderColor(options);
  const borderWidth = getBorderWidth(options);
  drawWallBorder(ctx, start, end, perp, borderColor, borderWidth);

  // Restaura sombra antes de desenhar medidas (sem glow)
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Desenha medidas se habilitado e zoom suficiente
  const shouldShowMeasurements = 
    options.showMeasurements && 
    options.settingsShowMeasurements && 
    scale > MEASUREMENT_SCALE_THRESHOLD;

  if (shouldShowMeasurements) {
    drawMeasurement(ctx, start, end, wall, scale, options.isSelected);
  }

  // Restaura estado do contexto
  ctx.restore();

  return true;
};

// ============================================
// FUNÇÃO EM LOTE (BATCH)
// ============================================

/**
 * Renderiza múltiplas paredes otimizado
 * Útil quando há muitas paredes para renderizar
 */
export const renderWalls = (
  ctx: CanvasRenderingContext2D,
  walls: Wall[],
  context: RenderContext,
  selectedIds: Set<string>,
  hoveredId: string | null,
  highlightedId: string | null,
  showMeasurements: boolean,
  settingsShowMeasurements: boolean,
  isInViewport: (points: Point[], padding?: number) => boolean
): { rendered: number; culled: number } => {
  let rendered = 0;
  let culled = 0;

  for (const wall of walls) {
    const options: WallRenderOptions = {
      isSelected: selectedIds.has(wall.id),
      isHovered: hoveredId === wall.id,
      isHighlighted: highlightedId === wall.id,
      showMeasurements,
      settingsShowMeasurements,
    };

    const didRender = renderWall(ctx, wall, context, options, isInViewport);
    
    if (didRender) {
      rendered++;
    } else {
      culled++;
    }
  }

  return { rendered, culled };
};

// ============================================
// EXPORTAÇÕES
// ============================================
export { COLORS as WALL_COLORS };
export { MIN_WALL_THICKNESS_PX, MEASUREMENT_SCALE_THRESHOLD };
