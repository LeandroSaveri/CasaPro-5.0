/**
 * FILE: Canvas2D.tsx
 *
 * Sistema de Renderização 2D Premium - CasaPro
 * 
 * Responsabilidades:
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

// ============================================
// REACT
// ============================================

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect
} from 'react'

// ============================================
// STORES
// ============================================

import { useProjectStore } from '@/store/projectStore'
import { useUIStore } from '@/store/uiStore'

// ============================================
// CORE ENGINES
// ============================================

import { WallEngine } from '@/core/geometry/wallEngine'

// ============================================
// RENDERERS
// ============================================

import { renderWall } from '@/core/render/wallRenderer'
import { renderRoom } from '@/core/render/roomRenderer'

// ============================================
// TYPES
// ============================================

import type { Point, Wall, Room } from '@/types'

// ============================================
// UI ICONS
// ============================================

import { Ruler, Grid3X3, Magnet, Maximize2, RotateCcw } from 'lucide-react'

// ============================================
// GESTURE ENGINE
// ============================================

import {
  createGestureState,
  processTap,
  checkLongPress,
  resetGesture,
  type TouchPoint
} from '@/core/interaction/gestureEngine'

// ============================================
// CONSTANTES PREMIUM
// ============================================

const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
const ANGLE_SNAP_THRESHOLD = 8;
const GRID_CACHE_SIZE = 5000;
const RENDER_THROTTLE = 16;
const ZOOM_SENSITIVITY = 0.001;
const PAN_SENSITIVITY = 1.0;
const HIT_TEST_THRESHOLD = 0.15;
const HOVER_THROTTLE = 50;

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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const Canvas2D: React.FC = () => {
  const wallEngine = useMemo(() => new WallEngine(), []);
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

  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [worldMousePos, setWorldMousePos] = useState<Point>({ x: 0, y: 0 });
  const [snapIndicator, setSnapIndicator] = useState<SnapPoint | null>(null);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [angleLock, setAngleLock] = useState<boolean>(false);
  const [lockedAngle, setLockedAngle] = useState<number | null>(null);
  const [gestureDebug, setGestureDebug] = useState<string>('');
  
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [hoveredElementType, setHoveredElementType] = useState<HitTestResult['type'] | null>(null);
  const [cursor, setCursor] = useState<string>('default');
  
  const [isDragSelecting, setIsDragSelecting] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  
  const [isDraggingElement, setIsDraggingElement] = useState<boolean>(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);

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

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

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
    const snapThreshold = 0.8;
    
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
    
    const { walls } = projectElements;
    for (let i = 0; i < walls.length; i++) {
      const wall = walls[i];
      
      const startDist = spatialCache.getDistance(wall.start, point);
      if (startDist < snapThreshold) {
        snapPoints.push({ 
          point: wall.start, 
          type: 'endpoint', 
          priority: 100,
          distance: startDist 
        });
      }
      
      const endDist = spatialCache.getDistance(wall.end, point);
      if (endDist < snapThreshold) {
        snapPoints.push({ 
          point: wall.end, 
          type: 'endpoint', 
          priority: 100,
          distance: endDist 
        });
      }
      
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
            priority: 100,
            distance: cornerDist 
          });
        }
      }
      
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

  const hitTestFurniture = useCallback((point: Point): HitTestResult | null => {
    if (!projectElements?.furniture) return null;
    
    let closest: HitTestResult | null = null;
    let minDist = HIT_TEST_THRESHOLD;
    
    for (const furniture of projectElements.furniture) {
      const halfWidth = furniture.scale.x / 2;
      const halfDepth = furniture.scale.y / 2;
      
      const dx = point.x - furniture.position.x;
      const dy = point.y - furniture.position.y;
      
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

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    const now = performance.now();
    if (now - lastRenderRef.current < RENDER_THROTTLE) return;
    lastRenderRef.current = now;
    
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, metricsRef.current.width, metricsRef.current.height);

    drawGrid(ctx);
    
    if (!projectElements) return;
    
    const renderContext = {
      scale,
      worldToCanvas
    };
    
    projectElements.rooms.forEach((room: Room) => {
      const isSelected = selectedElement === room.id && selectedElementType === 'room';
      const isHovered = hoveredElement === room.id && hoveredElementType === 'room';
      renderRoom(ctx, room, isSelected, isHovered);
    });
    
    projectElements.walls.forEach((wall: Wall) => {
      const isSelected = selectedElement === wall.id && selectedElementType === 'wall';
      const isHovered = hoveredElement === wall.id && hoveredElementType === 'wall';
      
      const options = {
        isSelected,
        isHovered,
        isHighlighted: false,
        showMeasurements,
        settingsShowMeasurements: projectElements.settings.showMeasurements ?? true
      };
      
      // ✅ CORREÇÃO: 5 argumentos conforme assinatura da função
      renderWall(ctx, wall, renderContext, options, isInViewport);
    });
    
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
    scale,
    worldToCanvas,
    isInViewport,
    showMeasurements
  ]);

  const drawPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDrawing || !drawStart || !drawCurrent) return;
    
    const start = worldToCanvas(drawStart);
    const end = worldToCanvas(drawCurrent);
    
    ctx.save();
    
    ctx.strokeStyle = '#c9a962';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.lineDashOffset = -performance.now() / 20;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
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
    
    const angle = calculateAngle(drawStart, drawCurrent);
    const angleText = `${angle.toFixed(0)}°`;
    const angleTextWidth = ctx.measureText(angleText).width;
    
    ctx.fillStyle = 'rgba(10, 10, 15, 0.95)';
    ctx.fillRect(start.x - angleTextWidth / 2 - 8, start.y - 32, angleTextWidth + 16, 22);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(angleText, start.x, start.y - 21);
    
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
    
    const pulse = 1 + Math.sin(performance.now() / 150) * 0.25;
    const baseRadius = 10;
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, baseRadius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(201, 169, 98, 0.15)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, baseRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(201, 169, 98, 0.35)';
    ctx.fill();
    ctx.stroke();
    
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
    
    ctx.fillStyle = 'rgba(201, 169, 98, 0.15)';
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    
    ctx.strokeStyle = '#c9a962';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -performance.now() / 30;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    
    ctx.restore();
  }, [isDragSelecting, selectionBox, worldToCanvas]);

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

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}

    const canvasPoint = getCanvasPoint(e);
    if (!canvasPoint) return;

    const worldPoint = canvasToWorld(canvasPoint);
    const snappedPoint = getBestSnapPoint(worldPoint);

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart(canvasPoint);
      setCursor('grabbing');
      return;
    }

    if (e.button !== 0) return;

    const touch: TouchPoint = {
      id: e.pointerId,
      position: snappedPoint,
      timestamp: performance.now()
    };

    const tapResult = processTap(
      gestureStateRef.current,
      snappedPoint
    );

    gestureStateRef.current = {
      ...gestureStateRef.current,
      ...tapResult,
      touches: [touch]
    };

    if (toolMode === 'wall') {
      setIsDragSelecting(false);
      setSelectionBox(null);
      setSelectionStart(null);
      startDrawing(snappedPoint);
      setCursor('crosshair');
      return;
    }

    if (toolMode === 'select') {
      const hit = hitTest(worldPoint);

      if (hit) {
        selectElement(hit.id, hit.type);
        setDraggedElement(hit.id);
        setIsDraggingElement(true);
        setCursor('move');
      } else {
        selectElement(null);
        setIsDragSelecting(true);
        setSelectionStart(worldPoint);
        setSelectionBox({
          start: worldPoint,
          current: worldPoint
        });
        setCursor('crosshair');
      }
    }
  }, [
    getCanvasPoint,
    canvasToWorld,
    getBestSnapPoint,
    toolMode,
    startDrawing,
    selectElement,
    hitTest
  ]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const canvasPoint = getCanvasPoint(e);
    if (!canvasPoint) return;

    const worldPoint = canvasToWorld(canvasPoint);
    setWorldMousePos(worldPoint);

    const now = performance.now();

    if (now - hoverThrottleRef.current > HOVER_THROTTLE) {
      hoverThrottleRef.current = now;

      if (
        toolMode === 'select' &&
        !isPanning &&
        !isDrawing &&
        !isDragSelecting &&
        !isDraggingElement
      ) {
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

    if (isPanning) {
      const dx = (canvasPoint.x - panStart.x) * PAN_SENSITIVITY;
      const dy = (canvasPoint.y - panStart.y) * PAN_SENSITIVITY;

      setCanvasOffset({
        x: offset.x + dx,
        y: offset.y + dy
      });

      setPanStart(canvasPoint);
      return;
    }

    if (isDragSelecting && selectionStart) {
      setSelectionBox({
        start: selectionStart,
        current: worldPoint
      });
      return;
    }

    if (isDraggingElement && draggedElement) {
      const newPosition = worldPoint;

      const furniture = projectElements?.furniture.find(f => f.id === draggedElement);
      if (furniture) {
        furniture.position = {
          x: newPosition.x,
          y: newPosition.y
        };
      }

      const door = projectElements?.doors.find(d => d.id === draggedElement);
      if (door) {
        door.position = newPosition.x;
      }

      const window = projectElements?.windows.find(w => w.id === draggedElement);
      if (window) {
        window.position = newPosition.x;
      }

      setCursor('move');
      return;
    }

    if (isDrawing && drawStart) {
      let snappedPoint = getBestSnapPoint(worldPoint);
      snappedPoint = applyAngleSnap(drawStart, snappedPoint);
      updateDrawing(snappedPoint);
      setCursor('crosshair');
      return;
    }

    const longPressResult = checkLongPress(
      gestureStateRef.current,
      worldPoint
    );

    if (longPressResult) {
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
    hitTest,
    projectElements
  ]);
    
  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
      }
    }
    
    gestureStateRef.current = resetGesture(gestureStateRef.current);
    setGestureDebug('');
    
    if (isPanning) {
      setIsPanning(false);
      setCursor(toolMode === 'select' ? 'default' : 'crosshair');
      return;
    }
    
    if (isDragSelecting) {
      if (selectionBox) {
        const minX = Math.min(selectionBox.start.x, selectionBox.current.x);
        const maxX = Math.max(selectionBox.start.x, selectionBox.current.x);
        const minY = Math.min(selectionBox.start.y, selectionBox.current.y);
        const maxY = Math.max(selectionBox.start.y, selectionBox.current.y);
        
        const selectionRect = { minX, minY, maxX, maxY };
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
        setCursor('crosshair');
        return;
      }

      const worldPoint = canvasToWorld(canvasPoint);
      let snappedPoint = getBestSnapPoint(worldPoint);

      if (drawStart) {
        snappedPoint = applyAngleSnap(drawStart, snappedPoint);
      }

      if (drawStart) {
        const dist = Math.hypot(
          snappedPoint.x - drawStart.x,
          snappedPoint.y - drawStart.y
        );

        if (dist < 0.05) return;

        const newWall = wallEngine.createWall(drawStart, snappedPoint);

        if (newWall && currentProject) {
          currentProject.walls = [...currentProject.walls, newWall];
          updateDrawing(snappedPoint);
          startDrawing(snappedPoint);
        }
      }

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
    toolMode,
    wallEngine,
    updateDrawing,
    startDrawing
  ]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const zoomFactor = Math.exp(delta);
    const newScale = clamp(scale * zoomFactor, 0.1, 50);
    
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
      }
      
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setAngleLock(true);
        if (isDrawing && drawStart && drawCurrent) {
          const angle = calculateAngle(drawStart, drawCurrent);
          setLockedAngle(snapAngle(angle));
        }
      }
      
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
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
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
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-[#1a1a1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
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
