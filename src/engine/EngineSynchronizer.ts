// ============================================
// EngineSynchronizer.ts - Sincronização 2D↔3D
// Bidirecional, em tempo real
// ============================================

import type { Canvas2DEngine } from './Canvas2DEngine';
import type { Canvas3DEngine } from './Canvas3DEngine';
import type { Point2D } from '@/types/architectural';
import { EventEmitter } from '@/utils/EventEmitter';

export interface SyncState {
  is2DActive: boolean;
  is3DActive: boolean;
  lastSyncTime: number;
  syncEnabled: boolean;
}

export class EngineSynchronizer extends EventEmitter {
  private engine2D: Canvas2DEngine | null = null;
  private engine3D: Canvas3DEngine | null = null;
  private state: SyncState;
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL_MS = 100; // 10fps para sincronização

  constructor() {
    super();
    this.state = {
      is2DActive: false,
      is3DActive: false,
      lastSyncTime: 0,
      syncEnabled: true
    };
  }

  // ============================================
  // REGISTRO DE ENGINES
  // ============================================

  register2DEngine(engine: Canvas2DEngine): void {
    this.engine2D = engine;
    this.state.is2DActive = true;
    
    // Escuta mudanças no 2D
    engine.on('wallFinished', () => this.sync2DTo3D());
    engine.on('wallUpdated', () => this.sync2DTo3D());
    engine.on('nodeUpdated', () => this.sync2DTo3D());
    engine.on('stateChanged', () => this.sync2DTo3D());
    
    this.emit('engine2DRegistered');
    
    // Sincronização inicial
    this.sync2DTo3D();
  }

  register3DEngine(engine: Canvas3DEngine): void {
    this.engine3D = engine;
    this.state.is3DActive = true;
    
    // Escuta mudanças no 3D (para futura sincronização reversa)
    engine.on('wallBuilt', () => this.emit('3DModified'));
    
    this.emit('engine3DRegistered');
  }

  unregister2DEngine(): void {
    if (this.engine2D) {
      this.engine2D.off('wallFinished');
      this.engine2D.off('wallUpdated');
      this.engine2D.off('nodeUpdated');
      this.engine2D.off('stateChanged');
    }
    this.engine2D = null;
    this.state.is2DActive = false;
    this.emit('engine2DUnregistered');
  }

  unregister3DEngine(): void {
    this.engine3D = null;
    this.state.is3DActive = false;
    this.emit('engine3DUnregistered');
  }

  // ============================================
  // SINCRONIZAÇÃO PRINCIPAL
  // ============================================

  enableSync(): void {
    this.state.syncEnabled = true;
    this.startAutoSync();
    this.emit('syncEnabled');
  }

  disableSync(): void {
    this.state.syncEnabled = false;
    this.stopAutoSync();
    this.emit('syncDisabled');
  }

  private startAutoSync(): void {
    if (this.syncInterval) return;
    
    this.syncInterval = window.setInterval(() => {
      if (this.state.syncEnabled) {
        this.sync2DTo3D();
      }
    }, this.SYNC_INTERVAL_MS);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sincroniza do 2D para o 3D
   * Esta é a direção principal de sincronização
   */
  sync2DTo3D(): void {
    if (!this.engine2D || !this.engine3D) {
      console.warn('Cannot sync: engines not registered');
      return;
    }

    const startTime = performance.now();
    
    // Obtém dados do 2D
    const walls = this.engine2D.getWallsFor3D();
    const rooms = this.engine2D.getRoomsFor3D();
    
    // Envia para o 3D
    this.engine3D.syncFrom2D(walls, rooms);
    
    this.state.lastSyncTime = performance.now() - startTime;
    this.emit('syncCompleted', {
      direction: '2D→3D',
      wallCount: walls.length,
      roomCount: rooms.length,
      duration: this.state.lastSyncTime
    });
  }

  /**
   * Força sincronização completa
   * Útil após carregar um projeto
   */
  forceFullSync(): void {
    this.sync2DTo3D();
    
    // Ajusta câmera 3D para mostrar tudo
    if (this.engine3D) {
      this.engine3D.fitCameraToScene();
    }
  }

  // ============================================
  // UTILITÁRIOS DE CONVERSÃO
  // ============================================

  /**
   * Converte coordenadas 2D para 3D
   */
  static point2DTo3D(point: Point2D): { x: number; y: number; z: number } {
    return {
      x: point.x,
      y: 0, // Altura do chão
      z: point.y // Y do 2D vira Z no 3D
    };
  }

  /**
   * Converte coordenadas 3D para 2D
   */
  static point3DTo2D(point: { x: number; y: number; z: number }): Point2D {
    return {
      x: point.x,
      y: point.z // Z do 3D vira Y no 2D
    };
  }

  // ============================================
  // GETTERS
  // ============================================

  getState(): SyncState {
    return { ...this.state };
  }

  isReady(): boolean {
    return this.state.is2DActive && this.state.is3DActive;
  }

  get2DEngine(): Canvas2DEngine | null {
    return this.engine2D;
  }

  get3DEngine(): Canvas3DEngine | null {
    return this.engine3D;
  }
}

export default EngineSynchronizer;
