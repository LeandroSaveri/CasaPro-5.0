import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import type { Point, Wall, Room } from '@/types';
import { Ruler, Grid3X3, Magnet } from 'lucide-react';

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

  // Convert world coordinates to canvas
  const worldToCanvas = useCallback((point: Point): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    return {
      x: point.x * scale + offset.x + canvas.width / 2,
      y: -point.y * scale + offset.y + canvas.height / 2,
    };
  }, [scale, offset]);

  // Convert canvas coordinates to world
  const canvasToWorld = useCallback((point: Point): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    return {
      x: (point.x - offset.x - canvas.width / 2) / scale,
      y: -(point.y - offset.y - canvas.height / 2) / scale,
    };
  }, [scale, offset]);

  // Snap to grid
  const snapToGrid = useCallback((point: Point): Point => {
    if (!currentProject?.settings.snapToGrid || !snapEnabled) return point;
    const gridSize = currentProject.settings.gridSize;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }, [currentProject?.settings.snapToGrid, currentProject?.settings.gridSize, snapEnabled]);

  // Calculate angle between two points
  const calculateAngle = useCallback((start: Point, end: Point): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  }, []);

  // Snap angle to nearest snap angle
  const snapAngle = useCallback((angle: number): number => {
    if (!snapEnabled || !currentProject?.settings.snapToAngle) return angle;
    
    // If angle is locked, return locked angle
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

  // Find snap points (endpoints, intersections, midpoints)
  const findSnapPoints = useCallback((point: Point): SnapPoint[] => {
    if (!currentProject || !snapEnabled) return [];
    
    const snapPoints: SnapPoint[] = [];
    const snapThreshold = 0.3; // meters
    
    // Grid snap
    const gridPoint = snapToGrid(point);
    const gridDist = Math.sqrt(
      Math.pow(gridPoint.x - point.x, 2) + 
      Math.pow(gridPoint.y - point.y, 2)
    );
    if (gridDist < snapThreshold) {
      snapPoints.push({ point: gridPoint, type: 'grid', priority: 1 });
    }
    
    // Wall endpoints and midpoints
    currentProject.walls.forEach(wall => {
      // Start point
      const startDist = Math.sqrt(
        Math.pow(wall.start.x - point.x, 2) + 
        Math.pow(wall.start.y - point.y, 2)
      );
      if (startDist < snapThreshold) {
        snapPoints.push({ point: wall.start, type: 'endpoint', priority: 3 });
      }
      
      // End point
      const endDist = Math.sqrt(
        Math.pow(wall.end.x - point.x, 2) + 
        Math.pow(wall.end.y - point.y, 2)
      );
      if (endDist < snapThreshold) {
        snapPoints.push({ point: wall.end, type: 'endpoint', priority: 3 });
      }
      
      // Midpoint
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
    
    // Room corners
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

  // Get best snap point
  const getBestSnapPoint = useCallback((point: Point): Point => {
    const snapPoints = findSnapPoints(point);
    if (snapPoints.length > 0) {
      setSnapIndicator(snapPoints[0]);
      return snapPoints[0].point;
    }
    setSnapIndicator(null);
    return point;
  }, [findSnapPoints]);

  // Apply angle snap when drawing
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

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!currentProject?.settings.showGrid) return;
    
    const gridSize = currentProject.settings.gridSize * scale;
    const startX = offset.x % gridSize;
    const startY = offset.y % gridSize;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Vertical lines
    for (let x = startX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    // Horizontal lines
    for (let y = startY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();
    
    // Major grid lines (every 5 units)
    ctx.strokeStyle = 'rgba(201, 169, 98, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const majorGridSize = gridSize * 5;
    const majorStartX = offset.x % majorGridSize;
    const majorStartY = offset.y % majorGridSize;
    
    for (let x = majorStartX; x < width; x += majorGridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    for (let y = majorStartY; y < height; y += majorGridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();
    
    // Origin axes
    if (currentProject?.settings.showAxes) {
      ctx.strokeStyle = 'rgba(201, 169, 98, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const centerX = width / 2 + offset.x;
      const centerY = height / 2 + offset.y;
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
    }
  };

  // Draw wall
  const drawWall = (ctx: CanvasRenderingContext2D, wall: Wall, isSelected: boolean) => {
    const start = worldToCanvas(wall.start);
    const end = worldToCanvas(wall.end);
    const thickness = Math.max(wall.thickness * scale, 2);
    
    // Calculate perpendicular vector
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = (-dy / length) * thickness / 2;
    const perpY = (dx / length) * thickness / 2;
    
    // Draw wall body
    ctx.fillStyle = isSelected ? '#c9a962' : wall.color;
    ctx.beginPath();
    ctx.moveTo(start.x + perpX, start.y + perpY);
    ctx.lineTo(end.x + perpX, end.y + perpY);
    ctx.lineTo(end.x - perpX, end.y - perpY);
    ctx.lineTo(start.x - perpX, start.y - perpY);
    ctx.closePath();
    ctx.fill();
    
    // Draw wall border
    ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();
    
    // Draw measurements
    if (showMeasurements && currentProject?.settings.showMeasurements) {
      const wallLength = Math.sqrt(
        Math.pow(wall.end.x - wall.start.x, 2) + 
        Math.pow(wall.end.y - wall.start.y, 2)
      );
      
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      // Background for text
      const text = `${wallLength.toFixed(2)}m`;
      ctx.font = 'bold 11px Inter, sans-serif';
      const textWidth = ctx.measureText(text).width;
      
      ctx.fillStyle = 'rgba(10, 10, 15, 0.8)';
      ctx.fillRect(midX - textWidth / 2 - 4, midY - 16, textWidth + 8, 18);
      
      // Text
      ctx.fillStyle = isSelected ? '#c9a962' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY - 7);
    }
  };

  // Draw room
  const drawRoom = (ctx: CanvasRenderingContext2D, room: Room, isSelected: boolean) => {
    if (room.points.length < 3) return;
    
    const canvasPoints = room.points.map(p => worldToCanvas(p));
    
    // Fill room
    ctx.fillStyle = isSelected ? `${room.color}60` : `${room.color}30`;
    ctx.beginPath();
    ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
    for (let i = 1; i < canvasPoints.length; i++) {
      ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Draw room border
    ctx.strokeStyle = isSelected ? '#c9a962' : room.color;
    ctx.lineWidth = isSelected ? 2 : 1.5;
    ctx.stroke();
    
    // Draw room name and area
    const centroid = room.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    centroid.x /= room.points.length;
    centroid.y /= room.points.length;
    const center = worldToCanvas(centroid);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(room.name, center.x, center.y - 8);
    
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`${room.area.toFixed(1)}m²`, center.x, center.y + 8);
  };

  // Draw door
  const drawDoor = (ctx: CanvasRenderingContext2D, door: any, isSelected: boolean) => {
    const wall = currentProject?.walls.find(w => w.id === door.wallId);
    if (!wall) return;
    
    const start = worldToCanvas(wall.start);
    const end = worldToCanvas(wall.end);
    const t = door.position;
    
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    const doorWidthPx = door.width * scale;
    
    // Draw door swing arc
    ctx.strokeStyle = isSelected ? '#c9a962' : '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, doorWidthPx / 2, 0, Math.PI / 2);
    ctx.stroke();
    
    // Draw door line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + doorWidthPx / 2, y);
    ctx.stroke();
  };

  // Draw window
  const drawWindow = (ctx: CanvasRenderingContext2D, window: any, isSelected: boolean) => {
    const wall = currentProject?.walls.find(w => w.id === window.wallId);
    if (!wall) return;
    
    const start = worldToCanvas(wall.start);
    const end = worldToCanvas(wall.end);
    const t = window.position;
    
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    const windowWidthPx = window.width * scale;
    
    // Draw window frame
    ctx.strokeStyle = isSelected ? '#c9a962' : '#87CEEB';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - windowWidthPx / 2, y - 4);
    ctx.lineTo(x + windowWidthPx / 2, y - 4);
    ctx.moveTo(x - windowWidthPx / 2, y + 4);
    ctx.lineTo(x + windowWidthPx / 2, y + 4);
    ctx.stroke();
    
    // Glass effect
    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    ctx.fillRect(x - windowWidthPx / 2, y - 4, windowWidthPx, 8);
  };

  // Draw furniture
  const drawFurniture = (ctx: CanvasRenderingContext2D, furniture: any, isSelected: boolean) => {
    const pos = worldToCanvas(furniture.position);
    const width = furniture.scale.x * scale;
    const depth = furniture.scale.y * scale;
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(-furniture.rotation);
    
    // Draw furniture body
    ctx.fillStyle = isSelected ? 'rgba(201, 169, 98, 0.5)' : furniture.color;
    ctx.strokeStyle = isSelected ? '#c9a962' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = isSelected ? 2 : 1;
    
    ctx.fillRect(-width / 2, -depth / 2, width, depth);
    ctx.strokeRect(-width / 2, -depth / 2, width, depth);
    
    // Draw furniture name
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(furniture.name, 0, 0);
    
    ctx.restore();
  };

  // Draw preview line when drawing
  const drawPreview = (ctx: CanvasRenderingContext2D) => {
    if (!isDrawing || !drawStart || !drawCurrent) return;
    
    const start = worldToCanvas(drawStart);
    const end = worldToCanvas(drawCurrent);
    
    // Draw preview line
    ctx.strokeStyle = '#c9a962';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw distance measurement
    const distance = Math.sqrt(
      Math.pow(drawCurrent.x - drawStart.x, 2) + 
      Math.pow(drawCurrent.y - drawStart.y, 2)
    );
    
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Background
    const text = `${distance.toFixed(2)}m`;
    ctx.font = 'bold 12px Inter, sans-serif';
    const textWidth = ctx.measureText(text).width;
    
    ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
    ctx.fillRect(midX - textWidth / 2 - 6, midY - 22, textWidth + 12, 22);
    
    // Text
    ctx.fillStyle = '#c9a962';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, midX, midY - 11);
    
    // Draw angle indicator
    const angle = calculateAngle(drawStart, drawCurrent);
    const angleText = `${angle.toFixed(0)}°`;
    const angleTextWidth = ctx.measureText(angleText).width;
    
    ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
    ctx.fillRect(start.x - angleTextWidth / 2 - 6, start.y - 28, angleTextWidth + 12, 18);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(angleText, start.x, start.y - 19);
  };

  // Draw snap indicator
  const drawSnapIndicator = (ctx: CanvasRenderingContext2D) => {
    if (!snapIndicator) return;
    
    const point = worldToCanvas(snapIndicator.point);
    
    ctx.strokeStyle = '#c9a962';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(point.x - 12, point.y);
    ctx.lineTo(point.x + 12, point.y);
    ctx.moveTo(point.x, point.y - 12);
    ctx.lineTo(point.x, point.y + 12);
    ctx.stroke();
  };

  // Main render function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    if (!currentProject) return;
    
    // Draw rooms (behind walls)
    currentProject.rooms.forEach(room => {
      drawRoom(ctx, room, selectedElement === room.id && selectedElementType === 'room');
    });
    
    // Draw walls
    currentProject.walls.forEach(wall => {
      drawWall(ctx, wall, selectedElement === wall.id && selectedElementType === 'wall');
    });
    
    // Draw doors
    currentProject.doors.forEach(door => {
      drawDoor(ctx, door, selectedElement === door.id && selectedElementType === 'door');
    });
    
    // Draw windows
    currentProject.windows.forEach(window => {
      drawWindow(ctx, window, selectedElement === window.id && selectedElementType === 'window');
    });
    
    // Draw furniture
    currentProject.furniture.forEach(furniture => {
      drawFurniture(ctx, furniture, selectedElement === furniture.id && selectedElementType === 'furniture');
    });
    
    // Draw preview
    drawPreview(ctx);
    
    // Draw snap indicator
    drawSnapIndicator(ctx);
  }, [currentProject, scale, offset, isDrawing, drawStart, drawCurrent, selectedElement, selectedElementType, snapIndicator, showMeasurements]);

  // Get canvas coordinates from pointer event (works for mouse and touch)
  const getCanvasPoint = (e: React.PointerEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    // Use native offsetX/Y when available (most reliable, already relative to canvas)
    const nativeEvent = e.nativeEvent as PointerEvent;
    if (nativeEvent.offsetX !== undefined && nativeEvent.offsetY !== undefined) {
      return {
        x: nativeEvent.offsetX,
        y: nativeEvent.offsetY,
      };
    }
    
    // Fallback to clientX/Y calculation
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Pointer event handlers (supports mouse and touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Capture pointer to ensure move events work outside canvas
    canvas.setPointerCapture(e.pointerId);
    
    const canvasPoint = getCanvasPoint(e);
    if (!canvasPoint) return;
    
    // Middle mouse or Alt+Click = Pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart(canvasPoint);
      return;
    }
    
    // Left click/touch = Drawing/Selection
    if (e.button === 0) {
      const worldPoint = canvasToWorld(canvasPoint);
      const snappedPoint = getBestSnapPoint(worldPoint);
      
      if (toolMode === 'wall') {
        startDrawing(snappedPoint);
      } else if (toolMode === 'select') {
        selectElement(null);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    
    const canvasPoint = getCanvasPoint(e);
    if (!canvasPoint) return;
    
    setMousePos(canvasPoint);
    
    // Panning
    if (isPanning) {
      const dx = canvasPoint.x - panStart.x;
      const dy = canvasPoint.y - panStart.y;
      setCanvasOffset({ x: offset.x + dx, y: offset.y + dy });
      setPanStart(canvasPoint);
      return;
    }
    
    // Drawing
    if (isDrawing && drawStart) {
      const worldPoint = canvasToWorld(canvasPoint);
      let snappedPoint = getBestSnapPoint(worldPoint);
      
      // Apply angle snap
      snappedPoint = applyAngleSnap(drawStart, snappedPoint);
      
      updateDrawing(snappedPoint);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer may not be captured, ignore error
      }
    }
    
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDrawing) {
      const canvasPoint = getCanvasPoint(e);
      if (!canvasPoint) return;
      
      const worldPoint = canvasToWorld(canvasPoint);
      let snappedPoint = getBestSnapPoint(worldPoint);
      
      // Apply angle snap
      if (drawStart) {
        snappedPoint = applyAngleSnap(drawStart, snappedPoint);
      }
      
      endDrawing(snappedPoint);
      setSnapIndicator(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCanvasScale(scale * delta);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space = Pan mode temporarily
      if (e.code === 'Space' && !e.repeat) {
        // Could implement temporary pan mode
      }
      
      // Shift = Angle lock
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (!angleLock) {
          setAngleLock(true);
          if (isDrawing && drawStart && drawCurrent) {
            const angle = calculateAngle(drawStart, drawCurrent);
            setLockedAngle(snapAngle(angle));
          }
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
  }, [isDrawing, drawStart, drawCurrent, angleLock, calculateAngle, snapAngle]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    
    // Handle orientation change with delay for mobile browsers
    const handleOrientationChange = () => {
      setTimeout(handleResize, 100);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className={`${isPanning ? 'cursor-grabbing' : toolMode === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setIsPanning(false);
          if (isDrawing) endDrawing();
          setSnapIndicator(null);
        }}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      />
      
      {/* Floating Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-[#1a1a1f]/90 backdrop-blur-xl border border-white/10 rounded-xl">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCanvasScale(scale * 1.2)}
            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            title="Zoom In"
          >
            +
          </button>
          <span className="text-xs text-white/50 w-16 text-center">
            {scale.toFixed(0)}%
          </span>
          <button
            onClick={() => setCanvasScale(scale * 0.8)}
            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            title="Zoom Out"
          >
            -
          </button>
        </div>
        
        <div className="w-px h-6 bg-white/10" />
        
        {/* Snap Toggle */}
        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            snapEnabled 
              ? 'bg-[#c9a962]/20 text-[#c9a962]' 
              : 'hover:bg-white/10 text-white/50'
          }`}
          title="Snap to Grid/Points"
        >
          <Magnet size={16} />
        </button>
        
        {/* Measurements Toggle */}
        <button
          onClick={() => setShowMeasurements(!showMeasurements)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            showMeasurements 
              ? 'bg-[#c9a962]/20 text-[#c9a962]' 
              : 'hover:bg-white/10 text-white/50'
          }`}
          title="Show Measurements"
        >
          <Ruler size={16} />
        </button>
        
        <div className="w-px h-6 bg-white/10" />
        
        {/* Reset View */}
        <button
          onClick={() => {
            setCanvasScale(20);
            setCanvasOffset({ x: 0, y: 0 });
          }}
          className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          title="Reset View"
        >
          ⌖
        </button>
      </div>
      
      {/* Info Panel */}
      <div className="absolute bottom-6 left-6 p-3 bg-[#1a1a1f]/90 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="text-xs text-white/50">
          <div>Pos: {mousePos.x.toFixed(0)}, {mousePos.y.toFixed(0)}</div>
          {snapIndicator && (
            <div className="text-[#c9a962]">
              Snap: {snapIndicator.type}
            </div>
          )}
          {angleLock && (
            <div className="text-[#c9a962]">
              Ângulo travado: {lockedAngle?.toFixed(0)}°
            </div>
          )}
        </div>
      </div>
      
      {/* Scale Indicator */}
      <div className="absolute bottom-6 right-6 px-3 py-2 bg-[#1a1a1f]/90 backdrop-blur-xl border border-white/10 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Grid3X3 size={14} />
          <span>{currentProject?.settings.gridSize || 0.5}m grid</span>
          <span className="text-white/30">|</span>
          <span>{currentProject?.settings.unit === 'meters' ? 'Metros' : 'Pés'}</span>
        </div>
      </div>
    </div>
  );
};

export default Canvas2D;
