// ============================================
// ENGINE SYNCHRONIZER - CasaPro AI Premium
// ============================================

import { Canvas2DEngine } from './Canvas2DEngine';
import { Canvas3DEngine } from './Canvas3DEngine';
import type { Wall, Room, Door, Window, Furniture } from '@/types';

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
// TIPOS DO SYNCHRONIZER
// ============================================

export interface SyncOptions {
  syncWalls: boolean;
  syncRooms: boolean;
  syncDoors: boolean;
  syncWindows: boolean;
  syncFurniture: boolean;
  autoSync: boolean;
  debounceMs: number;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime: number;
  pendingChanges: boolean;
  syncDirection: '2d-to-3d' | '3d-to-2d' | 'bidirectional';
}

// ============================================
// ENGINE SYNCHRONIZER
// ============================================

export class EngineSynchronizer extends EventEmitter {
  private engine2D: Canvas2DEngine;
  private engine3D: Canvas3DEngine;
  
  private options: SyncOptions = {
    syncWalls: true,
    syncRooms: true,
    syncDoors: true,
    syncWindows: true,
    syncFurniture: true,
    autoSync: true,
    debounceMs: 100
  };

  private state: SyncState = {
    isSyncing: false,
    lastSyncTime: 0,
    pendingChanges: false,
    syncDirection: '2d-to-3d'
  };

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isActive: boolean = false;

  constructor(engine2D: Canvas2DEngine, engine3D: Canvas3DEngine) {
    super();
    this.engine2D = engine2D;
    this.engine3D = engine3D;
  }

  // ============================================
  // CONTROLE DE SINCRONIZAÇÃO
  // ============================================

  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.setupEventListeners();
    this.emit('started');
    
    // Sincronização inicial
    this.sync2DTo3D();
  }

  stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.removeEventListeners();
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    this.emit('stopped');
  }

  private setupEventListeners(): void {
    // Ouvir eventos do engine 2D
    this.engine2D.on('wallAdded', this.handle2DWallAdded);
    this.engine2D.on('wallUpdated', this.handle2DWallUpdated);
    this.engine2D.on('wallRemoved', this.handle2DWallRemoved);
    this.engine2D.on('roomAdded', this.handle2DRoomAdded);
    this.engine2D.on('roomUpdated', this.handle2DRoomUpdated);
    this.engine2D.on('roomRemoved', this.handle2DRoomRemoved);
    this.engine2D.on('doorAdded', this.handle2DDoorAdded);
    this.engine2D.on('windowAdded', this.handle2DWindowAdded);
    this.engine2D.on('furnitureAdded', this.handle2DFurnitureAdded);
    this.engine2D.on('furnitureUpdated', this.handle2DFurnitureUpdated);
    this.engine2D.on('furnitureRemoved', this.handle2DFurnitureRemoved);
  }

  private removeEventListeners(): void {
    this.engine2D.off('wallAdded', this.handle2DWallAdded);
    this.engine2D.off('wallUpdated', this.handle2DWallUpdated);
    this.engine2D.off('wallRemoved', this.handle2DWallRemoved);
    this.engine2D.off('roomAdded', this.handle2DRoomAdded);
    this.engine2D.off('roomUpdated', this.handle2DRoomUpdated);
    this.engine2D.off('roomRemoved', this.handle2DRoomRemoved);
    this.engine2D.off('doorAdded', this.handle2DDoorAdded);
    this.engine2D.off('windowAdded', this.handle2DWindowAdded);
    this.engine2D.off('furnitureAdded', this.handle2DFurnitureAdded);
    this.engine2D.off('furnitureUpdated', this.handle2DFurnitureUpdated);
    this.engine2D.off('furnitureRemoved', this.handle2DFurnitureRemoved);
  }

  // ============================================
  // HANDLERS 2D -> 3D
  // ============================================

  private handle2DWallAdded = (data: { wall: Wall }): void => {
    if (!this.options.syncWalls) return;
    this.debounceSync(() => {
      this.engine3D.addWall(data.wall);
    });
  };

  private handle2DWallUpdated = (data: { wall: Wall }): void => {
    if (!this.options.syncWalls) return;
    this.debounceSync(() => {
      this.engine3D.updateWall(data.wall);
    });
  };

  private handle2DWallRemoved = (data: { wall: Wall }): void => {
    if (!this.options.syncWalls) return;
    this.debounceSync(() => {
      this.engine3D.removeWall(data.wall.id);
    });
  };

  private handle2DRoomAdded = (data: { room: Room }): void => {
    if (!this.options.syncRooms) return;
    this.debounceSync(() => {
      this.engine3D.addRoom(data.room);
    });
  };

  private handle2DRoomUpdated = (data: { room: Room }): void => {
    if (!this.options.syncRooms) return;
    this.debounceSync(() => {
      this.engine3D.updateRoom(data.room);
    });
  };

  private handle2DRoomRemoved = (data: { room: Room }): void => {
    if (!this.options.syncRooms) return;
    this.debounceSync(() => {
      this.engine3D.removeRoom(data.room.id);
    });
  };

  private handle2DDoorAdded = (data: { door: Door }): void => {
    if (!this.options.syncDoors) return;
    this.debounceSync(() => {
      const wall = this.engine2D.getWalls().find(w => w.id === data.door.wallId);
      this.engine3D.addDoor(data.door, wall);
    });
  };

  private handle2DWindowAdded = (data: { window: Window }): void => {
    if (!this.options.syncWindows) return;
    this.debounceSync(() => {
      const wall = this.engine2D.getWalls().find(w => w.id === data.window.wallId);
      this.engine3D.addWindow(data.window, wall);
    });
  };

  private handle2DFurnitureAdded = (data: { furniture: Furniture }): void => {
    if (!this.options.syncFurniture) return;
    this.debounceSync(() => {
      this.engine3D.addFurniture(data.furniture);
    });
  };

  private handle2DFurnitureUpdated = (data: { furniture: Furniture }): void => {
    if (!this.options.syncFurniture) return;
    this.debounceSync(() => {
      this.engine3D.updateFurniture(data.furniture);
    });
  };

  private handle2DFurnitureRemoved = (data: { furniture: Furniture }): void => {
    if (!this.options.syncFurniture) return;
    this.debounceSync(() => {
      this.engine3D.removeFurniture(data.furniture.id);
    });
  };

  // ============================================
  // SINCRONIZAÇÃO
  // ============================================

  private debounceSync(syncFn: () => void): void {
    if (!this.options.autoSync) {
      this.state.pendingChanges = true;
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.performSync(syncFn);
    }, this.options.debounceMs);
  }

  private performSync(syncFn: () => void): void {
    if (this.state.isSyncing) return;
    
    this.state.isSyncing = true;
    this.emit('syncStarted');
    
    try {
      syncFn();
      this.state.lastSyncTime = Date.now();
      this.state.pendingChanges = false;
      this.emit('syncCompleted');
    } catch (error) {
      this.emit('syncError', { error });
    } finally {
      this.state.isSyncing = false;
    }
  }

  sync2DTo3D(): void {
    if (this.state.isSyncing) return;
    
    this.state.syncDirection = '2d-to-3d';
    this.state.isSyncing = true;
    this.emit('syncStarted', { direction: '2d-to-3d' });
    
    try {
      // Limpar 3D
      this.engine3D.clear();
      
      // Sincronizar paredes
      if (this.options.syncWalls) {
        const walls = this.engine2D.getWalls();
        walls.forEach(wall => this.engine3D.addWall(wall));
      }
      
      // Sincronizar cômodos
      if (this.options.syncRooms) {
        const rooms = this.engine2D.getRooms();
        rooms.forEach(room => this.engine3D.addRoom(room));
      }
      
      // Sincronizar portas
      if (this.options.syncDoors) {
        const doors = this.engine2D.getDoors();
        const walls = this.engine2D.getWalls();
        doors.forEach(door => {
          const wall = walls.find(w => w.id === door.wallId);
          this.engine3D.addDoor(door, wall);
        });
      }
      
      // Sincronizar janelas
      if (this.options.syncWindows) {
        const windows = this.engine2D.getWindows();
        const walls = this.engine2D.getWalls();
        windows.forEach(window => {
          const wall = walls.find(w => w.id === window.wallId);
          this.engine3D.addWindow(window, wall);
        });
      }
      
      // Sincronizar móveis
      if (this.options.syncFurniture) {
        const furniture = this.engine2D.getFurniture();
        furniture.forEach(item => this.engine3D.addFurniture(item));
      }
      
      this.state.lastSyncTime = Date.now();
      this.state.pendingChanges = false;
      this.emit('syncCompleted', { direction: '2d-to-3d' });
    } catch (error) {
      this.emit('syncError', { error, direction: '2d-to-3d' });
    } finally {
      this.state.isSyncing = false;
    }
  }

  forceSync(): void {
    this.sync2DTo3D();
  }

  // ============================================
  // CONFIGURAÇÕES
  // ============================================

  setOptions(options: Partial<SyncOptions>): void {
    this.options = { ...this.options, ...options };
    this.emit('optionsChanged', { options: this.options });
  }

  getOptions(): SyncOptions {
    return { ...this.options };
  }

  getState(): SyncState {
    return { ...this.state };
  }

  isRunning(): boolean {
    return this.isActive;
  }

  // ============================================
  // GETTERS DOS ENGINES
  // ============================================

  getEngine2D(): Canvas2DEngine {
    return this.engine2D;
  }

  getEngine3D(): Canvas3DEngine {
    return this.engine3D;
  }
}

export default EngineSynchronizer;
