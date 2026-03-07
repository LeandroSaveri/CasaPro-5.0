/**
 * FILE: Canvas2D.tsx
 * 
 * Sistema de Renderização 2D - CasaPro
 * Com suporte completo a: desenho, snap, seleção, pan, zoom
 */

import React, { 
  useRef, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  useLayoutEffect
} from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import type { Point, Wall } from '@/types';
import { Ruler, Magnet, Maximize2 } from 'lucide-react';

// ============================================
// CONSTANTES
// ============================================

const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
const ANGLE_SNAP_THRESHOLD = 8; // graus
const GRID_CACHE_SIZE = 5000;
const RENDER_THROTTLE = 16;
const ZOOM_SENSITIVITY = 0.001;
const HOVER_THRESHOLD = 8; // pixels
const SNAP_DISTANCE = 0.3; // metros no mundo

// ============================================
// TIPOS
// ============================================

interface SnapPoint {
  readonly point: Point;
  readonly type: 'grid' | 'endpoint' | 'midpoint' | 'center' | 'angle';
  readonly priority: number;
  readonly distance: number;
}

interface CanvasMetrics {
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly devicePixelRatio: number;
}

// ============================================
// CACHE
// ============================================

class SpatialCache {
  private distanceCache = new Map<string, number>();
  private readonly maxSize: number;

  constructor(maxSize: number = GRID_CACHE_SIZE) {
    this.maxSize = maxSize;
  }

  private getDistanceKey(a: Point, b: Point): string {
    return `${a.x.toFixed(4)},${a.y.toFixed(4)}|${b.x.toFixed(4)},${b.y.toFixed(4)}`;
  }

  getDistance(a: Point, b: Point): number {
    const key = this.getDistanceKey(a, b);
    const cached = this.distanceCache.get(key);
    if (cached !== undefined) return cached;

    const dist = Math.hypot(b.x - a.x, b.y - a.y);

    if (this.distanceCache.size >= this.maxSize) {
      this.distanceCache.clear();
    }
    
    this.distanceCache.set(key, dist);
    return dist;
  }

  clear(): void {
    this.distanceCache.clear();
  }
}

const spatialCache = new SpatialCache();
const clamp = (value: number, min: number, max: number): number => 
  Math.min(Math.max(value, min), max);

// ============================================
// UTILS
// ============================================

const pointToLineDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  
  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (len * len)));
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  
  return Math.hypot(point.x - projX, point.y - projY);
};

const angleBetween = (p1: Point, p2: Point): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
};

const normalizeAngle = (angle: number): number => {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
};

// ============================================
// COMPONENTE
// ============================================

const Canvas2D: React.FC = () => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRenderRef = useRef<number>(0);
  const metricsRef = useRef<CanvasMetrics>({
    width: 0, height: 0, centerX: 0, centerY: 0, devicePixelRatio: 1
  });

  // Estados locais
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [worldMousePos, setWorldMousePos] = useState<Point>({ x: 0, y: 0 });
  const [snapIndicator, setSnapIndicator] = useState<SnapPoint | null>(null);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [cursor, setCursor] = useState('default');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  // Store - TODAS as funções necessárias
  const { 
    currentProject, 
    toolMode, 
    isDrawing, 
    drawStart, 
    drawCurrent,
    selectedElement,
    selectedElementType,
    startDrawing,
    updateDrawing,
    endDrawing,
    selectElement,
  } = useProjectStore();

  const { canvas2D, setCanvasScale, setCanvasOffset } = useUIStore();
  const { scale, offset } = canvas2D;

  // Memo
  const projectElements = useMemo(() => {
    if (!currentProject) return null;
    return {
      rooms: currentProject.rooms,
      walls: currentProject.walls,
      doors: currentProject.doors,
      windows: currentProject.windows,
      furniture: currentProject.furniture,
      settings: {
        ...currentProject.settings,
        snapToGrid: currentProject.settings.snapToGrid ?? true,
        showGrid: currentProject.settings.showGrid ?? true,
        gridSize: currentProject.settings.gridSize ?? 0.5,
      },
    };
  }, [currentProject]);

  // ============================================
  // COORDENADAS
  // ============================================

  const worldToCanvas = useCallback((point: Point): Point => {
    const m = metricsRef.current;
    return {
      x: point.x * scale + offset.x + m.centerX,
      y: -point.y * scale + offset.y + m.centerY,
    };
  }, [scale, offset]);

  const canvasToWorld = useCallback((point: Point): Point => {
    const m = metricsRef.current;
    return {
      x: (point.x - offset.x - m.centerX) / scale,
      y: -(point.y - offset.y - m.centerY) / scale,
    };
  }, [scale, offset]);

  const getCanvasPoint = useCallback((e: React.PointerEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // ============================================
  // SNAP SYSTEM
  // ============================================

  const snapToGrid = useCallback((point: Point): Point => {
    if (!projectElements?.settings.snapToGrid || !snapEnabled) return point;
    const gridSize = projectElements.settings.gridSize;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }, [projectElements?.settings.snapToGrid, projectElements?.settings.gridSize, snapEnabled]);

  const snapToAngle = useCallback((start: Point, current: Point): Point => {
    if (!snapEnabled) return current;
    
    const angle = angleBetween(start, current);
    const normalizedAngle = normalizeAngle(angle);
    
    // Encontra o ângulo mais próximo
    let closestAngle = normalizedAngle;
    let minDiff = Infinity;
    
    for (const snapAngle of SNAP_ANGLES) {
      let diff = Math.abs(normalizedAngle - snapAngle);
      if (diff > 180) diff = 360 - diff;
      
      if (diff < minDiff) {
        minDiff = diff;
        closestAngle = snapAngle;
      }
    }
    
    // Se está dentro do threshold, aplica snap
    if (minDiff <= ANGLE_SNAP_THRESHOLD) {
      const distance = spatialCache.getDistance(start, current);
      const rad = closestAngle * (Math.PI / 180);
      return {
        x: start.x + Math.cos(rad) * distance,
        y: start.y + Math.sin(rad) * distance,
      };
    }
    
    return current;
  }, [snapEnabled]);

  const findSnapPoints = useCallback((point: Point, excludeWallId?: string): SnapPoint[] => {
    if (!projectElements || !snapEnabled) return [];
    const snapPoints: SnapPoint[] = [];
    const snapThreshold = SNAP_DISTANCE;

    // Snap para grid
    const gridPoint = snapToGrid(point);
    const gridDist = spatialCache.getDistance(gridPoint, point);
    if (gridDist < snapThreshold) {
      snapPoints.push({ point: gridPoint, type: 'grid', priority: 1, distance: gridDist });
    }

    // Snap para endpoints de paredes
    projectElements.walls.forEach(wall => {
      if (wall.id === excludeWallId) return;
      
      const startDist = spatialCache.getDistance(wall.start, point);
      if (startDist < snapThreshold) {
        snapPoints.push({ point: wall.start, type: 'endpoint', priority: 10, distance: startDist });
      }
      
      const endDist = spatialCache.getDistance(wall.end, point);
      if (endDist < snapThreshold) {
        snapPoints.push({ point: wall.end, type: 'endpoint', priority: 10, distance: endDist });
      }
    });

    return snapPoints.sort((a, b) => b.priority - a.priority || a.distance - b.distance);
  }, [projectElements, snapEnabled, snapToGrid]);

  const getBestSnapPoint = useCallback((point: Point, excludeWallId?: string): { point: Point; snap: SnapPoint | null } => {
    const snapPoints = findSnapPoints(point, excludeWallId);
    if (snapPoints.length > 0) {
      setSnapIndicator(snapPoints[0]);
      return { point: snapPoints[0].point, snap: snapPoints[0] };
    }
    setSnapIndicator(null);
    return { point, snap: null };
  }, [findSnapPoints]);

  // ============================================
  // HIT TEST
  // ============================================

  const hitTest = useCallback((worldPoint: Point): { id: string; type: string } | null => {
    if (!projectElements) return null;
    
    // Testa paredes primeiro
    for (const wall of projectElements.walls) {
      const start = worldToCanvas(wall.start);
      const end = worldToCanvas(wall.end);
      const mouseCanvas = worldToCanvas(worldPoint);
      const dist = pointToLineDistance(mouseCanvas, start, end);
      
      if (dist < HOVER_THRESHOLD) {
        return { id: wall.id, type: 'wall' };
      }
    }
    
    return null;
  }, [projectElements, worldToCanvas]);

  // ============================================
  // RENDER
  // ============================================

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!projectElements?.settings.showGrid) return;
    const m = metricsRef.current;
    const gridSize = projectElements.settings.gridSize * scale;
    if (gridSize < 2) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    const startX = offset.x % gridSize;
    const startY = offset.y % gridSize;

    ctx.beginPath();
    for (let x = startX; x < m.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, m.height);
    }
    for (let y = startY; y < m.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(m.width, y);
    }
    ctx.stroke();
    ctx.restore();
  }, [projectElements?.settings.showGrid, projectElements?.settings.gridSize, scale, offset]);

  const drawWall = useCallback((ctx: CanvasRenderingContext2D, wall: Wall, isSelected: boolean, isHovered: boolean) => {
    const start = worldToCanvas(wall.start);
    const end = worldToCanvas(wall.end);
    const thickness = Math.max(wall.thickness * scale, 2);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const perpX = (-dy / length) * thickness / 2;
    const perpY = (dx / length) * thickness / 2;

    ctx.save();
    ctx.fillStyle = isSelected ? '#c9a962' : isHovered ? '#d4b87a' : '#6b7280';
    
    ctx.beginPath();
    ctx.moveTo(start.x + perpX, start.y + perpY);
    ctx.lineTo(end.x + perpX, end.y + perpY);
    ctx.lineTo(end.x - perpX, end.y - perpY);
    ctx.lineTo(start.x - perpX, start.y - perpY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isSelected ? '#ffffff' : isHovered ? '#c9a962' : '#9ca3af';
    ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1;
    ctx.stroke();
    ctx.restore();

    // Desenha endpoints se hover ou selected
    if (isHovered || isSelected) {
      ctx.fillStyle = '#c9a962';
      [start, end].forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [worldToCanvas, scale]);

  const drawPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDrawing || !drawStart || !drawCurrent) return;
    
    const start = worldToCanvas(drawStart);
    const end = worldToCanvas(drawCurrent);
    
    ctx.save();
    
    // Linha de preview
    ctx.strokeStyle = '#c9a962';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Medida
    const dist = spatialCache.getDistance(drawStart, drawCurrent);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    ctx.fillStyle = 'rgba(10, 10, 15, 0.95)';
    ctx.fillRect(midX - 35, midY - 25, 70, 24);
    ctx.strokeStyle = '#c9a962';
    ctx.lineWidth = 1;
    ctx.strokeRect(midX - 35, midY - 25, 70, 24);
    
    ctx.fillStyle = '#c9a962';
    ctx.textAlign = 'center';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${dist.toFixed(2)}m`, midX, midY - 8);

    // Ângulo
    const angle = angleBetween(drawStart, drawCurrent);
    ctx.fillText(`${angle.toFixed(0)}°`, midX, midY + 8);
    
    ctx.restore();
  }, [isDrawing, drawStart, drawCurrent, worldToCanvas]);

  const drawSnapIndicator = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!snapIndicator) return;
    
    const pos = worldToCanvas(snapIndicator.point);
    
    ctx.save();
    ctx.strokeStyle = '#c9a962';
    ctx.fillStyle = '#c9a962';
    ctx.lineWidth = 2;
    
    // Círculo pulsante
    const time = Date.now() / 500;
    const radius = 6 + Math.sin(time) * 2;
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Cruz
    ctx.beginPath();
    ctx.moveTo(pos.x - 10, pos.y);
    ctx.lineTo(pos.x + 10, pos.y);
    ctx.moveTo(pos.x, pos.y - 10);
    ctx.lineTo(pos.x, pos.y + 10);
    ctx.stroke();
    
    ctx.restore();
  }, [snapIndicator, worldToCanvas]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const now = performance.now();
    if (now - lastRenderRef.current < RENDER_THROTTLE) return;
    lastRenderRef.current = now;

    const m = metricsRef.current;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, m.width, m.height);

    drawGrid(ctx);
    if (!projectElements) return;

    // Paredes
    projectElements.walls.forEach((wall: Wall) => {
      const isSelected = selectedElement === wall.id && selectedElementType === 'wall';
      const isHovered = hoveredElement === wall.id;
      drawWall(ctx, wall, isSelected, isHovered);
    });

    // Preview de desenho
    drawPreview(ctx);
    
    // Indicador de snap
    drawSnapIndicator(ctx);
  }, [projectElements, selectedElement, selectedElementType, hoveredElement, drawGrid, drawWall, drawPreview, drawSnapIndicator]);

  use useEffect(() => {
    const animate = () => {
      render();
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  // ============================================
  // HANDLERS
  // ============================================

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try { canvas.setPointerCapture(e.pointerId); } catch {}

    const canvasPoint = getCanvasPoint(e);
    if (!canvasPoint) return;

    const worldPoint = canvasToWorld(canvasPoint);
    const { point: snappedPoint } = getBestSnapPoint(worldPoint);

    // Pan (middle click ou alt+click ou space+click)
    if (e.button === 1 || (e.button === 0 && (e.altKey || e.shiftKey))) {
      setIsPanning(true);
      setPanStart(canvasPoint);
      setCursor('grabbing');
      return;
    }

    if (e.button !== 0) return;

    if (toolMode === 'wall') {
      startDrawing(snappedPoint);
      setCursor('crosshair');
      return;
    }

    if (toolMode === 'select') {
      const hit = hitTest(worldPoint);
      if (hit) {
        selectElement(hit.id, hit.type as any);
        setCursor('move');
      } else {
        selectElement(null);
        setCursor('default');
      }
    }
  }, [getCanvasPoint, canvasToWorld, getBestSnapPoint, toolMode, startDrawing, hitTest, selectElement]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    e.preventDefault();

    const canvasPoint = getCanvasPoint(e);
    if (!canvasPoint) return;

    const worldPoint = canvasToWorld(canvasPoint);
    setWorldMousePos(worldPoint);

    // Se está desenhando, atualiza o preview com snap
    if (isDrawing && drawStart) {
      // Primeiro aplica snap de ângulo relativo ao ponto inicial
      const angleSnapped = snapToAngle(drawStart, worldPoint);
      // Depois aplica snap de pontos existentes
      const { point: finalSnapped } = getBestSnapPoint(angleSnapped);
      updateDrawing(finalSnapped);
    }

    // Hover detection no modo select
    if (toolMode === 'select' && !isPanning && !isDrawing) {
      const hit = hitTest(worldPoint);
      if (hit) {
        setHoveredElement(hit.id);
        setCursor('pointer');
      } else {
        setHoveredElement(null);
        setCursor('default');
      }
    }

    // Pan
    if (isPanning) {
      const dx = canvasPoint.x - panStart.x;
      const dy = canvasPoint.y - panStart.y;
      setCanvasOffset({ x: offset.x + dx, y: offset.y + dy });
      setPanStart(canvasPoint);
    }
  }, [getCanvasPoint, canvasToWorld, isDrawing, drawStart, snapToAngle, getBestSnapPoint, updateDrawing, toolMode, isPanning, hitTest, offset, setCanvasOffset, panStart]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas) {
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }

    if (isPanning) {
      setIsPanning(false);
      setCursor('default');
      return;
    }

    if (isDrawing && drawStart) {
      const canvasPoint = getCanvasPoint(e);
      if (!canvasPoint) return;
      
      const worldPoint = canvasToWorld(canvasPoint);
      // Aplica snap angular e de pontos
      const angleSnapped = snapToAngle(drawStart, worldPoint);
      const { point: finalSnapped } = getBestSnapPoint(angleSnapped);
      
      endDrawing(finalSnapped);
      setSnapIndicator(null);
    }
  }, [getCanvasPoint, canvasToWorld, snapToAngle, getBestSnapPoint, endDrawing, isPanning, isDrawing, drawStart]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const zoomFactor = Math.exp(delta);
    const newScale = clamp(scale * zoomFactor, 0.1, 100);

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * metricsRef.current.devicePixelRatio;
    const mouseY = (e.clientY - rect.top) * metricsRef.current.devicePixelRatio;

    const worldBefore = canvasToWorld({ x: mouseX, y: mouseY });
    setCanvasScale(newScale);

    requestAnimationFrame(() => {
      const worldAfter = canvasToWorld({ x: mouseX, y: mouseY });
      const dx = (worldAfter.x - worldBefore.x) * newScale;
      const dy = (worldAfter.y - worldBefore.y) * newScale;
      setCanvasOffset({ x: offset.x - dx, y: offset.y + dy });
    });
  }, [scale, offset, setCanvasScale, setCanvasOffset, canvasToWorld]);

  // ============================================
  // LAYOUT
  // ============================================

  useLayoutEffect(() => {
    const updateMetrics = () => {
      if (containerRef.current && canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);

        metricsRef.current = {
          width: width * dpr,
          height: height * dpr,
          centerX: (width * dpr) / 2,
          centerY: (height * dpr) / 2,
          devicePixelRatio: dpr
        };
      }
    };

    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, []);

  // ============================================
  // RENDER JSX
  // ============================================

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ touchAction: 'none', cursor }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          setIsPanning(false);
          setCursor('default');
          setHoveredElement(null);
        }}
        onWheel={handleWheel}
      />
      
      {/* Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-1 px-2">
          <button onClick={() => setCanvasScale(scale * 1.2)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl text-white/70 hover:text-white text-lg">+</button>
          <div className="flex flex-col items-center min-w-[4rem]">
            <span className="text-xs font-semibold text-white/80">{scale.toFixed(0)}%</span>
            <span className="text-[10px] text-white/40">Zoom</span>
          </div>
          <button onClick={() => setCanvasScale(scale * 0.8)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl text-white/70 hover:text-white text-lg">−</button>
        </div>
        
        <div className="w-px h-8 bg-white/10" />
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setSnapEnabled(!snapEnabled)} 
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${snapEnabled ? 'bg-[#c9a962]/20 text-[#c9a962]' : 'hover:bg-white/10 text-white/40'}`}
            title="Snap"
          >
            <Magnet size={18} />
          </button>
          <button 
            onClick={() => setShowMeasurements(!showMeasurements)} 
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${showMeasurements ? 'bg-[#c9a962]/20 text-[#c9a962]' : 'hover:bg-white/10 text-white/40'}`}
            title="Medidas"
          >
            <Ruler size={18} />
          </button>
        </div>
        
        <div className="w-px h-8 bg-white/10" />
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => { setCanvasScale(20); setCanvasOffset({ x: 0, y: 0 }); }} 
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl text-white/70 hover:text-white"
            title="Reset View"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>
      
      {/* Info Panel */}
      <div className="absolute bottom-6 left-6 p-4 bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl min-w-[180px]">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">Posição</span>
            <span className="text-xs font-mono text-white/70">{worldMousePos.x.toFixed(2)}, {worldMousePos.y.toFixed(2)}</span>
          </div>
          {snapIndicator && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wider text-[#c9a962]/70 font-medium">Snap</span>
              <span className="text-xs font-medium text-[#c9a962] capitalize">{snapIndicator.type}</span>
            </div>
          )}
          {selectedElement && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wider text-emerald-400/70 font-medium">Selecionado</span>
              <span className="text-xs font-medium text-emerald-400 capitalize">{selectedElementType}</span>
            </div>
          )}
          {isDrawing && drawStart && drawCurrent && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-wider text-amber-400/70 font-medium">Comprimento</span>
              <span className="text-xs font-medium text-amber-400">{spatialCache.getDistance(drawStart, drawCurrent).toFixed(2)}m</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvas2D;
