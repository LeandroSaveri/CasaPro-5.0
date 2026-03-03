// ============================================
// Canvas2DEngine.ts - Motor 2D Profissional
// Sincronização bidirecional com 3D
// ============================================

import type { 
  Vector2D, 
  Wall2D, 
  Room2D, 
  Point2D,
  WallNode,
  Dimensions 
} from '@/types/architectural';
import { EventEmitter } from '@/utils/EventEmitter';

export interface Canvas2DState {
  walls: Wall2D[];
  rooms: Room2D[];
  nodes: Map<string, WallNode>;
  selectedId: string | null;
  hoveredId: string | null;
  scale: number;
  offset: Vector2D;
  isDrawing: boolean;
  currentWall: Wall2D | null;
}

export interface ViewportState {
  scale: number;
  offset: Vector2D;
  width: number;
  height: number;
}

export class Canvas2DEngine extends EventEmitter {
  private state: Canvas2DState;
  private viewport: ViewportState;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  
  // Configurações profissionais
  private readonly GRID_SIZE = 50;
  private readonly SNAP_THRESHOLD = 10;
  private readonly MIN_SCALE = 0.1;
  private readonly MAX_SCALE = 5;

  constructor() {
    super();
    this.state = {
      walls: [],
      rooms: [],
      nodes: new Map(),
      selectedId: null,
      hoveredId: null,
      scale: 1,
      offset: { x: 0, y: 0 },
      isDrawing: false,
      currentWall: null
    };
    
    this.viewport = {
      scale: 1,
      offset: { x: 0, y: 0 },
      width: 0,
      height: 0
    };
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    
    this.updateViewport();
    this.startRenderLoop();
    this.emit('initialized');
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.canvas = null;
    this.ctx = null;
    this.emit('destroyed');
  }

  // ============================================
  // VIEWPORT & COORDENADAS
  // ============================================

  private updateViewport(): void {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Ajuste para tela retina
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
    
    this.viewport.width = rect.width;
    this.viewport.height = rect.height;
  }

  // Converte coordenadas do mouse para coordenadas do mundo
  screenToWorld(screenPoint: Point2D): Point2D {
    return {
      x: (screenPoint.x - this.viewport.offset.x) / this.viewport.scale,
      y: (screenPoint.y - this.viewport.offset.y) / this.viewport.scale
    };
  }

  // Converte coordenadas do mundo para tela
  worldToScreen(worldPoint: Point2D): Point2D {
    return {
      x: worldPoint.x * this.viewport.scale + this.viewport.offset.x,
      y: worldPoint.y * this.viewport.scale + this.viewport.offset.y
    };
  }

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================

  private startRenderLoop(): void {
    const render = () => {
      this.render();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;

    const { width, height } = this.viewport;
    
    // Limpa canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Salva estado
    this.ctx.save();
    
    // Aplica transformações de viewport
    this.ctx.translate(this.viewport.offset.x, this.viewport.offset.y);
    this.ctx.scale(this.viewport.scale, this.viewport.scale);
    
    // Renderiza camadas em ordem
    this.renderGrid();
    this.renderRooms();
    this.renderWalls();
    this.renderNodes();
    this.renderCurrentWall();
    this.renderSelection();
    
    // Restaura estado
    this.ctx.restore();
  }

  private renderGrid(): void {
    if (!this.ctx) return;
    
    const { width, height } = this.viewport;
    const gridSize = this.GRID_SIZE;
    
    // Calcula bounds visíveis
    const startX = Math.floor(-this.viewport.offset.x / this.viewport.scale / gridSize) * gridSize;
    const startY = Math.floor(-this.viewport.offset.y / this.viewport.scale / gridSize) * gridSize;
    const endX = startX + (width / this.viewport.scale) + gridSize;
    const endY = startY + (height / this.viewport.scale) + gridSize;
    
    this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    this.ctx.lineWidth = 1 / this.viewport.scale;
    
    this.ctx.beginPath();
    
    // Linhas verticais
    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
    }
    
    // Linhas horizontais
    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
    }
    
    this.ctx.stroke();
    
    // Eixos principais
    this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    this.ctx.lineWidth = 2 / this.viewport.scale;
    this.ctx.beginPath();
    this.ctx.moveTo(0, startY);
    this.ctx.lineTo(0, endY);
    this.ctx.moveTo(startX, 0);
    this.ctx.lineTo(endX, 0);
    this.ctx.stroke();
  }

  private renderWalls(): void {
    if (!this.ctx) return;
    
    this.state.walls.forEach(wall => {
      this.renderWall(wall, wall.id === this.state.selectedId);
    });
  }

  private renderWall(wall: Wall2D, isSelected: boolean): void {
    if (!this.ctx) return;
    
    const start = this.getNodePosition(wall.startNodeId);
    const end = this.getNodePosition(wall.endNodeId);
    
    if (!start || !end) return;
    
    // Configurações visuais profissionais
    const wallWidth = wall.thickness || 10;
    const isHovered = wall.id === this.state.hoveredId;
    
    // Sombra para profundidade
    if (isSelected || isHovered) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      this.ctx.shadowBlur = 8;
      this.ctx.shadowOffsetX = 2;
      this.ctx.shadowOffsetY = 2;
    }
    
    // Cor baseada no estado
    if (isSelected) {
      this.ctx.fillStyle = '#3B82F6'; // Azul selecionado
      this.ctx.strokeStyle = '#1D4ED8';
    } else if (isHovered) {
      this.ctx.fillStyle = '#60A5FA'; // Azul claro hover
      this.ctx.strokeStyle = '#3B82F6';
    } else {
      this.ctx.fillStyle = '#374151'; // Cinza padrão
      this.ctx.strokeStyle = '#1F2937';
    }
    
    this.ctx.lineWidth = 1;
    
    // Desenha parede como retângulo com espessura
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const perpX = Math.sin(angle) * wallWidth / 2;
    const perpY = -Math.cos(angle) * wallWidth / 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(start.x + perpX, start.y + perpY);
    this.ctx.lineTo(end.x + perpX, end.y + perpY);
    this.ctx.lineTo(end.x - perpX, end.y - perpY);
    this.ctx.lineTo(start.x - perpX, start.y - perpY);
    this.ctx.closePath();
    
    this.ctx.fill();
    this.ctx.stroke();
    
    // Reseta sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Indicador de direção (seta sutil)
    if (isSelected) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      this.renderDirectionIndicator(midX, midY, angle);
    }
  }

  private renderDirectionIndicator(x: number, y: number, angle: number): void {
    if (!this.ctx) return;
    
    const arrowSize = 15;
    this.ctx.fillStyle = '#FFFFFF';
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    
    this.ctx.beginPath();
    this.ctx.moveTo(arrowSize, 0);
    this.ctx.lineTo(-arrowSize / 2, -arrowSize / 3);
    this.ctx.lineTo(-arrowSize / 2, arrowSize / 3);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
  }

  private renderRooms(): void {
    if (!this.ctx) return;
    
    this.state.rooms.forEach(room => {
      this.renderRoom(room);
    });
  }

  private renderRoom(room: Room2D): void {
    if (!this.ctx || room.points.length < 3) return;
    
    this.ctx.fillStyle = room.color || 'rgba(59, 130, 246, 0.1)';
    this.ctx.strokeStyle = room.borderColor || '#3B82F6';
    this.ctx.lineWidth = 2 / this.viewport.scale;
    
    this.ctx.beginPath();
    this.ctx.moveTo(room.points[0].x, room.points[0].y);
    
    for (let i = 1; i < room.points.length; i++) {
      this.ctx.lineTo(room.points[i].x, room.points[i].y);
    }
    
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Label do cômodo
    if (room.name) {
      const centroid = this.calculateCentroid(room.points);
      this.ctx.fillStyle = '#1F2937';
      this.ctx.font = `${12 / this.viewport.scale}px Inter, system-ui, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(room.name, centroid.x, centroid.y);
    }
  }

  private renderNodes(): void {
    if (!this.ctx) return;
    
    this.state.nodes.forEach((node, id) => {
      const isSelected = id === this.state.selectedId;
      const isHovered = id === this.state.hoveredId;
      
      this.renderNode(node.position, isSelected, isHovered);
    });
  }

  private renderNode(position: Point2D, isSelected: boolean, isHovered: boolean): void {
    if (!this.ctx) return;
    
    const radius = isSelected ? 8 : isHovered ? 6 : 4;
    
    // Círculo externo (branco)
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = isSelected ? '#3B82F6' : '#6B7280';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Círculo interno (preenchimento)
    this.ctx.fillStyle = isSelected ? '#3B82F6' : '#9CA3AF';
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, radius * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderCurrentWall(): void {
    if (!this.ctx || !this.state.currentWall) return;
    
    const wall = this.state.currentWall;
    const start = this.getNodePosition(wall.startNodeId);
    
    if (!start || !wall.endPoint) return;
    
    // Parede em construção (estilo tracejado animado)
    this.ctx.strokeStyle = '#3B82F6';
    this.ctx.lineWidth = 2 / this.viewport.scale;
    this.ctx.setLineDash([10 / this.viewport.scale, 5 / this.viewport.scale]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(wall.endPoint.x, wall.endPoint.y);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
    
    // Preview do nó final
    this.renderNode(wall.endPoint, false, true);
  }

  private renderSelection(): void {
    // Caixa de seleção, handles de resize, etc.
    // Implementação futura para edição avançada
  }

  // ============================================
  // MANIPULAÇÃO DE NÓS
  // ============================================

  private getNodePosition(nodeId: string): Point2D | null {
    const node = this.state.nodes.get(nodeId);
    return node ? node.position : null;
  }

  createNode(position: Point2D): string {
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const node: WallNode = {
      id,
      position: { ...position },
      connectedWalls: []
    };
    
    this.state.nodes.set(id, node);
    this.emit('nodeCreated', { node });
    
    return id;
  }

  updateNodePosition(nodeId: string, position: Point2D): void {
    const node = this.state.nodes.get(nodeId);
    if (!node) return;
    
    node.position = { ...position };
    
    // Atualiza todas as paredes conectadas
    node.connectedWalls.forEach(wallId => {
      this.emit('wallUpdated', { wallId });
    });
    
    this.emit('nodeUpdated', { nodeId, position });
  }

  // ============================================
  // MANIPULAÇÃO DE PAREDES
  // ============================================

  startWall(startPoint: Point2D): string {
    const nodeId = this.createNode(startPoint);
    
    const wallId = `wall_${Date.now()}`;
    const wall: Wall2D = {
      id: wallId,
      startNodeId: nodeId,
      endNodeId: '', // Será definido ao finalizar
      thickness: 10,
      height: 280, // 2.8m padrão
      material: 'concrete'
    };
    
    this.state.currentWall = {
      ...wall,
      endPoint: startPoint // Preview inicial
    };
    
    this.state.isDrawing = true;
    this.emit('wallStarted', { wallId, startNodeId: nodeId });
    
    return wallId;
  }

  updateWallEnd(point: Point2D): void {
    if (!this.state.currentWall) return;
    this.state.currentWall.endPoint = { ...point };
  }

  finishWall(endPoint: Point2D): Wall2D | null {
    if (!this.state.currentWall) return null;
    
    // Evita paredes muito pequenas
    const start = this.getNodePosition(this.state.currentWall.startNodeId);
    if (!start) {
      this.cancelWall();
      return null;
    }
    
    const dx = endPoint.x - start.x;
    const dy = endPoint.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < this.SNAP_THRESHOLD) {
      this.cancelWall();
      return null;
    }
    
    // Cria nó final
    const endNodeId = this.createNode(endPoint);
    
    // Finaliza parede
    const wall: Wall2D = {
      ...this.state.currentWall,
      endNodeId
    };
    
    // Remove endPoint temporário
    delete (wall as any).endPoint;
    
    this.state.walls.push(wall);
    
    // Atualiza conexões dos nós
    const startNode = this.state.nodes.get(wall.startNodeId);
    const endNode = this.state.nodes.get(endNodeId);
    
    if (startNode) startNode.connectedWalls.push(wall.id);
    if (endNode) endNode.connectedWalls.push(wall.id);
    
    // Limpa estado de desenho
    this.state.currentWall = null;
    this.state.isDrawing = false;
    
    this.emit('wallFinished', { wall });
    this.emit('stateChanged', this.getState());
    
    return wall;
  }

  cancelWall(): void {
    if (this.state.currentWall) {
      // Remove nó inicial órfão
      this.state.nodes.delete(this.state.currentWall.startNodeId);
    }
    
    this.state.currentWall = null;
    this.state.isDrawing = false;
    this.emit('wallCancelled');
  }

  // ============================================
  // NAVEGAÇÃO E ZOOM
  // ============================================

  pan(deltaX: number, deltaY: number): void {
    this.viewport.offset.x += deltaX;
    this.viewport.offset.y += deltaY;
    this.emit('viewportChanged', { ...this.viewport });
  }

  zoom(factor: number, center?: Point2D): void {
    const oldScale = this.viewport.scale;
    let newScale = oldScale * factor;
    
    // Clamp zoom
    newScale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, newScale));
    
    if (center) {
      // Zoom centrado no ponto
      const worldCenter = this.screenToWorld(center);
      this.viewport.offset.x = center.x - worldCenter.x * newScale;
      this.viewport.offset.y = center.y - worldCenter.y * newScale;
    }
    
    this.viewport.scale = newScale;
    this.emit('viewportChanged', { ...this.viewport });
  }

  fitToScreen(bounds?: { min: Point2D; max: Point2D }): void {
    if (!this.canvas) return;
    
    if (!bounds && this.state.walls.length === 0) {
      // Reset para origem
      this.viewport.scale = 1;
      this.viewport.offset = {
        x: this.viewport.width / 2,
        y: this.viewport.height / 2
      };
      return;
    }
    
    // Calcula bounds de todas as paredes
    const allPoints: Point2D[] = [];
    this.state.walls.forEach(wall => {
      const start = this.getNodePosition(wall.startNodeId);
      const end = this.getNodePosition(wall.endNodeId);
      if (start) allPoints.push(start);
      if (end) allPoints.push(end);
    });
    
    if (allPoints.length === 0) return;
    
    const minX = Math.min(...allPoints.map(p => p.x));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxY = Math.max(...allPoints.map(p => p.y));
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    const padding = 50;
    const availableWidth = this.viewport.width - padding * 2;
    const availableHeight = this.viewport.height - padding * 2;
    
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    
    this.viewport.scale = Math.min(scaleX, scaleY, 1);
    this.viewport.offset = {
      x: (this.viewport.width - contentWidth * this.viewport.scale) / 2 - minX * this.viewport.scale,
      y: (this.viewport.height - contentHeight * this.viewport.scale) / 2 - minY * this.viewport.scale
    };
    
    this.emit('viewportChanged', { ...this.viewport });
  }

  // ============================================
  // SINCRONIZAÇÃO COM 3D
  // ============================================

  getWallsFor3D(): Array<{
    id: string;
    start: Point2D;
    end: Point2D;
    height: number;
    thickness: number;
  }> {
    return this.state.walls.map(wall => {
      const start = this.getNodePosition(wall.startNodeId);
      const end = this.getNodePosition(wall.endNodeId);
      
      return {
        id: wall.id,
        start: start || { x: 0, y: 0 },
        end: end || { x: 0, y: 0 },
        height: wall.height,
        thickness: wall.thickness
      };
    }).filter(w => w.start && w.end);
  }

  getRoomsFor3D(): Array<{
    id: string;
    points: Point2D[];
    height: number;
    floorMaterial?: string;
  }> {
    return this.state.rooms.map(room => ({
      id: room.id,
      points: room.points,
      height: room.height || 280,
      floorMaterial: room.floorMaterial
    }));
  }

  // ============================================
  // UTILITÁRIOS
  // ============================================

  private calculateCentroid(points: Point2D[]): Point2D {
    let x = 0, y = 0;
    points.forEach(p => {
      x += p.x;
      y += p.y;
    });
    return {
      x: x / points.length,
      y: y / points.length
    };
  }

  getState(): Canvas2DState {
    return { ...this.state };
  }

  getViewport(): ViewportState {
    return { ...this.viewport };
  }

  // ============================================
  // PERSISTÊNCIA
  // ============================================

  serialize(): object {
    return {
      walls: this.state.walls,
      rooms: this.state.rooms,
      nodes: Array.from(this.state.nodes.entries()),
      viewport: this.viewport
    };
  }

  deserialize(data: any): void {
    if (data.walls) this.state.walls = data.walls;
    if (data.rooms) this.state.rooms = data.rooms;
    if (data.nodes) {
      this.state.nodes = new Map(data.nodes);
    }
    if (data.viewport) {
      this.viewport = { ...this.viewport, ...data.viewport };
    }
    this.emit('stateChanged', this.getState());
  }
}

export default Canvas2DEngine;
