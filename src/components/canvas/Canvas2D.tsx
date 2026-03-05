/**
 * FILE: Canvas2D.tsx
 *
 * Sistema de Renderização 2D Premium - CasaPro
 * 
 * Responsabilidades:
 * - Renderização otimizada de elementos arquitetônicos
 * - Sistema de gestos multi-touch (pinch, pan, rotate)
 * - Snap inteligente com priorização
 * - Cache de geometria e culling de viewport
 * - Animações suaves de câmera
 * - Suporte a stylus e mouse de precisão
 * - Sistema de seleção e hover (Hit Detection)
 * - Drag selection e preparação para mover objetos
 * 
 * Performance:
 * - requestAnimationFrame com throttling
 * - Spatial hashing para snap points
 * - GPU-accelerated transforms
 * - Lazy evaluation de métricas
 * - Viewport culling agressivo
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
import type { Point, Wall, Room } from '@/types';
import { Ruler, Grid3X3, Magnet, Maximize2, RotateCcw } from 'lucide-react';
import {
  createGestureState,
  updateTouches,
  processTap,
  checkLongPress,
  resetGesture,
  type TouchPoint,
  DEFAULT_GESTURE_CONFIG
} from '@/core/interaction/gestureEngine';

// ============================================
// CONSTANTES PREMIUM
// ============================================

const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
const ANGLE_SNAP_THRESHOLD = 8;
const GRID_CACHE_SIZE = 5000;
const RENDER_THROTTLE = 16; // ~60fps
const ZOOM_SENSITIVITY = 0.001;
const PAN_SENSITIVITY = 1.0;
const HIT_TEST_THRESHOLD = 0.15; // Distância em metros para hit test
const HOVER_THROTTLE = 50; // Throttle para hover em ms

// ============================================
// TIPOS PREMIUM
// ============================================

interface SnapPoint {
  readonly point: Point;
  readonly type: 'grid' | 'endpoint' | 'intersection' | 'angle' | 'midpoint' | 'center';
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

interface HitTestResult {
  readonly id: string;
  readonly type: 'wall' | 'room' | 'door' | 'window' | 'furniture';
  readonly distance: number;
}

interface SelectionBox {
  readonly start: Point;
  readonly current: Point;
}

// ============================================
// CACHE OTIMIZADO
// ============================================

class SpatialCache {
  private distanceCache = new Map<string, number>();
  private gridCache = new Map<string, Point>();
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

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);

    if (this.distanceCache.size >= this.maxSize) {
      this.distanceCache.clear();
    }
    
    this.distanceCache.set(key, dist);
    return dist;
  }

  clear(): void {
    this.distanceCache.clear();
    this.gridCache.clear();
  }
}

const spatialCache = new SpatialCache();

// ============================================
// UTILITÁRIOS MATEMÁTICOS
// ============================================

const clamp = (value: number, min: number, max: number): number => 
  Math.min(Math.max(value, min), max);

const pointInRect = (point: Point, rect: { minX: number; minY: number; maxX: number; maxY: number }): boolean => {
  return point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY;
};

const rectIntersect = (a: { minX: number; minY: number; maxX: number; maxY: number }, b: { minX: number; minY: number; maxX: number; maxY: number }): boolean => {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const Canvas2D: React.FC = () => {
  // Refs com tipagem rigorosa
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRenderRef = useRef<number>(0);
  const gestureStateRef = useRef(createGestureState());
  const metricsRef = useRef<CanvasMetrics>({
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    devicePixelRatio: 1
  });
  const hoverThrottleRef = useRef<number>(0);

  // Estados locais premium
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [worldMousePos, setWorldMousePos] = useState<Point>({ x: 0, y: 0 });
  const [snapIndicator, setSnapIndicator] = useState<SnapPoint | null>(null);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [angleLock, setAngleLock] = useState<boolean>(false);
  const [lockedAngle, setLockedAngle] = useState<number | null>(null);
  const [gestureDebug, setGestureDebug] = useState<string>('');
  
  // Estados de seleção e hover
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [hoveredElementType, setHoveredElementType] = useState<HitTestResult['type'] | null>(null);
  const [cursor, setCursor] = useState<string>('default');
  
  // Estados para drag selection
  const [isDragSelecting, setIsDragSelecting] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  
  // Estados para drag de objetos
  const [isDraggingElement, setIsDraggingElement] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<string | null>(null);

  // Store selectors otimizados
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

  const {
    canvas2D,
    setCanvasScale,
    setCanvasOffset,
  } = useUIStore();

  const { scale, offset } = canvas2D;

  // Memoização pesada de elementos
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
        snapToAngle: currentProject.settings.snapToAngle ?? true,
        showGrid: currentProject.settings.showGrid ?? true,
        showAxes: currentProject.settings.showAxes ?? true,
        showMeasurements: currentProject.settings.showMeasurements ?? true,
        gridSize: currentProject.settings.gridSize ?? 0.5,
        unit: currentProject.settings.unit ?? 'meters',
        snapAngles: currentProject.settings.snapAngles ?? [...SNAP_ANGLES],
      },
    };
  }, [
    currentProject?.rooms,
    currentProject?.walls,
    currentProject?.doors,
    currentProject?.windows,
    currentProject?.furniture,
    currentProject?.settings,
  ]);

  // ============================================
  // SISTEMA DE COORDENADAS
  // ============================================

  const worldToCanvas = useCallback((point: Point): Point => {
    const metrics = metricsRef.current;
    return {
      x: point.x * scale + offset.x + metrics.centerX,
      y: -point.y * scale + offset.y + metrics.centerY,
    };
  }, [scale, offset]);

  const canvasToWorld = useCallback((point: Point): Point => {
    const metrics = metricsRef.current;
    return {
      x: (point.x - offset.x - metrics.centerX) / scale,
      y: -(point.y - offset.y - metrics.centerY) / scale,
    };
  }, [scale, offset]);

  const getCanvasPoint = useCallback((e: React.PointerEvent | PointerEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = metricsRef.current.devicePixelRatio;
    
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    };
  }, []);

  // ============================================
  // SISTEMA DE SNAP PREMIUM
  // ============================================

  const snapToGrid = useCallback((point: Point): Point => {
    if (!projectElements?.settings.snapToGrid || !snapEnabled) return point;
    const gridSize = projectElements.settings.gridSize;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }, [projectElements?.settings.snapToGrid, projectElements?.settings.gridSize, snapEnabled]);

  const calculateAngle = useCallback((start: Point, end: Point): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  }, []);

  const snapAngle = useCallback((angle: number): number => {
    if (!snapEnabled || !projectElements?.settings.snapToAngle) return angle;
    if (angleLock && lockedAngle !== null) return lockedAngle;
    
    const snapAngles = projectElements?.settings.snapAngles ?? [...SNAP_ANGLES];
    
    for (const snapAngle of snapAngles) {
      const diff = Math.abs(angle - snapAngle);
      const minDiff = Math.min(diff, 360 - diff);
      if (minDiff <= ANGLE_SNAP_THRESHOLD) return snapAngle;
    }
    return angle;
  }, [snapEnabled, projectElements?.settings.snapToAngle, projectElements?.settings.snapAngles, angleLock, lockedAngle]);

  const findSnapPoints = useCallback((point: Point): SnapPoint[] => {
    if (!projectElements || !snapEnabled) return [];
    
    const snapPoints: SnapPoint[] = [];
    const snapThreshold = 0.3 / scale; // Ajusta com zoom
    
    // Grid snap (prioridade baixa)
    const gridPoint = snapToGrid(point);
    const gridDist = spatialCache.getDistance(gridPoint, point);
    if (gridDist < snapThreshold) {
      snapPoints.push({ 
        point: gridPoint, 
        type: 'grid', 
        priority: 1,
        distance: gridDist 
      });
    }
    
    // Wall endpoints e midpoints
    const { walls } = projectElements;
    for (let i = 0; i < walls.length; i++) {
      const wall = walls[i];
      
      const startDist = spatialCache.getDistance(wall.start, point);
      if (startDist < snapThreshold) {
        snapPoints.push({ 
          point: wall.start, 
          type: 'endpoint', 
          priority: 10,
          distance: startDist 
        });
      }
      
      const endDist = spatialCache.getDistance(wall.end, point);
      if (endDist < snapThreshold) {
        snapPoints.push({ 
          point: wall.end, 
          type: 'endpoint', 
          priority: 10,
          distance: endDist 
        });
      }
      
      // Midpoint (prioridade média)
      if (startDist < snapThreshold * 3 || endDist < snapThreshold * 3) {
        const midPoint: Point = {
          x: (wall.start.x + wall.end.x) / 2,
          y: (wall.start.y + wall.end.y) / 2,
        };
        const midDist = spatialCache.getDistance(midPoint, point);
        if (midDist < snapThreshold) {
          snapPoints.push({ 
            point: midPoint, 
            type: 'midpoint', 
            priority: 5,
            distance: midDist 
          });
        }
      }
    }
    
    // Room corners e centroids
    const { rooms } = projectElements;
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      const points = room.points;
      
      for (let j = 0; j < points.length; j++) {
        const corner = points[j];
        const cornerDist = spatialCache.getDistance(corner, point);
        if (cornerDist < snapThreshold) {
          snapPoints.push({ 
            point: corner, 
            type: 'endpoint', 
            priority: 10,
            distance: cornerDist 
          });
        }
      }
      
      // Centro do cômodo (prioridade baixa)
      if (points.length > 2) {
        const centroid = points.reduce((acc, p) => ({ 
          x: acc.x + p.x, 
          y: acc.y + p.y 
        }), { x: 0, y: 0 });
        centroid.x /= points.length;
        centroid.y /= points.length;
        
        const centerDist = spatialCache.getDistance(centroid, point);
        if (centerDist < snapThreshold * 2) {
          snapPoints.push({ 
            point: centroid, 
            type: 'center', 
            priority: 2,
            distance: centerDist 
          });
        }
      }
    }
    
    // Ordena por prioridade decrescente, depois por distância
    return snapPoints.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.distance - b.distance;
    });
  }, [projectElements, snapEnabled, snapToGrid, scale]);

  const getBestSnapPoint = useCallback((point: Point): Point => {
    const snapPoints = findSnapPoints(point);
    if (snapPoints.length > 0) {
      setSnapIndicator(snapPoints[0]);
      return snapPoints[0].point;
    }
    setSnapIndicator(null);
    return point;
  }, [findSnapPoints]);

  const applyAngleSnap = useCallback((start: Point, end: Point): Point => {
    if (!snapEnabled) return end;
    
    const angle = calculateAngle(start, end);
    const snappedAngle = snapAngle(angle);
    
    if (Math.abs(snappedAngle - angle) > 0.1) {
      const dist = spatialCache.getDistance(start, end);
      const rad = snappedAngle * (Math.PI / 180);
      return {
        x: start.x + Math.cos(rad) * dist,
        y: start.y + Math.sin(rad) * dist,
      };
    }
    return end;
  }, [snapEnabled, calculateAngle, snapAngle]);

  // ============================================
  // SISTEMA DE HIT DETECTION (SELEÇÃO)
  // ============================================

  const hitTestFurniture = useCallback((point: Point): HitTestResult | null => {
    if (!projectElements?.furniture) return null;
    
    let closest: HitTestResult | null = null;
    let minDist = HIT_TEST_THRESHOLD;
    
    for (const furniture of projectElements.furniture) {
      const halfWidth = furniture.scale.x / 2;
      const halfDepth = furniture.scale.y / 2;
      
      // Verifica se o ponto está dentro do bounding box rotacionado
      const dx = point.x - furniture.position.x;
      const dy = point.y - furniture.position.y;
      
      // Rotação inversa
      const cos = Math.cos(furniture.rotation);
      const sin = Math.sin(furniture.rotation);
      const localX = dx * cos + dy * sin;
      const localY = -dx * sin + dy * cos;
      
      if (Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfDepth) {
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          minDist = dist;
          closest = { id: furniture.id, type: 'furniture', distance: dist };
        }
      }
    }
    
    return closest;
  }, [projectElements?.furniture]);

  const hitTestDoor = useCallback((point: Point): HitTestResult | null => {
    if (!projectElements?.doors || !projectElements?.walls) return null;
    
    let closest: HitTestResult | null = null;
    let minDist = HIT_TEST_THRESHOLD;
    
    for (const door of projectElements.doors) {
      const wall = projectElements.walls.find((w: Wall) => w.id === door.wallId);
      if (!wall) continue;
      
      const t = door.position;
      const doorPos: Point = {
        x: wall.start.x + (wall.end.x - wall.start.x) * t,
        y: wall.start.y + (wall.end.y - wall.start.y) * t,
      };
      
      const dist = spatialCache.getDistance(doorPos, point);
      if (dist < minDist) {
        minDist = dist;
        closest = { id: door.id, type: 'door', distance: dist };
      }
    }
    
    return closest;
  }, [projectElements?.doors, projectElements?.walls]);

  const hitTestWindow = useCallback((point: Point): HitTestResult | null => {
    if (!projectElements?.windows || !projectElements?.walls) return null;
    
    let closest: HitTestResult | null = null;
    let minDist = HIT_TEST_THRESHOLD;
    
    for (const window of projectElements.windows) {
      const wall = projectElements.walls.find((w: Wall) => w.id === window.wallId);
      if (!wall) continue;
      
      const t = window.position;
      const windowPos: Point = {
        x: wall.start.x + (wall.end.x - wall.start.x) * t,
        y: wall.start.y + (wall.end.y - wall.start.y) * t,
      };
      
      const dist = spatialCache.getDistance(windowPos, point);
      if (dist < minDist) {
        minDist = dist;
        closest = { id: window.id, type: 'window', distance: dist };
      }
    }
    
    return closest;
  }, [projectElements?.windows, projectElements?.walls]);

  const hitTestWall = useCallback((point: Point): HitTestResult | null => {
    if (!projectElements?.walls) return null;
    
    let closest: HitTestResult | null = null;
    let minDist = HIT_TEST_THRESHOLD;
    
    for (const wall of projectElements.walls) {
      // Distância do ponto ao segmento de linha
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const len = Math.hypot(dx, dy);
      
      if (len === 0) continue;
      
      const t = Math.max(0, Math.min(1, ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / (len * len)));
      const projX = wall.start.x + t * dx;
      const projY = wall.start.y + t * dy;
      
      const dist = spatialCache.getDistance({ x: projX, y: projY }, point);
      const threshold = (wall.thickness / 2) + HIT_TEST_THRESHOLD;
      
      if (dist < threshold && dist < minDist) {
        minDist = dist;
        closest = { id: wall.id, type: 'wall', distance: dist };
      }
    }
    
    return closest;
  }, [projectElements?.walls]);

  const hitTestRoom = useCallback((point: Point): HitTestResult | null => {
    if (!projectElements?.rooms) return null;
    
    let closest: HitTestResult | null = null;
    let minDist = Infinity;
    
    for (const room of projectElements.rooms) {
      if (room.points.length < 3) continue;
      
      // Algoritmo ray casting para verificar se ponto está dentro do polígono
      let inside = false;
      for (let i = 0, j = room.points.length - 1; i < room.points.length; j = i++) {
        const xi = room.points[i].x, yi = room.points[i].y;
        const xj = room.points[j].x, yj = room.points[j].y;
        
        if (((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      
      if (inside) {
        // Calcula distância ao centro
        const centroid = room.points.reduce((acc, p) => ({ 
          x: acc.x + p.x, 
          y: acc.y + p.y 
        }), { x: 0, y: 0 });
        centroid.x /= room.points.length;
        centroid.y /= room.points.length;
        
        const dist = spatialCache.getDistance(centroid, point);
        if (dist < minDist) {
          minDist = dist;
          closest = { id: room.id, type: 'room', distance: dist };
        }
      }
    }
    
    return closest;
  }, [projectElements?.rooms]);

  const hitTest = useCallback((point: Point): HitTestResult | null => {
    // Ordem de prioridade: furniture > doors > windows > walls > rooms
    const furniture = hitTestFurniture(point);
    if (furniture) return furniture;
    
    const door = hitTestDoor(point);
    if (door) return door;
    
    const window = hitTestWindow(point);
    if (window) return window;
    
    const wall = hitTestWall(point);
    if (wall) return wall;
    
    const room = hitTestRoom(point);
    if (room) return room;
    
    return null;
  }, [hitTestFurniture, hitTestDoor, hitTestWindow, hitTestWall, hitTestRoom]);

  // ============================================
  // SISTEMA DE RENDERIZAÇÃO PREMIUM
  // ============================================

  const isInViewport = useCallback((points: Point[], padding: number = 0): boolean => {
    const metrics = metricsRef.current;
    const xs = points.map(p => worldToCanvas(p).x);
    const ys = points.map(p => worldToCanvas(p).y);
    
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;
    
    return !(maxX < 0 || minX > metrics.width || maxY < 0 || minY > metrics.height);
  }, [worldToCanvas]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!projectElements?.settings.showGrid) return;
    
    const metrics = metricsRef.current;
    const { width, height } = metrics;
    const gridSize = projectElements.settings.gridSize * scale;
    
    // Early return se zoom muito baixo
    if (gridSize < 2) return;
    
    const startX = offset.x % gridSize;
    const startY = offset.y % gridSize;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const xStart = Math.max(0, startX - gridSize);
    const xEnd = width + gridSize;
    for (let x = xStart; x < xEnd; x += gridSize) {
      if (x >= 0 && x <= width) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
    }
    
    const yStart = Math.max(0, startY - gridSize);
    const yEnd = height + gridSize;
    for (let y = yStart; y < yEnd; y += gridSize) {
      if (y >= 0 && y <= height) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
    }
    
    ctx.stroke();
    
    // Grid principal (5x)
    if (gridSize > 10) {
      ctx.strokeStyle = 'rgba(201, 169, 98, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      const majorGridSize = gridSize * 5;
      const majorStartX = offset.x % majorGridSize;
      const majorStartY = offset.y % majorGridSize;
      
      for (let x = majorStartX; x < width; x += majorGridSize) {
        if (x >= 0 && x <= width) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
      }
      
      for (let y = majorStartY; y < height; y += majorGridSize) {
        if (y >= 0 && y <= height) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
      }
      
      ctx.stroke();
    }
    
    // Eixos de origem
    if (projectElements?.settings.showAxes) {
      ctx.strokeStyle = 'rgba(201, 169, 98, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(metrics.centerX + offset.x, 0);
      ctx.lineTo(metrics.centerX + offset.x, height);
      ctx.moveTo(0, metrics.centerY + offset.y);
      ctx.lineTo(width, metrics.centerY + offset.y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, [projectElements?.settings.showGrid, projectElements?.settings.showAxes, projectElements?.settings.gridSize, scale, offset]);

  const drawWall = useCallback((ctx: CanvasRenderingContext2D, wall: Wall, isSelected: boolean, isHovered: boolean) => {
    const start = worldToCanvas(wall.start);
    const end = worldToCanvas(wall.end);
    const thickness = Math.max(wall.thickness * scale, 2);
    
    // Culling agressivo
    if (!isInViewport([wall.start, wall.end], thickness)) return;
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const perpX = (-dy / length) * thickness / 2;
    const perpY = (dx / length) * thickness / 2;
    
    ctx.save();
    
    // Sombra sutil para profundidade
    if (isSelected || isHovered) {
      ctx.shadowColor = 'rgba(201, 169, 98, 0.5)';
      ctx.shadowBlur = isSelected ? 12 : 8;
    }
    
    ctx.fillStyle = isSelected ? '#c9a962' : isHovered ? '#d4b87a' : wall.color;
    ctx.beginPath();
    ctx.moveTo(start.x + perpX, start.y + perpY);
    ctx.lineTo(end.x + perpX, end.y + perpY);
    ctx.lineTo(end.x - perpX, end.y - perpY);
    ctx.lineTo(start.x - perpX, start.y - perpY);
    ctx.closePath();
    ctx.fill();
    
    // Borda com anti-aliasing
    ctx.strokeStyle = isSelected ? '#ffffff' : isHovered ? '#c9a962' : 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1;
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    ctx.restore();
    
    // Medidas
    if (showMeasurements && projectElements?.settings.showMeasurements && scale > 5) {
      const wallLength = spatialCache.getDistance(wall.start, wall.end);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      const text = `${wallLength.toFixed(2)}m`;
      ctx.font = `bold ${Math.max(10, 11 * (scale / 20))}px Inter, system-ui, sans-serif`;
      const textWidth = ctx.measureText(text).width;
      
      // Fundo do label
      ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
      ctx.fillRect(midX - textWidth / 2 - 6, midY - 18, textWidth + 12, 20);
      
      // Texto
      ctx.fillStyle = isSelected ? '#c9a962' : '#e5e5e5';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY - 8);
    }
  }, [worldToCanvas, scale, showMeasurements, projectElements?.settings.showMeasurements, isInViewport]);

  const drawRoom = useCallback((ctx: CanvasRenderingContext2D, room: Room, isSelected: boolean, isHovered: boolean) => {
    if (room.points.length < 3) return;
    
    // Culling de bounding box
    if (!isInViewport(room.points, 0)) return;
    
    const canvasPoints = room.points.map(p => worldToCanvas(p));
    
    ctx.save();
    
    // Preenchimento com gradiente sutil
    const gradient = ctx.createLinearGradient(
      canvasPoints[0].x, canvasPoints[0].y,
      canvasPoints[2]?.x || canvasPoints[0].x, 
      canvasPoints[2]?.y || canvasPoints[0].y
    );
    
    const baseColor = room.color;
    const alphaSelected = '50';
    const alphaHovered = '40';
    const alphaNormal = '25';
    const alphaEndSelected = '30';
    const alphaEndHovered = '25';
    const alphaEndNormal = '15';
    
    gradient.addColorStop(0, isSelected ? `${baseColor}${alphaSelected}` : isHovered ? `${baseColor}${alphaHovered}` : `${baseColor}${alphaNormal}`);
    gradient.addColorStop(1, isSelected ? `${baseColor}${alphaEndSelected}` : isHovered ? `${baseColor}${alphaEndHovered}` : `${baseColor}${alphaEndNormal}`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
    for (let i = 1; i < canvasPoints.length; i++) {
      ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Contorno
    ctx.strokeStyle = isSelected ? '#c9a962' : isHovered ? '#d4b87a' : baseColor;
    ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Label do cômodo
    if (scale > 8) {
      const centroid = room.points.reduce((acc, p) => ({ 
        x: acc.x + p.x, 
        y: acc.y + p.y 
      }), { x: 0, y: 0 });
      centroid.x /= room.points.length;
      centroid.y /= room.points.length;
      const center = worldToCanvas(centroid);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(11, 12 * (scale / 20))}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(room.name, center.x, center.y - 10);
      
      ctx.font = `${Math.max(9, 10 * (scale / 20))}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`${room.area.toFixed(1)}m²`, center.x, center.y + 8);
    }
    
    ctx.restore();
  }, [worldToCanvas, scale, isInViewport]);

  const drawDoor = useCallback((ctx: CanvasRenderingContext2D, door: any, isSelected: boolean, isHovered: boolean) => {
    const wall = projectElements?.walls.find((w: Wall) => w.id === door.wallId);
    if (!wall) return;
    
    if (!isInViewport([wall.start, wall.end], door.width * scale)) return;
    
    const start = worldToCanvas(wall.start);
    const end = worldToCanvas(wall.end);
    const t = door.position;
    
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    const doorWidthPx = door.width * scale;
    
    ctx.save();
    ctx.strokeStyle = isSelected ? '#c9a962' : isHovered ? '#d4b87a' : '#8B4513';
    ctx.fillStyle = isSelected ? 'rgba(201, 169, 98, 0.3)' : isHovered ? 'rgba(212, 184, 122, 0.25)' : 'rgba(139, 69, 19, 0.2)';
    ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
    ctx.lineCap = 'round';
    
    // Arco da porta
    ctx.beginPath();
    ctx.arc(x, y, doorWidthPx / 2, 0, Math.PI / 2);
    ctx.stroke();
    
    // Linha da folha
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + doorWidthPx / 2, y);
    ctx.stroke();
    
    // Preenchimento sutil
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, doorWidthPx / 2, 0, Math.PI / 2);
    ctx.lineTo(x, y);
    ctx.fill();
    
    ctx.restore();
  }, [projectElements?.walls, worldToCanvas, scale, isInViewport]);

  const drawWindow = useCallback((ctx: CanvasRenderingContext2D, window: any, isSelected: boolean, isHovered: boolean) => {
    const wall = projectElements?.walls.find((w: Wall) => w.id === window.wallId);
    if (!wall) return;
    
    if (!isInViewport([wall.start, wall.end], window.width * scale)) return;
    
    const start = worldToCanvas(wall.start);
    const end = worldToCanvas(wall.end);
    const t = window.position;
    
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    const windowWidthPx = window.width * scale;
    
    ctx.save();
    ctx.strokeStyle = isSelected ? '#c9a962' : isHovered ? '#d4b87a' : '#87CEEB';
    ctx.fillStyle = isSelected ? 'rgba(201, 169, 98, 0.4)' : isHovered ? 'rgba(212, 184, 122, 0.35)' : 'rgba(135, 206, 235, 0.3)';
    ctx.lineWidth = isSelected ? 4 : isHovered ? 3.5 : 3;
    ctx.lineCap = 'round';
    
    // Abertura do vidro
    const halfWidth = windowWidthPx / 2;
    ctx.fillRect(x - halfWidth, y - 6, windowWidthPx, 12);
    
    // Moldura
    ctx.beginPath();
    ctx.moveTo(x - halfWidth, y - 6);
    ctx.lineTo(x + halfWidth, y - 6);
    ctx.moveTo(x - halfWidth, y + 6);
    ctx.lineTo(x + halfWidth, y + 6);
    ctx.stroke();
    
    // Divisória central
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
    
    ctx.restore();
  }, [projectElements?.walls, worldToCanvas, scale, isInViewport]);

  const drawFurniture = useCallback((ctx: CanvasRenderingContext2D, furniture: any, isSelected: boolean, isHovered: boolean) => {
    const pos = worldToCanvas(furniture.position);
    const width = furniture.scale.x * scale;
    const depth = furniture.scale.y * scale;
    
    // Culling
    if (pos.x + width / 2 < 0 || pos.x - width / 2 > metricsRef.current.width || 
        pos.y + depth / 2 < 0 || pos.y - depth / 2 > metricsRef.current.height) return;
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(-furniture.rotation);
    
    // Sombra
    if (isSelected || isHovered) {
      ctx.shadowColor = 'rgba(201, 169, 98, 0.5)';
      ctx.shadowBlur = isSelected ? 12 : 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }
    
    // Corpo
    ctx.fillStyle = isSelected ? 'rgba(201, 169, 98, 0.7)' : isHovered ? 'rgba(212, 184, 122, 0.65)' : furniture.color;
    ctx.strokeStyle = isSelected ? '#c9a962' : isHovered ? '#d4b87a' : 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1;
    
    ctx.fillRect(-width / 2, -depth / 2, width, depth);
    ctx.strokeRect(-width / 2, -depth / 2, width, depth);
    
    // Reset shadow para texto
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Label
    if (scale > 10) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(8, 9 * (scale / 20))}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(furniture.name, 0, 0);
    }
    
    ctx.restore();
  }, [worldToCanvas, scale]);

  const drawPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDrawing || !drawStart || !drawCurrent) return;
    
    const start = worldToCanvas(drawStart);
    const end = worldToCanvas(drawCurrent);
    
    ctx.save();
    
    // Linha de preview animada
    ctx.strokeStyle = '#c9a962';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.lineDashOffset = -performance.now() / 20; // Animação
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Distância
    const dist = spatialCache.getDistance(drawStart, drawCurrent);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    const text = `${dist.toFixed(2)}m`;
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    const textWidth = ctx.measureText(text).width;
    
    ctx.fillStyle = 'rgba(10, 10, 15, 0.95)';
    ctx.fillRect(midX - textWidth / 2 - 8, midY - 26, textWidth + 16, 26);
    
    ctx.fillStyle = '#c9a962';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, midX, midY - 13);
    
    // Ângulo
    const angle = calculateAngle(drawStart, drawCurrent);
    const angleText = `${angle.toFixed(0)}°`;
    const angleTextWidth = ctx.measureText(angleText).width;
    
    ctx.fillStyle = 'rgba(10, 10, 15, 0.95)';
    ctx.fillRect(start.x - angleTextWidth / 2 - 8, start.y - 32, angleTextWidth + 16, 22);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(angleText, start.x, start.y - 21);
    
    // Indicador de snap ativo
    if (snapIndicator) {
      ctx.strokeStyle = '#c9a962';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }, [isDrawing, drawStart, drawCurrent, worldToCanvas, calculateAngle, snapIndicator]);

  const drawSnapIndicator = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!snapIndicator) return;
    
    const point = worldToCanvas(snapIndicator.point);
    
    ctx.save();
    ctx.strokeStyle = '#c9a962';
    ctx.fillStyle = 'rgba(201, 169, 98, 0.25)';
    ctx.lineWidth = 2.5;
    
    // Círculo pulsante maior
    const pulse = 1 + Math.sin(performance.now() / 150) * 0.25;
    const baseRadius = 10;
    
    // Círculo externo pulsante
    ctx.beginPath();
    ctx.arc(point.x, point.y, baseRadius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(201, 169, 98, 0.15)';
    ctx.fill();
    
    // Círculo interno
    ctx.beginPath();
    ctx.arc(point.x, point.y, baseRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(201, 169, 98, 0.35)';
    ctx.fill();
    ctx.stroke();
    
    // Cruz maior
    const crossSize = 18;
    ctx.beginPath();
    ctx.moveTo(point.x - crossSize, point.y);
    ctx.lineTo(point.x + crossSize, point.y);
    ctx.moveTo(point.x, point.y - crossSize);
    ctx.lineTo(point.x, point.y + crossSize);
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  }, [snapIndicator, worldToCanvas]);

  const drawSelectionBox = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDragSelecting || !selectionBox) return;
    
    const start = worldToCanvas(selectionBox.start);
    const end = worldToCanvas(selectionBox.current);
    
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    ctx.save();
    
    // Fundo semi-transparente
    ctx.fillStyle = 'rgba(201, 169, 98, 0.15)';
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    
    // Borda tracejada animada
    ctx.strokeStyle = '#c9a962';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -performance.now() / 30;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    
    ctx.restore();
  }, [isDragSelecting, selectionBox, worldToCanvas]);

  // ============================================
  // RENDER LOOP OTIMIZADO
  // ============================================

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Throttling para 60fps estável
    const now = performance.now();
    if (now - lastRenderRef.current < RENDER_THROTTLE) return;
    lastRenderRef.current = now;
    
    // Fundo
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, metricsRef.current.width, metricsRef.current.height);
    
    drawGrid(ctx);
    
    if (!projectElements) return;
    
    // Renderização em camadas (painter's algorithm)
    // 1. Cômodos (fundo)
    projectElements.rooms.forEach((room: Room) => {
      const isSelected = selectedElement === room.id && selectedElementType === 'room';
      const isHovered = hoveredElement === room.id && hoveredElementType === 'room';
      drawRoom(ctx, room, isSelected, isHovered);
    });
    
    // 2. Paredes
    projectElements.walls.forEach((wall: Wall) => {
      const isSelected = selectedElement === wall.id && selectedElementType === 'wall';
      const isHovered = hoveredElement === wall.id && hoveredElementType === 'wall';
      drawWall(ctx, wall, isSelected, isHovered);
    });
    
    // 3. Aberturas
    projectElements.doors.forEach((door: any) => {
      const isSelected = selectedElement === door.id && selectedElementType === 'door';
      const isHovered = hoveredElement === door.id && hoveredElementType === 'door';
      drawDoor(ctx, door, isSelected, isHovered);
    });
    
    projectElements.windows.forEach((window: any) => {
      const isSelected = selectedElement === window.id && selectedElementType === 'window';
      const isHovered = hoveredElement === window.id && hoveredElementType === 'window';
      drawWindow(ctx, window, isSelected, isHovered);
    });
    
    // 4. Mobiliário
    projectElements.furniture.forEach((furniture: any) => {
      const isSelected = selectedElement === furniture.id && selectedElementType === 'furniture';
      const isHovered = hoveredElement === furniture.id && hoveredElementType === 'furniture';
      drawFurniture(ctx, furniture, isSelected, isHovered);
    });
    
    // 5. Overlays
    drawPreview(ctx);
    drawSnapIndicator(ctx);
    drawSelectionBox(ctx);
  }, [
    projectElements,
    selectedElement,
    selectedElementType,
    hoveredElement,
    hoveredElementType,
    drawGrid,
    drawRoom,
    drawWall,
    drawDoor,
    drawWindow,
    drawFurniture,
    drawPreview,
    drawSnapIndicator,
    drawSelectionBox,
  ]);

  useEffect(() => {
    const animate = () => {
      render();
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [render]);

  // ============================================
  // HANDLERS DE INTERAÇÃO PREMIUM
  // ============================================

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn('Failed to capture pointer:', err);
    }
    
    const canvasPoint = getCanvasPoint(e);
    if (!canvasPoint) return;
    
    const worldPoint = canvasToWorld(canvasPoint);
    
    // Botão do meio ou Alt+Click = Pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart(canvasPoint);
      setCursor('grabbing');
      return;
    }
    
    // Click esquerdo = Interação
    if (e.button === 0) {
      const snappedPoint = getBestSnapPoint(worldPoint);
      
      // Processa gesto de tap
      const touch: TouchPoint = {
        id: e.pointerId,
        position: snappedPoint,
        timestamp: performance.now()
      };
      
      const tapResult = processTap(gestureStateRef.current, snappedPoint);
      gestureStateRef.current = {
        ...gestureStateRef.current,
        ...tapResult,
        touches: [touch]
      };
      
      if (toolMode === 'wall') {
        startDrawing(snappedPoint);
        setCursor('crosshair');
      } else if (toolMode === 'select') {
        // Hit test para seleção
        const hit = hitTest(worldPoint);
        
        if (hit) {
          selectElement(hit.id, hit.type);
          setDraggedElement(hit.id);
          setDragOffset({
            x: worldPoint.x - (hit.type === 'furniture' ? 
              projectElements?.furniture.find((f: any) => f.id === hit.id)?.position.x || 0 :
              hit.type === 'room' ?
              projectElements?.rooms.find((r: Room) => r.id === hit.id)?.points[0]?.x || 0 :
              0),
            y: worldPoint.y - (hit.type === 'furniture' ? 
              projectElements?.furniture.find((f: any) => f.id === hit.id)?.position.y || 0 :
              hit.type === 'room' ?
              projectElements?.rooms.find((r: Room) => r.id === hit.id)?.points[0]?.y || 0 :
              0)
          });
          setIsDraggingElement(true);
          setCursor('move');
        } else {
          // Iniciar drag selection
          selectElement(null);
          setIsDragSelecting(true);
          setSelectionStart(worldPoint);
          setSelectionBox({ start: worldPoint, current: worldPoint });
          setCursor('crosshair');
        }
      }
    }
  }, [getCanvasPoint, canvasToWorld, getBestSnapPoint, toolMode, startDrawing, selectElement, hitTest, projectElements]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvasPoint = getCanvasPoint(e);
    if (!canvasPoint) return;
    
    setMousePos(canvasPoint);
    
    const worldPoint = canvasToWorld(canvasPoint);
    setWorldMousePos(worldPoint);
    
    // Throttle para hover detection
    const now = performance.now();
    if (now - hoverThrottleRef.current > HOVER_THROTTLE) {
      hoverThrottleRef.current = now;
      
      // Hover detection no modo select
      if (toolMode === 'select' && !isPanning && !isDrawing && !isDragSelecting && !isDraggingElement) {
        const hit = hitTest(worldPoint);
        if (hit) {
          setHoveredElement(hit.id);
          setHoveredElementType(hit.type);
          setCursor('pointer');
        } else {
          setHoveredElement(null);
          setHoveredElementType(null);
          setCursor('default');
        }
      }
    }
    
    // Integração GestureEngine
    const touch: TouchPoint = {
      id: e.pointerId,
      position: worldPoint,
      timestamp: performance.now()
    };
    
    const result = updateTouches(
      gestureStateRef.current,
      [touch],
      DEFAULT_GESTURE_CONFIG
    );
    
    // Atualiza estado de gesto preservando propriedades
    gestureStateRef.current = {
      ...gestureStateRef.current,
      type: result.type,
      pan: result.pan,
      zoom: result.zoom,
      rotate: result.rotate,
      touches: [touch],
      lastTimestamp: performance.now()
    };
    
    // Debug info (remover em produção)
    if (import.meta.env.DEV) {
      setGestureDebug(`${result.type} z:${result.zoom.toFixed(2)}`);
    }
    
    // Panning
    if (isPanning) {
      const dx = (canvasPoint.x - panStart.x) * PAN_SENSITIVITY;
      const dy = (canvasPoint.y - panStart.y) * PAN_SENSITIVITY;
      setCanvasOffset({ x: offset.x + dx, y: offset.y + dy });
      setPanStart(canvasPoint);
      return;
    }
    
    // Drag selection
    if (isDragSelecting && selectionStart) {
      setSelectionBox({ start: selectionStart, current: worldPoint });
      return;
    }
    
    // Drag de elemento
    if (isDraggingElement && draggedElement) {
      // TODO: Implementar movimento real do elemento
      // Por enquanto apenas atualiza o cursor
      setCursor('move');
      return;
    }
    
    // Drawing
    if (isDrawing && drawStart) {
      let snappedPoint = getBestSnapPoint(worldPoint);
      snappedPoint = applyAngleSnap(drawStart, snappedPoint);
      updateDrawing(snappedPoint);
      setCursor('crosshair');
    }
    
    // Long press detection
    const longPressResult = checkLongPress(gestureStateRef.current, worldPoint);
    if (longPressResult) {
      // Trigger context menu ou ação secundária
      console.log('Long press detected at:', worldPoint);
    }
  }, [
    getCanvasPoint, 
    canvasToWorld, 
    isPanning, 
    panStart, 
    offset, 
    setCanvasOffset, 
    isDrawing, 
    drawStart, 
    getBestSnapPoint, 
    applyAngleSnap, 
    updateDrawing,
    toolMode,
    isDragSelecting,
    isDraggingElement,
    draggedElement,
    selectionStart,
    hitTest
  ]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
    
    // Reset completo do gesture engine usando resetGesture
    gestureStateRef.current = resetGesture(gestureStateRef.current);
    setGestureDebug('');
    
    if (isPanning) {
      setIsPanning(false);
      setCursor(toolMode === 'select' ? 'default' : 'crosshair');
      return;
    }
    
    if (isDragSelecting) {
      // Finalizar seleção por caixa
      if (selectionBox) {
        const minX = Math.min(selectionBox.start.x, selectionBox.current.x);
        const maxX = Math.max(selectionBox.start.x, selectionBox.current.x);
        const minY = Math.min(selectionBox.start.y, selectionBox.current.y);
        const maxY = Math.max(selectionBox.start.y, selectionBox.current.y);
        
        const selectionRect = { minX, minY, maxX, maxY };
        
        // Selecionar elementos dentro do retângulo
        // TODO: Implementar seleção múltipla
        console.log('Selection box:', selectionRect);
      }
      
      setIsDragSelecting(false);
      setSelectionBox(null);
      setSelectionStart(null);
      setCursor('default');
      return;
    }
    
    if (isDraggingElement) {
      setIsDraggingElement(false);
      setDraggedElement(null);
      setCursor('default');
      return;
    }
    
    if (isDrawing) {
      const canvasPoint = getCanvasPoint(e);
      if (!canvasPoint) {
        endDrawing();
        setCursor('crosshair');
        return;
      }
      
      const worldPoint = canvasToWorld(canvasPoint);
      let snappedPoint = getBestSnapPoint(worldPoint);
      
      if (drawStart) {
        snappedPoint = applyAngleSnap(drawStart, snappedPoint);
      }
      
      endDrawing(snappedPoint);
      setSnapIndicator(null);
      setCursor('crosshair');
    }
  }, [
    getCanvasPoint, 
    isPanning, 
    isDrawing, 
    isDragSelecting,
    isDraggingElement,
    drawStart, 
    canvasToWorld, 
    getBestSnapPoint, 
    applyAngleSnap, 
    endDrawing,
    selectionBox,
    toolMode
  ]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const zoomFactor = Math.exp(delta);
    const newScale = clamp(scale * zoomFactor, 0.1, 50);
    
    // Zoom towards mouse pointer
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * metricsRef.current.devicePixelRatio;
    const mouseY = (e.clientY - rect.top) * metricsRef.current.devicePixelRatio;
    
    const worldBefore = canvasToWorld({ x: mouseX, y: mouseY });
    setCanvasScale(newScale);
    
    // Ajusta offset para manter ponto sob o mouse
    requestAnimationFrame(() => {
      const worldAfter = canvasToWorld({ x: mouseX, y: mouseY });
      const dx = (worldAfter.x - worldBefore.x) * newScale;
      const dy = (worldAfter.y - worldBefore.y) * newScale;
      setCanvasOffset({ x: offset.x - dx, y: offset.y + dy });
    });
  }, [scale, offset, setCanvasScale, setCanvasOffset, canvasToWorld]);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        // Pan mode temporário
      }
      
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setAngleLock(true);
        if (isDrawing && drawStart && drawCurrent) {
          const angle = calculateAngle(drawStart, drawCurrent);
          setLockedAngle(snapAngle(angle));
        }
      }
      
      // Atalhos de zoom
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setCanvasScale(scale * 1.2);
        }
        if (e.key === '-') {
          e.preventDefault();
          setCanvasScale(scale * 0.8);
        }
        if (e.key === '0') {
          e.preventDefault();
          setCanvasScale(20);
          setCanvasOffset({ x: 0, y: 0 });
        }
      }
      
      // Delete para remover seleção
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
          // TODO: Implementar remoção de elemento
          console.log('Delete element:', selectedElement);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setAngleLock(false);
        setLockedAngle(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDrawing, drawStart, drawCurrent, angleLock, calculateAngle, snapAngle, scale, setCanvasScale, setCanvasOffset, selectedElement]);

  // ============================================
  // RESIZE HANDLER
  // ============================================

  useLayoutEffect(() => {
    const updateMetrics = () => {
      if (containerRef.current && canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        // Configura canvas com DPR para sharp rendering
        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
        
        metricsRef.current = {
          width: width * dpr,
          height: height * dpr,
          centerX: (width * dpr) / 2,
          centerY: (height * dpr) / 2,
          devicePixelRatio: dpr
        };
      }
    };
    
    const handleResize = () => {
      updateMetrics();
      spatialCache.clear();
    };
    
    const handleOrientationChange = () => {
      setTimeout(updateMetrics, 100);
    };
    
    updateMetrics();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // ============================================
  // RENDER
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
        style={{ 
          touchAction: 'none',
          cursor: cursor
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          setIsPanning(false);
          setIsDragSelecting(false);
          setIsDraggingElement(false);
          if (isDrawing) endDrawing();
          setSnapIndicator(null);
          setHoveredElement(null);
          setHoveredElementType(null);
          setCursor('default');
          gestureStateRef.current = resetGesture(gestureStateRef.current);
        }}
        onWheel={handleWheel}
      />
      
      {/* Toolbar Flutuante Premium */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 px-2">
          <button
            onClick={() => setCanvasScale(scale * 1.2)}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-150 text-white/70 hover:text-white font-medium text-lg"
            title="Zoom In (Ctrl++)"
            aria-label="Zoom in"
          >
            +
          </button>
          
          <div className="flex flex-col items-center min-w-[4rem]">
            <span className="text-xs font-semibold text-white/80">
              {scale.toFixed(0)}%
            </span>
            <span className="text-[10px] text-white/40">Zoom</span>
          </div>
          
          <button
            onClick={() => setCanvasScale(scale * 0.8)}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-150 text-white/70 hover:text-white font-medium text-lg"
            title="Zoom Out (Ctrl+-)"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
        
        <div className="w-px h-8 bg-white/10" />
        
        {/* Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
              snapEnabled 
                ? 'bg-[#c9a962]/20 text-[#c9a962] shadow-inner' 
                : 'hover:bg-white/10 text-white/40'
            }`}
            title={`Snap: ${snapEnabled ? 'ON' : 'OFF'}`}
            aria-label="Toggle snap"
            aria-pressed={snapEnabled}
          >
            <Magnet size={18} strokeWidth={snapEnabled ? 2.5 : 2} />
          </button>
          
          <button
            onClick={() => setShowMeasurements(!showMeasurements)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
              showMeasurements 
                ? 'bg-[#c9a962]/20 text-[#c9a962] shadow-inner' 
                : 'hover:bg-white/10 text-white/40'
            }`}
            title={`Measurements: ${showMeasurements ? 'ON' : 'OFF'}`}
            aria-label="Toggle measurements"
            aria-pressed={showMeasurements}
          >
            <Ruler size={18} strokeWidth={showMeasurements ? 2.5 : 2} />
          </button>
        </div>
        
        <div className="w-px h-8 bg-white/10" />
        
        {/* View Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setCanvasScale(20);
              setCanvasOffset({ x: 0, y: 0 });
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-150 text-white/70 hover:text-white"
            title="Reset View (Ctrl+0)"
            aria-label="Reset view"
          >
            <Maximize2 size={18} />
          </button>
          
          <button
            onClick={() => {
              // Reset rotation se implementado no futuro
              setCanvasScale(20);
              setCanvasOffset({ x: 0, y: 0 });
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 active:bg-white/20 rounded-xl transition-all duration-150 text-white/70 hover:text-white"
            title="Center View"
            aria-label="Center view"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
      
      {/* Info Panel */}
      <div className="absolute bottom-6 left-6 p-4 bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl min-w-[160px]">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">Position</span>
            <span className="text-xs font-mono text-white/70">
              {worldMousePos.x.toFixed(2)}, {worldMousePos.y.toFixed(2)}
            </span>
          </div>
          
          {snapIndicator && (
            <div className="flex justify-between items-center animate-in fade-in duration-200">
              <span className="text-[11px] uppercase tracking-wider text-[#c9a962]/70 font-medium">Snap</span>
              <span className="text-xs font-medium text-[#c9a962] capitalize">
                {snapIndicator.type}
              </span>
            </div>
          )}
          
          {angleLock && (
            <div className="flex justify-between items-center animate-in fade-in duration-200">
              <span className="text-[11px] uppercase tracking-wider text-[#c9a962]/70 font-medium">Angle</span>
              <span className="text-xs font-medium text-[#c9a962]">
                {lockedAngle?.toFixed(0)}°
              </span>
            </div>
          )}
          
          {hoveredElement && (
            <div className="flex justify-between items-center animate-in fade-in duration-200">
              <span className="text-[11px] uppercase tracking-wider text-[#c9a962]/70 font-medium">Hover</span>
              <span className="text-xs font-medium text-[#c9a962] capitalize">
                {hoveredElementType}
              </span>
            </div>
          )}
          
          {selectedElement && (
            <div className="flex justify-between items-center animate-in fade-in duration-200">
              <span className="text-[11px] uppercase tracking-wider text-emerald-400/70 font-medium">Selected</span>
              <span className="text-xs font-medium text-emerald-400 capitalize">
                {selectedElementType}
              </span>
            </div>
          )}
          
          {import.meta.env.DEV && gestureDebug && (
            <div className="pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono text-white/30">{gestureDebug}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Scale Indicator */}
      <div className="absolute bottom-6 right-6 px-4 py-3 bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-white/50">
            <Grid3X3 size={14} className="text-[#c9a962]" />
            <span className="font-medium">{projectElements?.settings.gridSize || 0.5}m</span>
          </div>
          
          <div className="w-px h-3 bg-white/10" />
          
          <div className="flex items-center gap-1.5 text-white/50">
            <span className="font-medium uppercase tracking-wide">
              {projectElements?.settings.unit === 'meters' ? 'Metric' : 'Imperial'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas2D;
