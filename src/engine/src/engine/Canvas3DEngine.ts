// ============================================
// Canvas3DEngine.ts - Motor 3D Profissional
// Câmera otimizada, iluminação premium
// ============================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { Point2D } from '@/types/architectural';
import { EventEmitter } from '@/utils/EventEmitter';

export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export interface LightingConfig {
  ambientIntensity: number;
  directionalIntensity: number;
  shadows: boolean;
}

export class Canvas3DEngine extends EventEmitter {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  
  // Objetos da cena
  private wallMeshes: Map<string, THREE.Mesh> = new Map();
  private roomMeshes: Map<string, THREE.Mesh> = new Map();
  private furnitureMeshes: Map<string, THREE.Mesh> = new Map();
  
  // Configurações
  private cameraConfig: CameraConfig = {
    fov: 50,
    near: 0.1,
    far: 10000,
    position: new THREE.Vector3(0, 800, 1200),
    target: new THREE.Vector3(0, 0, 0)
  };
  
  private lightingConfig: LightingConfig = {
    ambientIntensity: 0.6,
    directionalIntensity: 0.8,
    shadows: true
  };

  private animationId: number | null = null;
  private isFullscreen: boolean = false;

  constructor() {
    super();
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  initialize(container: HTMLElement): void {
    this.container = container;
    
    // Cena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF3F4F6); // Cinza claro profissional
    
    // Câmera com proporção correta
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      this.cameraConfig.fov,
      aspect,
      this.cameraConfig.near,
      this.cameraConfig.far
    );
    this.camera.position.copy(this.cameraConfig.position);
    
    // Renderer otimizado
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = this.lightingConfig.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.appendChild(this.renderer.domElement);
    
    // Controles orbitais suaves
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.copy(this.cameraConfig.target);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Não permite ir abaixo do chão
    this.controls.minDistance = 100;
    this.controls.maxDistance = 3000;
    
    // Iluminação profissional
    this.setupLighting();
    
    // Chão de referência
    this.setupGround();
    
    // Inicia loop
    this.startRenderLoop();
    
    // Resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    this.emit('initialized');
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Limpa geometrias e materiais
    this.clearScene();
    
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    this.emit('destroyed');
  }

  // ============================================
  // ILUMINAÇÃO PREMIUM
  // ============================================

  private setupLighting(): void {
    if (!this.scene) return;
    
    // Luz ambiente suave
    const ambientLight = new THREE.AmbientLight(
      0xFFFFFF,
      this.lightingConfig.ambientIntensity
    );
    this.scene.add(ambientLight);
    
    // Luz direcional principal (sol)
    const mainLight = new THREE.DirectionalLight(
      0xFFFFFF,
      this.lightingConfig.directionalIntensity
    );
    mainLight.position.set(500, 1000, 500);
    mainLight.castShadow = this.lightingConfig.shadows;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 5000;
    mainLight.shadow.camera.left = -1000;
    mainLight.shadow.camera.right = 1000;
    mainLight.shadow.camera.top = 1000;
    mainLight.shadow.camera.bottom = -1000;
    this.scene.add(mainLight);
    
    // Luz de preenchimento (hemisfério)
    const hemiLight = new THREE.HemisphereLight(
      0xFFFFFF, // Céu
      0x444444, // Chão
      0.4
    );
    this.scene.add(hemiLight);
    
    // Luz de destaque sutil
    const spotLight = new THREE.SpotLight(0xFFFFFF, 0.3);
    spotLight.position.set(-500, 800, -500);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    this.scene.add(spotLight);
  }

  private setupGround(): void {
    if (!this.scene) return;
    
    // Grid de referência
    const gridHelper = new THREE.GridHelper(2000, 40, 0xCCCCCC, 0xE5E5E5);
    this.scene.add(gridHelper);
    
    // Plano do chão (invisível, só para receber sombras)
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.1 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // ============================================
  // RENDER LOOP
  // ============================================

  private startRenderLoop(): void {
    const render = () => {
      this.animationId = requestAnimationFrame(render);
      
      if (this.controls) {
        this.controls.update();
      }
      
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    render();
  }

  private handleResize(): void {
    if (!this.container || !this.camera || !this.renderer) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    
    this.emit('resized', { width, height });
  }

  // ============================================
  // CONSTRUÇÃO DE PAREDES
  // ============================================

  buildWall(
    id: string,
    start: Point2D,
    end: Point2D,
    height: number = 280,
    thickness: number = 10
  ): THREE.Mesh {
    this.removeWall(id);
    
    const length = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    
    // Geometria da parede
    const geometry = new THREE.BoxGeometry(length, height, thickness);
    
    // Material profissional (concreto)
    const material = new THREE.MeshStandardMaterial({
      color: 0xF5F5F5,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Posiciona e rotaciona
    const midX = (start.x + end.x) / 2;
    const midZ = (start.y + end.y) / 2; // Y do 2D = Z no 3D
    
    mesh.position.set(midX, height / 2, midZ);
    
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    mesh.rotation.y = -angle;
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Metadados para identificação
    (mesh as any).userData = { type: 'wall', id, start, end };
    
    if (this.scene) {
      this.scene.add(mesh);
    }
    
    this.wallMeshes.set(id, mesh);
    this.emit('wallBuilt', { id, mesh });
    
    return mesh;
  }

  removeWall(id: string): void {
    const mesh = this.wallMeshes.get(id);
    if (mesh && this.scene) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
      this.wallMeshes.delete(id);
    }
  }

  updateWall(
    id: string,
    start: Point2D,
    end: Point2D,
    height?: number,
    thickness?: number
  ): void {
    this.removeWall(id);
    this.buildWall(id, start, end, height, thickness);
  }

  clearWalls(): void {
    this.wallMeshes.forEach((mesh, id) => this.removeWall(id));
  }

  // ============================================
  // CONSTRUÇÃO DE CÔMODOS
  // ============================================

  buildRoom(
    id: string,
    points: Point2D[],
    height: number = 280,
    floorMaterial?: string
  ): THREE.Mesh {
    this.removeRoom(id);
    
    if (points.length < 3) throw new Error('Room needs at least 3 points');
    
    // Cria shape do chão
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();
    
    // Extrude para criar volume
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 5, // Espessura do chão
      bevelEnabled: false
    });
    
    // Material do chão
    const material = new THREE.MeshStandardMaterial({
      color: 0xE8E8E8,
      roughness: 0.8,
      metalness: 0.0
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0;
    mesh.receiveShadow = true;
    
    (mesh as any).userData = { type: 'room', id, points };
    
    if (this.scene) {
      this.scene.add(mesh);
    }
    
    this.roomMeshes.set(id, mesh);
    
    // Cria paredes do cômodo
    this.buildRoomWalls(id, points, height);
    
    this.emit('roomBuilt', { id, mesh });
    
    return mesh;
  }

  private buildRoomWalls(roomId: string, points: Point2D[], height: number): void {
    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      const end = points[(i + 1) % points.length];
      const wallId = `${roomId}_wall_${i}`;
      
      this.buildWall(wallId, start, end, height, 10);
    }
  }

  removeRoom(id: string): void {
    const mesh = this.roomMeshes.get(id);
    if (mesh && this.scene) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
      this.roomMeshes.delete(id);
    }
    
    // Remove paredes associadas
    for (let i = 0; i < 100; i++) {
      this.removeWall(`${id}_wall_${i}`);
    }
  }

  clearRooms(): void {
    this.roomMeshes.forEach((mesh, id) => this.removeRoom(id));
  }

  // ============================================
  // SINCRONIZAÇÃO COM 2D
  // ============================================

  syncFrom2D(walls: Array<{
    id: string;
    start: Point2D;
    end: Point2D;
    height: number;
    thickness: number;
  }>, rooms?: Array<{
    id: string;
    points: Point2D[];
    height: number;
  }>): void {
    // Remove paredes que não existem mais
    const currentWallIds = new Set(this.wallMeshes.keys());
    const newWallIds = new Set(walls.map(w => w.id));
    
    currentWallIds.forEach(id => {
      if (!newWallIds.has(id)) {
        this.removeWall(id);
      }
    });
    
    // Atualiza ou cria paredes
    walls.forEach(wall => {
      const existing = this.wallMeshes.get(wall.id);
      if (existing) {
        // Verifica se mudou
        const userData = (existing as any).userData;
        const startChanged = 
          userData.start.x !== wall.start.x || 
          userData.start.y !== wall.start.y;
        const endChanged = 
          userData.end.x !== wall.end.x || 
          userData.end.y !== wall.end.y;
        
        if (startChanged || endChanged) {
          this.updateWall(wall.id, wall.start, wall.end, wall.height, wall.thickness);
        }
      } else {
        this.buildWall(wall.id, wall.start, wall.end, wall.height, wall.thickness);
      }
    });
    
    // Sincroniza cômodos se fornecidos
    if (rooms) {
      rooms.forEach(room => {
        this.buildRoom(room.id, room.points, room.height);
      });
    }
    
    this.emit('syncedFrom2D', { wallCount: walls.length, roomCount: rooms?.length || 0 });
  }

  // ============================================
  // CÂMERA E VIEWPORT
  // ============================================

  setCameraPosition(position: { x: number; y: number; z: number }): void {
    if (!this.camera) return;
    this.camera.position.set(position.x, position.y, position.z);
    this.emit('cameraMoved', position);
  }

  setCameraTarget(target: { x: number; y: number; z: number }): void {
    if (!this.controls) return;
    this.controls.target.set(target.x, target.y, target.z);
    this.emit('cameraTargetChanged', target);
  }

  fitCameraToScene(): void {
    if (!this.camera || !this.controls) return;
    
    const box = new THREE.Box3();
    
    // Calcula bounding box de todas as paredes
    this.wallMeshes.forEach(mesh => {
      box.expandByObject(mesh);
    });
    
    if (box.isEmpty()) {
      // Reset para posição padrão
      this.camera.position.copy(this.cameraConfig.position);
      this.controls.target.copy(this.cameraConfig.target);
      return;
    }
    
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
    
    this.camera.position.set(
      center.x + cameraZ,
      center.y + cameraZ * 0.5,
      center.z + cameraZ
    );
    
    this.controls.target.copy(center);
    this.controls.update();
    
    this.emit('cameraFitted');
  }

  // ============================================
  // FULLSCREEN
  // ============================================

  toggleFullscreen(): boolean {
    if (!this.container) return false;
    
    if (!document.fullscreenElement) {
      this.container.requestFullscreen().then(() => {
        this.isFullscreen = true;
        this.handleResize();
        this.emit('fullscreenChanged', true);
      }).catch(err => {
        console.error('Fullscreen error:', err);
      });
      return true;
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
        this.handleResize();
        this.emit('fullscreenChanged', false);
      });
      return false;
    }
  }

  isInFullscreen(): boolean {
    return !!document.fullscreenElement;
  }

  // ============================================
  // UTILITÁRIOS
  // ============================================

  private clearScene(): void {
    this.clearWalls();
    this.clearRooms();
    
    this.furnitureMeshes.forEach((mesh, id) => {
      if (this.scene) {
        this.scene.remove(mesh);
      }
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    this.furnitureMeshes.clear();
  }

  getScreenshot(): string | null {
    if (!this.renderer) return null;
    return this.renderer.domElement.toDataURL('image/png');
  }

  // ============================================
  // GETTERS
  // ============================================

  getScene(): THREE.Scene | null {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera | null {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  getControls(): OrbitControls | null {
    return this.controls;
  }

  getWallCount(): number {
    return this.wallMeshes.size;
  }

  getRoomCount(): number {
    return this.roomMeshes.size;
  }
}

export default Canvas3DEngine;
