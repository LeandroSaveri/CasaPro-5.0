// ============================================
// CANVAS 2D ENGINE - CasaPro AI Premium
// ============================================

import type { Point, Wall, Room, Door, Window, Furniture, CanvasState, Bounds } from '@/types';

// EventEmitter simples integrado
type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
}

// ============================================
// TIPOS DO ENGINE
// ============================================

export interface WallSegment {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  length: number;
  angle: number;
}

export interface SnapResult {
  point: Point;
  type: 'grid' | 'endpoint' | 'midpoint' | 'intersection' | 'none';
  target?: string;
}

export interface DrawOptions {
  showGrid?: boolean;
  showAxes?: boolean;
  showMeasurements?: boolean;
  snapToGrid?: boolean;
  snapToAngle?: boolean;
  gridSize?: number;
  snapAngles?: number[];
}

// ============================================
// CANVAS 2D ENGINE
// ============================================

export class Canvas2DEngine extends EventEmitter {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  // Estado
  private state: CanvasState = {
    scale: 1,
    offset: { x: 0, y: 0 },
    rotation: 0,
    isPanning: false,
    isDrawing: false,
    drawStart: null,
    drawCurrent: null,
    snapPoint: null,
    hoveredElement: null,
    selectionBox: null
  };

  // Elementos do projeto
  private walls: Wall[] = [];
  private rooms: Room[] = [];
  private doors: Door[] = [];
  private windows: Window[] = [];
  private furniture: Furniture[] = [];

  // Configurações
  private options: DrawOptions = {
    showGrid: true,
    showAxes: true,
    showMeasurements: true,
    snapToGrid: true,
    snapToAngle: true,
    gridSize: 50,
    snapAngles: [0, 45, 90, 135, 180, 225, 270, 315]
  };

  // Histórico para undo/redo
  private history: any[] = [];
  private historyIndex: number = -1;

  constructor() {
    super();
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = context;
    
    this.setupEventListeners();
    this.emit('initialized', { canvas, engine: this });
  }

  destroy(): void {
    this.removeEventListeners();
    this.canvas = null;
    this.ctx = null;
    this.emit('destroyed');
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  private setupEventListeners(): void {
    if (!this.canvas) return;
    
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleWheel);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  private removeEventListeners(): void {
    if (!this.canvas) return;
    
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }

  // ============================================
  // HANDLERS DE EVENTOS
  // ============================================

  private handleMouseDown = (e: MouseEvent): void => {
    const point = this.screenToWorld(e.offsetX, e.offsetY);
    
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Pan com middle click ou Alt+click
      this.state.isPanning = true;
      this.state.drawStart = point;
    } else if (e.button === 0) {
      // Click esquerdo - iniciar desenho
      this.state.isDrawing = true;
      const snappedPoint = this.snapPoint(point);
      this.state.drawStart = snappedPoint;
      this.state.drawCurrent = snappedPoint;
      
      this.emit('drawStart', { point: snappedPoint, originalEvent: e });
    }
    
    this.emit('mouseDown', { point, button: e.button, originalEvent: e });
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const point = this.screenToWorld(e.offsetX, e.offsetY);
    
    if (this.state.isPanning && this.state.drawStart) {
      // Panning
      const dx = point.x - this.state.drawStart.x;
      const dy = point.y - this.state.drawStart.y;
      this.pan(dx * this.state.scale, dy * this.state.scale);
      this.state.drawStart = point;
    } else if (this.state.isDrawing) {
      // Desenhando
      this.state.drawCurrent = this.snapPoint(point);
      this.emit('drawMove', { 
        start: this.state.drawStart, 
        current: this.state.drawCurrent,
        originalEvent: e 
      });
    } else {
      // Hover
      this.checkHover(point);
    }
    
    this.emit('mouseMove', { point, originalEvent: e });
  };

  private handleMouseUp = (e: MouseEvent): void => {
    const point = this.screenToWorld(e.offsetX, e.offsetY);
    
    if (this.state.isDrawing && this.state.drawStart) {
      const endPoint = this.snapPoint(point);
      this.emit('drawEnd', { 
        start: this.state.drawStart, 
        end: endPoint,
        originalEvent: e 
      });
    }
    
    this.state.isPanning = false;
    this.state.isDrawing = false;
    this.state.drawStart = null;
    this.state.drawCurrent = null;
    
    this.emit('mouseUp', { point, button: e.button, originalEvent: e });
  };

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const point = this.screenToWorld(e.offsetX, e.offsetY);
    this.zoomAt(point, zoomFactor);
    this.emit('wheel', { deltaY: e.deltaY, point, originalEvent: e });
  };

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    const point = this.screenToWorld(e.offsetX, e.offsetY);
    this.emit('contextMenu', { point, originalEvent: e });
  };

  // ============================================
  // CONVERSÃO DE COORDENADAS
  // ============================================

  screenToWorld(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.state.offset.x) / this.state.scale,
      y: (screenY - this.state.offset.y) / this.state.scale
    };
  }

  worldToScreen(worldX: number, worldY: number): Point {
    return {
      x: worldX * this.state.scale + this.state.offset.x,
      y: worldY * this.state.scale + this.state.offset.y
    };
  }

  // ============================================
  // SNAP E GRID
  // ============================================

  snapPoint(point: Point): Point {
    let snapped = { ...point };
    
    if (this.options.snapToGrid) {
      const gridSize = this.options.gridSize || 50;
      snapped.x = Math.round(snapped.x / gridSize) * gridSize;
      snapped.y = Math.round(snapped.y / gridSize) * gridSize;
    }
    
    // Snap para endpoints de paredes existentes
    const endpointSnap = this.snapToEndpoints(point);
    if (endpointSnap.type !== 'none') {
      snapped = endpointSnap.point;
    }
    
    return snapped;
  }

  private snapToEndpoints(point: Point): SnapResult {
    const threshold = 10 / this.state.scale;
    
    for (const wall of this.walls) {
      const distStart = this.distance(point, wall.start);
      const distEnd = this.distance(point, wall.end);
      
      if (distStart < threshold) {
        return { point: wall.start, type: 'endpoint', target: wall.id };
      }
      if (distEnd < threshold) {
        return { point: wall.end, type: 'endpoint', target: wall.id };
      }
    }
    
    return { point, type: 'none' };
  }

  private distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  // ============================================
  // CONTROLES DE CÂMERA
  // ============================================

  zoom(factor: number): void {
    this.state.scale *= factor;
    this.clampZoom();
    this.emit('zoomChanged', { scale: this.state.scale });
  }

  zoomAt(point: Point, factor: number): void {
    const oldScale = this.state.scale;
    this.state.scale *= factor;
    this.clampZoom();
    
    // Ajustar offset para zoomar no ponto do mouse
    const scaleChange = this.state.scale / oldScale;
    this.state.offset.x = point.x * this.state.scale - (point.x * oldScale - this.state.offset.x) * scaleChange;
    this.state.offset.y = point.y * this.state.scale - (point.y * oldScale - this.state.offset.y) * scaleChange;
    
    this.emit('zoomChanged', { scale: this.state.scale, center: point });
  }

  private clampZoom(): void {
    this.state.scale = Math.max(0.1, Math.min(10, this.state.scale));
  }

  pan(dx: number, dy: number): void {
    this.state.offset.x += dx;
    this.state.offset.y += dy;
    this.emit('panChanged', { offset: this.state.offset });
  }

  resetView(): void {
    this.state.scale = 1;
    this.state.offset = { x: 0, y: 0 };
    this.state.rotation = 0;
    this.emit('viewReset');
  }

  fitToScreen(bounds: Bounds): void {
    if (!this.canvas) return;
    
    const padding = 50;
    const availableWidth = this.canvas.width - padding * 2;
    const availableHeight = this.canvas.height - padding * 2;
    
    const contentWidth = bounds.max.x - bounds.min.x;
    const contentHeight = bounds.max.y - bounds.min.y;
    
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    
    this.state.scale = Math.min(scaleX, scaleY);
    this.clampZoom();
    
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerY = (bounds.min.y + bounds.max.y) / 2;
    
    this.state.offset.x = this.canvas.width / 2 - centerX * this.state.scale;
    this.state.offset.y = this.canvas.height / 2 - centerY * this.state.scale;
    
    this.emit('viewFitted', { bounds, scale: this.state.scale });
  }

  // ============================================
  // GESTÃO DE ELEMENTOS
  // ============================================

  addWall(wall: Wall): void {
    this.walls.push(wall);
    this.saveState();
    this.emit('wallAdded', { wall });
  }

  updateWall(id: string, updates: Partial<Wall>): void {
    const index = this.walls.findIndex(w => w.id === id);
    if (index !== -1) {
      this.walls[index] = { ...this.walls[index], ...updates };
      this.saveState();
      this.emit('wallUpdated', { wall: this.walls[index] });
    }
  }

  removeWall(id: string): void {
    const index = this.walls.findIndex(w => w.id === id);
    if (index !== -1) {
      const wall = this.walls[index];
      this.walls.splice(index, 1);
      this.saveState();
      this.emit('wallRemoved', { wall });
    }
  }

  addRoom(room: Room): void {
    this.rooms.push(room);
    this.saveState();
    this.emit('roomAdded', { room });
  }

  updateRoom(id: string, updates: Partial<Room>): void {
    const index = this.rooms.findIndex(r => r.id === id);
    if (index !== -1) {
      this.rooms[index] = { ...this.rooms[index], ...updates };
      this.saveState();
      this.emit('roomUpdated', { room: this.rooms[index] });
    }
  }

  removeRoom(id: string): void {
    const index = this.rooms.findIndex(r => r.id === id);
    if (index !== -1) {
      const room = this.rooms[index];
      this.rooms.splice(index, 1);
      this.saveState();
      this.emit('roomRemoved', { room });
    }
  }

  addDoor(door: Door): void {
    this.doors.push(door);
    this.saveState();
    this.emit('doorAdded', { door });
  }

  addWindow(window: Window): void {
    this.windows.push(window);
    this.saveState();
    this.emit('windowAdded', { window });
  }

  addFurniture(furniture: Furniture): void {
    this.furniture.push(furniture);
    this.saveState();
    this.emit('furnitureAdded', { furniture });
  }

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  render(): void {
    if (!this.ctx || !this.canvas) return;
    
    // Limpar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Salvar contexto
    this.ctx.save();
    
    // Aplicar transformações
    this.ctx.translate(this.state.offset.x, this.state.offset.y);
    this.ctx.scale(this.state.scale, this.state.scale);
    
    // Desenhar elementos
    if (this.options.showGrid) this.drawGrid();
    if (this.options.showAxes) this.drawAxes();
    
    this.drawRooms();
    this.drawWalls();
    this.drawDoors();
    this.drawWindows();
    this.drawFurniture();
    
    // Desenhar preview de desenho
    if (this.state.isDrawing && this.state.drawStart && this.state.drawCurrent) {
      this.drawWallPreview(this.state.drawStart, this.state.drawCurrent);
    }
    
    // Desenhar snap point
    if (this.state.snapPoint) {
      this.drawSnapIndicator(this.state.snapPoint);
    }
    
    // Restaurar contexto
    this.ctx.restore();
  }

  private drawGrid(): void {
    if (!this.ctx) return;
    
    const gridSize = this.options.gridSize || 50;
    const bounds = this.getVisibleBounds();
    
    this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    this.ctx.lineWidth = 1 / this.state.scale;
    
    const startX = Math.floor(bounds.min.x / gridSize) * gridSize;
    const startY = Math.floor(bounds.min.y / gridSize) * gridSize;
    const endX = Math.ceil(bounds.max.x / gridSize) * gridSize;
    const endY = Math.ceil(bounds.max.y / gridSize) * gridSize;
    
    this.ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.moveTo(x, bounds.min.y);
      this.ctx.lineTo(x, bounds.max.y);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.moveTo(bounds.min.x, y);
      this.ctx.lineTo(bounds.max.x, y);
    }
    this.ctx.stroke();
  }

  private drawAxes(): void {
    if (!this.ctx) return;
    
    this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    this.ctx.lineWidth = 2 / this.state.scale;
    
    // Eixo X
    this.ctx.beginPath();
    this.ctx.moveTo(-1000, 0);
    this.ctx.lineTo(1000, 0);
    this.ctx.stroke();
    
    // Eixo Y
    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -1000);
    this.ctx.lineTo(0, 1000);
    this.ctx.stroke();
  }

  private drawWalls(): void {
    if (!this.ctx) return;
    
    for (const wall of this.walls) {
      this.ctx.strokeStyle = wall.color || '#333';
      this.ctx.lineWidth = wall.thickness || 10;
      this.ctx.lineCap = 'round';
      
      this.ctx.beginPath();
      this.ctx.moveTo(wall.start.x, wall.start.y);
      this.ctx.lineTo(wall.end.x, wall.end.y);
      this.ctx.stroke();
      
      // Desenhar endpoints
      this.ctx.fillStyle = '#666';
      this.ctx.beginPath();
      this.ctx.arc(wall.start.x, wall.start.y, 3 / this.state.scale, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(wall.end.x, wall.end.y, 3 / this.state.scale, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawRooms(): void {
    if (!this.ctx) return;
    
    for (const room of this.rooms) {
      if (room.points.length < 3) continue;
      
      this.ctx.fillStyle = room.color || 'rgba(200, 200, 200, 0.3)';
      this.ctx.strokeStyle = room.color || '#666';
      this.ctx.lineWidth = 2 / this.state.scale;
      
      this.ctx.beginPath();
      this.ctx.moveTo(room.points[0].x, room.points[0].y);
      for (let i = 1; i < room.points.length; i++) {
        this.ctx.lineTo(room.points[i].x, room.points[i].y);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }
  }

  private drawDoors(): void {
    if (!this.ctx) return;
    
    for (const door of this.doors) {
      // Encontrar a parede
      const wall = this.walls.find(w => w.id === door.wallId);
      if (!wall) continue;
      
      // Calcular posição
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      const posX = wall.start.x + (dx * door.position);
      const posY = wall.start.y + (dy * door.position);
      
      // Desenhar porta
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(
        posX - door.width / 2,
        posY - 2,
        door.width,
        4
      );
    }
  }

  private drawWindows(): void {
    if (!this.ctx) return;
    
    for (const window of this.windows) {
      const wall = this.walls.find(w => w.id === window.wallId);
      if (!wall) continue;
      
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      
      const posX = wall.start.x + (dx * window.position);
      const posY = wall.start.y + (dy * window.position);
      
      this.ctx.fillStyle = '#87CEEB';
      this.ctx.fillRect(
        posX - window.width / 2,
        posY - 2,
        window.width,
        4
      );
    }
  }

  private drawFurniture(): void {
    if (!this.ctx) return;
    
    for (const item of this.furniture) {
      if (!item.visible) continue;
      
      this.ctx.save();
      this.ctx.translate(item.position.x, item.position.y);
      this.ctx.rotate(item.rotation);
      
      this.ctx.fillStyle = item.color || '#888';
      this.ctx.fillRect(
        -item.width / 2,
        -item.depth / 2,
        item.width,
        item.depth
      );
      
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 1 / this.state.scale;
      this.ctx.strokeRect(
        -item.width / 2,
        -item.depth / 2,
        item.width,
        item.depth
      );
      
      this.ctx.restore();
    }
  }

  private drawWallPreview(start: Point, end: Point): void {
    if (!this.ctx) return;
    
    this.ctx.strokeStyle = 'rgba(51, 153, 255, 0.7)';
    this.ctx.lineWidth = 10;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
    
    // Mostrar distância
    const distance = this.distance(start, end);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    this.ctx.fillStyle = '#333';
    this.ctx.font = `${14 / this.state.scale}px Arial`;
    this.ctx.fillText(`${distance.toFixed(2)}m`, midX, midY - 10);
  }

  private drawSnapIndicator(point: Point): void {
    if (!this.ctx) return;
    
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2 / this.state.scale;
    
    const size = 8 / this.state.scale;
    
    this.ctx.beginPath();
    this.ctx.moveTo(point.x - size, point.y);
    this.ctx.lineTo(point.x + size, point.y);
    this.ctx.moveTo(point.x, point.y - size);
    this.ctx.lineTo(point.x, point.y + size);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private getVisibleBounds(): Bounds {
    if (!this.canvas) {
      return { min: { x: -1000, y: -1000 }, max: { x: 1000, y: 1000 } };
    }
    
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height);
    
    return {
      min: topLeft,
      max: bottomRight
    };
  }

  private checkHover(point: Point): void {
    // Verificar se está sobre algum elemento
    let hoveredId: string | null = null;
    
    for (const wall of this.walls) {
      if (this.isPointNearWall(point, wall)) {
        hoveredId = wall.id;
        break;
      }
    }
    
    if (hoveredId !== this.state.hoveredElement) {
      this.state.hoveredElement = hoveredId;
      this.emit('hoverChanged', { elementId: hoveredId });
    }
  }

  private isPointNearWall(point: Point, wall: Wall): boolean {
    const threshold = 10 / this.state.scale;
    
    // Distância ponto-linha
    const A = point.x - wall.start.x;
    const B = point.y - wall.start.y;
    const C = wall.end.x - wall.start.x;
    const D = wall.end.y - wall.start.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = wall.start.x;
      yy = wall.start.y;
    } else if (param > 1) {
      xx = wall.end.x;
      yy = wall.end.y;
    } else {
      xx = wall.start.x + param * C;
      yy = wall.start.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  // ============================================
  // HISTÓRICO (UNDO/REDO)
  // ============================================

  private saveState(): void {
    const state = {
      walls: [...this.walls],
      rooms: [...this.rooms],
      doors: [...this.doors],
      windows: [...this.windows],
      furniture: [...this.furniture]
    };
    
    // Remover estados futros se estiver no meio do histórico
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    this.history.push(state);
    this.historyIndex++;
    
    // Limitar histórico
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
    
    this.emit('stateChanged', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  undo(): void {
    if (this.canUndo()) {
      this.historyIndex--;
      this.restoreState(this.history[this.historyIndex]);
      this.emit('undo');
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.historyIndex++;
      this.restoreState(this.history[this.historyIndex]);
      this.emit('redo');
    }
  }

  private restoreState(state: any): void {
    this.walls = [...state.walls];
    this.rooms = [...state.rooms];
    this.doors = [...state.doors];
    this.windows = [...state.windows];
    this.furniture = [...state.furniture];
    this.emit('stateChanged', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // ============================================
  // GETTERS
  // ============================================

  getWalls(): Wall[] {
    return [...this.walls];
  }

  getRooms(): Room[] {
    return [...this.rooms];
  }

  getDoors(): Door[] {
    return [...this.doors];
  }

  getWindows(): Window[] {
    return [...this.windows];
  }

  getFurniture(): Furniture[] {
    return [...this.furniture];
  }

  getState(): CanvasState {
    return { ...this.state };
  }

  getScale(): number {
    return this.state.scale;
  }

  getOffset(): Point {
    return { ...this.state.offset };
  }

  // ============================================
  // SETTERS
  // ============================================

  setOptions(options: Partial<DrawOptions>): void {
    this.options = { ...this.options, ...options };
    this.emit('optionsChanged', { options: this.options });
  }

  loadProject(walls: Wall[], rooms: Room[], doors: Door[], windows: Window[], furniture: Furniture[]): void {
    this.walls = [...walls];
    this.rooms = [...rooms];
    this.doors = [...doors];
    this.windows = [...windows];
    this.furniture = [...furniture];
    this.saveState();
    this.emit('projectLoaded', { walls, rooms, doors, windows, furniture });
  }

  clear(): void {
    this.walls = [];
    this.rooms = [];
    this.doors = [];
    this.windows = [];
    this.furniture = [];
    this.history = [];
    this.historyIndex = -1;
    this.resetView();
    this.emit('cleared');
  }
}

export default Canvas2DEngine;
