// ============================================
// CANVAS 3D ENGINE - CasaPro AI Premium
// ============================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Point3D, Wall, Room, Door, Window, Furniture, LightingSettings } from '@/types';

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
// TIPOS DO ENGINE 3D
// ============================================

export interface ViewMode3D {
  mode: '3d' | 'top' | 'front' | 'side';
  position: Point3D;
  target: Point3D;
}

export interface RenderQuality {
  shadows: boolean;
  antialias: boolean;
  reflections: boolean;
  textureQuality: 'low' | 'medium' | 'high';
}

// ============================================
// CANVAS 3D ENGINE
// ============================================

export class Canvas3DEngine extends EventEmitter {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  
  // Elementos 3D
  private wallMeshes: Map<string, THREE.Mesh> = new Map();
  private roomMeshes: Map<string, THREE.Mesh> = new Map();
  private furnitureMeshes: Map<string, THREE.Group> = new Map();
  private doorMeshes: Map<string, THREE.Group> = new Map();
  private windowMeshes: Map<string, THREE.Group> = new Map();
  
  // Iluminação
  private ambientLight: THREE.AmbientLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  
  // Estado
  private isInitialized: boolean = false;
  private animationId: number | null = null;
  private lightingSettings: LightingSettings = {
    ambientIntensity: 0.4,
    ambientColor: '#ffffff',
    sunPosition: { x: 50, y: 100, z: 50 },
    sunIntensity: 1.0,
    sunColor: '#ffffff',
    shadowsEnabled: true,
    shadowQuality: 'high',
    timeOfDay: 12,
    exposure: 1.0,
    fogEnabled: false,
    fogDensity: 0.01,
    fogColor: '#cccccc'
  };

  private quality: RenderQuality = {
    shadows: true,
    antialias: true,
    reflections: false,
    textureQuality: 'high'
  };

  constructor() {
    super();
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  initialize(container: HTMLElement): void {
    this.container = container;
    
    // Criar cena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    
    // Criar câmera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(50, 50, 50);
    this.camera.lookAt(0, 0, 0);
    
    // Criar renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: this.quality.antialias,
      alpha: true 
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.appendChild(this.renderer.domElement);
    
    // Criar controles
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    
    // Configurar iluminação
    this.setupLighting();
    
    // Adicionar grid
    const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0xcccccc);
    this.scene.add(gridHelper);
    
    // Event listeners
    window.addEventListener('resize', this.handleResize);
    
    this.isInitialized = true;
    this.startRenderLoop();
    
    this.emit('initialized', { engine: this });
  }

  destroy(): void {
    this.stopRenderLoop();
    window.removeEventListener('resize', this.handleResize);
    
    if (this.renderer && this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    // Limpar meshes
    this.clearAllMeshes();
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.isInitialized = false;
    
    this.emit('destroyed');
  }

  private setupLighting(): void {
    if (!this.scene) return;
    
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(
      this.lightingSettings.ambientColor,
      this.lightingSettings.ambientIntensity
    );
    this.scene.add(this.ambientLight);
    
    // Sun light (directional)
    this.sunLight = new THREE.DirectionalLight(
      this.lightingSettings.sunColor,
      this.lightingSettings.sunIntensity
    );
    this.sunLight.position.set(
      this.lightingSettings.sunPosition.x,
      this.lightingSettings.sunPosition.y,
      this.lightingSettings.sunPosition.z
    );
    this.sunLight.castShadow = this.lightingSettings.shadowsEnabled;
    
    if (this.lightingSettings.shadowsEnabled) {
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 500;
      this.sunLight.shadow.camera.left = -100;
      this.sunLight.shadow.camera.right = 100;
      this.sunLight.shadow.camera.top = 100;
      this.sunLight.shadow.camera.bottom = -100;
    }
    
    this.scene.add(this.sunLight);
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.render();
    };
    animate();
  }

  private stopRenderLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private render(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    
    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize = (): void => {
    if (!this.container || !this.camera || !this.renderer) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    
    this.renderer.setSize(width, height);
    this.emit('resize', { width, height });
  };

  // ============================================
  // GESTÃO DE PAREDES 3D
  // ============================================

  addWall(wall: Wall): void {
    if (!this.scene) return;
    
    // Remover mesh existente se houver
    this.removeWall(wall.id);
    
    // Criar geometria da parede
    const height = wall.height || 280;
    const thickness = wall.thickness || 10;
    
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    const geometry = new THREE.BoxGeometry(wallLength, height, thickness);
    const material = new THREE.MeshStandardMaterial({
      color: wall.color || 0xffffff,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Posicionar
    mesh.position.x = (wall.start.x + wall.end.x) / 2;
    mesh.position.y = height / 2;
    mesh.position.z = (wall.start.y + wall.end.y) / 2;
    
    mesh.rotation.y = -angle;
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'wall', id: wall.id, data: wall };
    
    this.scene.add(mesh);
    this.wallMeshes.set(wall.id, mesh);
    
    this.emit('wallAdded', { wall, mesh });
  }

  updateWall(wall: Wall): void {
    this.removeWall(wall.id);
    this.addWall(wall);
    this.emit('wallUpdated', { wall });
  }

  removeWall(id: string): void {
    const mesh = this.wallMeshes.get(id);
    if (mesh && this.scene) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.wallMeshes.delete(id);
      this.emit('wallRemoved', { id });
    }
  }

  // ============================================
  // GESTÃO DE CÔMODOS 3D
  // ============================================

  addRoom(room: Room): void {
    if (!this.scene || room.points.length < 3) return;
    
    this.removeRoom(room.id);
    
    // Criar shape do chão
    const shape = new THREE.Shape();
    shape.moveTo(room.points[0].x, room.points[0].y);
    for (let i = 1; i < room.points.length; i++) {
      shape.lineTo(room.points[i].x, room.points[i].y);
    }
    shape.closePath();
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshStandardMaterial({
      color: room.color || 0xcccccc,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.1;
    mesh.receiveShadow = true;
    mesh.userData = { type: 'room', id: room.id, data: room };
    
    this.scene.add(mesh);
    this.roomMeshes.set(room.id, mesh);
    
    this.emit('roomAdded', { room, mesh });
  }

  updateRoom(room: Room): void {
    this.removeRoom(room.id);
    this.addRoom(room);
    this.emit('roomUpdated', { room });
  }

  removeRoom(id: string): void {
    const mesh = this.roomMeshes.get(id);
    if (mesh && this.scene) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.roomMeshes.delete(id);
      this.emit('roomRemoved', { id });
    }
  }

  // ============================================
  // GESTÃO DE PORTAS 3D
  // ============================================

  addDoor(door: Door, wall?: Wall): void {
    if (!this.scene) return;
    
    this.removeDoor(door.id);
    
    const group = new THREE.Group();
    
    // Frame da porta
    const frameWidth = door.width + 10;
    const frameHeight = door.height + 5;
    const frameDepth = 15;
    
    const frameGeometry = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: door.frameColor || 0x8B4513,
      roughness: 0.6
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.castShadow = true;
    group.add(frame);
    
    // Porta em si
    const doorGeometry = new THREE.BoxGeometry(door.width, door.height, 5);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.5
    });
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.position.z = 5;
    doorMesh.castShadow = true;
    group.add(doorMesh);
    
    // Posicionar na parede
    if (wall) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      
      const posX = wall.start.x + (dx * door.position);
      const posZ = wall.start.y + (dy * door.position);
      const angle = Math.atan2(dy, dx);
      
      group.position.set(posX, door.height / 2, posZ);
      group.rotation.y = -angle;
    }
    
    group.userData = { type: 'door', id: door.id, data: door };
    
    this.scene.add(group);
    this.doorMeshes.set(door.id, group);
    
    this.emit('doorAdded', { door, group });
  }

  removeDoor(id: string): void {
    const group = this.doorMeshes.get(id);
    if (group && this.scene) {
      this.scene.remove(group);
      this.disposeGroup(group);
      this.doorMeshes.delete(id);
      this.emit('doorRemoved', { id });
    }
  }

  // ============================================
  // GESTÃO DE JANELAS 3D
  // ============================================

  addWindow(window: Window, wall?: Wall): void {
    if (!this.scene) return;
    
    this.removeWindow(window.id);
    
    const group = new THREE.Group();
    
    // Frame
    const frameWidth = window.width + 8;
    const frameHeight = window.height + 8;
    const frameDepth = 12;
    
    const frameGeometry = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: window.frameColor || 0xffffff,
      roughness: 0.4
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.castShadow = true;
    group.add(frame);
    
    // Vidro
    const glassGeometry = new THREE.BoxGeometry(window.width, window.height, 2);
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.3,
      roughness: 0.0,
      metalness: 0.9
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    group.add(glass);
    
    // Posicionar
    if (wall) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      
      const posX = wall.start.x + (dx * window.position);
      const posZ = wall.start.y + (dy * window.position);
      const angle = Math.atan2(dy, dx);
      
      group.position.set(posX, window.sillHeight + window.height / 2, posZ);
      group.rotation.y = -angle;
    }
    
    group.userData = { type: 'window', id: window.id, data: window };
    
    this.scene.add(group);
    this.windowMeshes.set(window.id, group);
    
    this.emit('windowAdded', { window, group });
  }

  removeWindow(id: string): void {
    const group = this.windowMeshes.get(id);
    if (group && this.scene) {
      this.scene.remove(group);
      this.disposeGroup(group);
      this.windowMeshes.delete(id);
      this.emit('windowRemoved', { id });
    }
  }

  // ============================================
  // GESTÃO DE MÓVEIS 3D
  // ============================================

  addFurniture(furniture: Furniture): void {
    if (!this.scene) return;
    
    this.removeFurniture(furniture.id);
    
    const group = new THREE.Group();
    
    // Criar geometria básica
    const geometry = new THREE.BoxGeometry(furniture.width, furniture.height, furniture.depth);
    const material = new THREE.MeshStandardMaterial({
      color: furniture.color || 0x888888,
      roughness: 0.7,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = furniture.height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    
    // Posicionar
    group.position.set(furniture.position.x, 0, furniture.position.y);
    group.rotation.y = -furniture.rotation;
    
    group.userData = { type: 'furniture', id: furniture.id, data: furniture };
    
    this.scene.add(group);
    this.furnitureMeshes.set(furniture.id, group);
    
    this.emit('furnitureAdded', { furniture, group });
  }

  updateFurniture(furniture: Furniture): void {
    this.removeFurniture(furniture.id);
    this.addFurniture(furniture);
    this.emit('furnitureUpdated', { furniture });
  }

  removeFurniture(id: string): void {
    const group = this.furnitureMeshes.get(id);
    if (group && this.scene) {
      this.scene.remove(group);
      this.disposeGroup(group);
      this.furnitureMeshes.delete(id);
      this.emit('furnitureRemoved', { id });
    }
  }

  // ============================================
  // MÉTODO CLEAR
  // ============================================

  clear(): void {
    this.clearAllMeshes();
    this.emit('cleared');
  }

  // ============================================
  // UTILITÁRIOS
  // ============================================

  private disposeGroup(group: THREE.Group): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  private clearAllMeshes(): void {
    // Limpar todas as paredes
    for (const id of Array.from(this.wallMeshes.keys())) {
      this.removeWall(id);
    }
    
    // Limpar todos os cômodos
    for (const id of Array.from(this.roomMeshes.keys())) {
      this.removeRoom(id);
    }
    
    // Limpar todas as portas
    for (const id of Array.from(this.doorMeshes.keys())) {
      this.removeDoor(id);
    }
    
    // Limpar todas as janelas
    for (const id of Array.from(this.windowMeshes.keys())) {
      this.removeWindow(id);
    }
    
    // Limpar todos os móveis
    for (const id of Array.from(this.furnitureMeshes.keys())) {
      this.removeFurniture(id);
    }
  }

  // ============================================
  // CONTROLES DE CÂMERA
  // ============================================

  setCameraPosition(position: Point3D, target?: Point3D): void {
    if (!this.camera) return;
    
    this.camera.position.set(position.x, position.y, position.z);
    
    if (target) {
      this.camera.lookAt(target.x, target.y, target.z);
    }
    
    this.controls?.update();
    this.emit('cameraChanged', { position, target });
  }

  getCameraPosition(): Point3D {
    if (!this.camera) return { x: 0, y: 0, z: 0 };
    return {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z
    };
  }

  resetCamera(): void {
    this.setCameraPosition({ x: 50, y: 50, z: 50 }, { x: 0, y: 0, z: 0 });
    this.emit('cameraReset');
  }

  setViewMode(mode: ViewMode3D['mode']): void {
    switch (mode) {
      case 'top':
        this.setCameraPosition({ x: 0, y: 100, z: 0 }, { x: 0, y: 0, z: 0 });
        break;
      case 'front':
        this.setCameraPosition({ x: 0, y: 50, z: 100 }, { x: 0, y: 0, z: 0 });
        break;
      case 'side':
        this.setCameraPosition({ x: 100, y: 50, z: 0 }, { x: 0, y: 0, z: 0 });
        break;
      case '3d':
      default:
        this.resetCamera();
        break;
    }
    this.emit('viewModeChanged', { mode });
  }

  // ============================================
  // ILUMINAÇÃO
  // ============================================

  updateLighting(settings: Partial<LightingSettings>): void {
    this.lightingSettings = { ...this.lightingSettings, ...settings };
    
    if (this.ambientLight) {
      this.ambientLight.intensity = this.lightingSettings.ambientIntensity;
      this.ambientLight.color = new THREE.Color(this.lightingSettings.ambientColor);
    }
    
    if (this.sunLight) {
      this.sunLight.intensity = this.lightingSettings.sunIntensity;
      this.sunLight.color = new THREE.Color(this.lightingSettings.sunColor);
      this.sunLight.position.set(
        this.lightingSettings.sunPosition.x,
        this.lightingSettings.sunPosition.y,
        this.lightingSettings.sunPosition.z
      );
      this.sunLight.castShadow = this.lightingSettings.shadowsEnabled;
    }
    
    this.emit('lightingChanged', { settings: this.lightingSettings });
  }

  // ============================================
  // GETTERS
  // ============================================

  getScene(): THREE.Scene | null {
    return this.scene;
  }

  getCamera(): THREE.Camera | null {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  getControls(): OrbitControls | null {
    return this.controls;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // ============================================
  // EXPORTAÇÃO
  // ============================================

  exportToGLB(): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.scene) {
        reject(new Error('Scene not initialized'));
        return;
      }
      
      resolve(new ArrayBuffer(0));
    });
  }

  takeScreenshot(): string {
    if (!this.renderer) return '';
    return this.renderer.domElement.toDataURL('image/png');
  }
}

export default Canvas3DEngine;
