/**
 * FILE: Canvas2D.tsx
 *
 * O que este arquivo faz:
 * Renderiza o ambiente de desenho 2D do CasaPro.
 *
 * Responsabilidade:
 * - Renderizar grid, paredes, portas, janelas, móveis e ambientes
 * - Controlar interação do usuário (mouse, touch, pan, zoom)
 * - Exibir preview de desenho e medições em tempo real
 * - Gerenciar snap de pontos, ângulos e grid
 *
 * Usado por:
 * EditorView.tsx
 *
 * Este arquivo representa o canvas principal do editor 2D.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import type { Point, Wall, Room } from '@/types';
import { Ruler, Grid3X3, Magnet } from 'lucide-react';

import { PointerEngine } from '@/core/interaction/pointerEngine';

const pointerEngine = new PointerEngine();

// Snap angles configuration
const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const ANGLE_SNAP_THRESHOLD = 8; // degrees

interface SnapPoint {
  point: Point;
  type: 'grid' | 'endpoint' | 'intersection' | 'angle' | 'midpoint';
  priority: number;
}

const Canvas2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [snapIndicator, setSnapIndicator] = useState<SnapPoint | null>(null);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [angleLock, setAngleLock] = useState(false);
  const [lockedAngle, setLockedAngle] = useState<number | null>(null);
  
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

  const worldToCanvas = useCallback((point: Point): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    return {
      x: point.x * scale + offset.x + canvas.width / 2,
      y: -point.y * scale + offset.y + canvas.height / 2,
    };
  }, [scale, offset]);

  const canvasToWorld = useCallback((point: Point): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    return {
      x: (point.x - offset.x - canvas.width / 2) / scale,
      y: -(point.y - offset.y - canvas.height / 2) / scale,
    };
  }, [scale, offset]);

  const snapToGrid = useCallback((point: Point): Point => {
    if (!currentProject?.settings.snapToGrid || !snapEnabled) return point;
    const gridSize = currentProject.settings.gridSize;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }, [currentProject?.settings.snapToGrid, currentProject?.settings.gridSize, snapEnabled]);

  const calculateAngle = useCallback((start: Point, end: Point): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  }, []);

  const snapAngle = useCallback((angle: number): number => {
    if (!snapEnabled || !currentProject?.settings.snapToAngle) return angle;
    
    if (angleLock && lockedAngle !== null) {
      return lockedAngle;
    }
    
    const snapAngles = currentProject?.settings.snapAngles || SNAP_ANGLES;
    
    for (const snapAngle of snapAngles) {
      const diff = Math.abs(angle - snapAngle);
      if (diff <= ANGLE_SNAP_THRESHOLD || diff >= 360 - ANGLE_SNAP_THRESHOLD) {
        return snapAngle;
      }
    }
    return angle;
  }, [snapEnabled, currentProject?.settings.snapToAngle, currentProject?.settings.snapAngles, angleLock, lockedAngle]);

  const findSnapPoints = useCallback((point: Point): SnapPoint[] => {
    if (!currentProject || !snapEnabled) return [];
    
    const snapPoints: SnapPoint[] = [];
    const snapThreshold = 0.3;
    
    const gridPoint = snapToGrid(point);
    const gridDist = Math.sqrt(
      Math.pow(gridPoint.x - point.x, 2) + 
      Math.pow(gridPoint.y - point.y, 2)
    );
    if (gridDist < snapThreshold) {
      snapPoints.push({ point: gridPoint, type: 'grid', priority: 1 });
    }
    
    currentProject.walls.forEach(wall => {
      const startDist = Math.sqrt(
        Math.pow(wall.start.x - point.x, 2) + 
        Math.pow(wall.start.y - point.y, 2)
      );
      if (startDist < snapThreshold) {
        snapPoints.push({ point: wall.start, type: 'endpoint', priority: 3 });
      }
      
      const endDist = Math.sqrt(
        Math.pow(wall.end.x - point.x, 2) + 
        Math.pow(wall.end.y - point.y, 2)
      );
      if (endDist < snapThreshold) {
        snapPoints.push({ point: wall.end, type: 'endpoint', priority: 3 });
      }
      
      const midPoint: Point = {
        x: (wall.start.x + wall.end.x) / 2,
        y: (wall.start.y + wall.end.y) / 2,
      };
      const midDist = Math.sqrt(
        Math.pow(midPoint.x - point.x, 2) + 
        Math.pow(midPoint.y - point.y, 2)
      );
      if (midDist < snapThreshold) {
        snapPoints.push({ point: midPoint, type: 'midpoint', priority: 2 });
      }
    });
    
    currentProject.rooms.forEach(room => {
      room.points.forEach(corner => {
        const cornerDist = Math.sqrt(
          Math.pow(corner.x - point.x, 2) + 
          Math.pow(corner.y - point.y, 2)
        );
        if (cornerDist < snapThreshold) {
          snapPoints.push({ point: corner, type: 'endpoint', priority: 3 });
        }
      });
    });
    
    return snapPoints.sort((a, b) => b.priority - a.priority);
  }, [currentProject, snapEnabled, snapToGrid]);

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
    
    if (snappedAngle !== angle) {
      const distance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + 
        Math.pow(end.y - start.y, 2)
      );
      const rad = snappedAngle * (Math.PI / 180);
      return {
        x: start.x + Math.cos(rad) * distance,
        y: start.y + Math.sin(rad) * distance,
      };
    }
    return end;
  }, [snapEnabled, calculateAngle, snapAngle]);

  // (continua exatamente igual até o final do arquivo...)

export default Canvas2D;
