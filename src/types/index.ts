// ============================================
// ARQUIVO 5: src/types/index.ts
// ============================================

// ============================================
// TIPOS BÁSICOS
// ============================================

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export type ID = string;

// ============================================
// TIPOS DE PROJETO
// ============================================

export interface ProjectSettings {
  unit: 'meters' | 'centimeters' | 'feet' | 'inches';
  gridSize: number;
  showGrid: boolean;
  showAxes: boolean;
  snapToGrid: boolean;
  snapToAngle: boolean;
  snapAngles: number[];
  showMeasurements: boolean;
  defaultWallHeight: number;
  defaultWallThickness: number;
  terrainSize: Vector2D;
}

export interface Terrain {
  size: Vector2D;
  elevation: number[][];
  texture?: string;
}

export interface Exterior {
  terrainSize: Vector2D;
  terrain?: Terrain;
  landscaping?: LandscapingElement[];
}

export interface LandscapingElement {
  id: ID;
  type: 'tree' | 'bush' | 'flower' | 'grass' | 'path' | 'deck' | 'pool';
  position: Vector3D;
  scale: Vector3D;
  rotation: number;
}

export interface Project {
  id: ID;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  furniture: Furniture[];
  exterior: Exterior;
  tags: string[];
  thumbnail?: string;
}

// ============================================
// TIPOS DE ELEMENTOS ARQUITETÔNICOS
// ============================================

export interface Wall {
  id: ID;
  start: Vector2D;
  end: Vector2D;
  height: number;
  thickness: number;
  color: string;
  material?: string;
  hasBaseboard?: boolean;
  baseboardHeight?: number;
}

export interface Room {
  id: ID;
  name: string;
  points: Vector2D[];
  height: number;
  color: string;
  area: number;
  perimeter: number;
  type: RoomType;
  ceilingHeight?: number;
  floorMaterial?: string;
  wallMaterial?: string;
}

export type RoomType = 
  | 'living' | 'kitchen' | 'bedroom' | 'bathroom' 
  | 'dining' | 'office' | 'garage' | 'hallway'
  | 'storage' | 'balcony' | 'garden' | 'other';

export interface Door {
  id: ID;
  wallId: ID;
  position: number; // 0-1 posição ao longo da parede
  width: number;
  height: number;
  type: DoorType;
  swing: 'left' | 'right' | 'sliding' | 'pocket';
  material?: string;
}

export type DoorType = 'single' | 'double' | 'pocket' | 'sliding' | 'folding';

export interface Window {
  id: ID;
  wallId: ID;
  position: number; // 0-1 posição ao longo da parede
  width: number;
  height: number;
  sillHeight: number;
  type: WindowType;
  material?: string;
}

export type WindowType = 'single' | 'double' | 'sliding' | 'casement' | 'fixed' | 'bay';

// ============================================
// TIPOS DE MÓVEIS
// ============================================

export interface Furniture {
  id: ID;
  name: string;
  category: FurnitureCategory;
  position: Vector3D;
  rotation: number;
  scale: Vector3D;
  color: string;
  material?: string;
  modelUrl?: string;
  dimensions: Dimensions;
}

export type FurnitureCategory =
  | 'seating' | 'tables' | 'storage' | 'beds'
  | 'lighting' | 'appliances' | 'decor' | 'plants'
  | 'electronics' | 'kitchen' | 'bathroom';

export interface FurnitureCatalogItem {
  id: ID;
  name: string;
  category: FurnitureCategory;
  subcategory: string;
  style: string[];
  dimensions: Dimensions;
  colors: string[];
  materials: string[];
  thumbnailUrl: string;
  modelUrl?: string;
  price?: number;
  tags: string[];
}

export interface FurnitureCategory {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

// ============================================
// TIPOS DE TEMPLATES E ESTILOS
// ============================================

export interface ProjectTemplate {
  id: ID;
  name: string;
  description: string;
  icon?: string;
  rooms: number;
  area: number;
  terrainSize: Vector2D;
  defaultWallHeight: number;
  defaultWallThickness: number;
  category: 'residential' | 'commercial' | 'apartment' | 'industrial' | 'other';
  tags: string[];
  previewImage?: string;
}

export interface DesignStyle {
  id: ID;
  name: string;
  description: string;
  icon?: string;
  tags: string[];
  colors: string[];
  materials: string[];
  previewImage?: string;
}

// ============================================
// TIPOS DE UI/UX
// ============================================

export type ToolMode = 'select' | 'wall' | 'room' | 'door' | 'window' | 'furniture' | 'measure';

export type ViewMode = '2d' | '3d';

export interface Canvas2DState {
  scale: number;
  offset: Vector2D;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
}

export interface Canvas3DState {
  cameraPosition: Vector3D;
  cameraTarget: Vector3D;
  zoom: number;
  showShadows: boolean;
  showLighting: boolean;
  renderQuality: 'low' | 'medium' | 'high';
}

export interface PanelsState {
  furniture: boolean;
  ai: boolean;
  properties: boolean;
  layers: boolean;
  materials: boolean;
}

// ============================================
// TIPOS DE USUÁRIO
// ============================================

export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface User {
  id: ID;
  email: string;
  name: string;
  avatar: string;
  plan: UserPlan;
  createdAt: Date;
  projectsCount: number;
  storageUsed: number;
  storageLimit: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    projects: number;
    storage: number;
    aiGenerations: number;
    exports: number;
  };
}

// ============================================
// TIPOS DE IA
// ============================================

export interface AIGenerationRequest {
  prompt: string;
  style?: string;
  constraints?: {
    maxRooms?: number;
    minArea?: number;
    maxArea?: number;
    terrainSize?: Vector2D;
  };
}

export interface AIGenerationResult {
  success: boolean;
  project?: Partial<Project>;
  suggestions?: DesignSuggestion[];
  error?: string;
}

export interface DesignSuggestion {
  id: ID;
  type: 'layout' | 'furniture' | 'color' | 'material' | 'lighting';
  title: string;
  description: string;
  confidence: number;
  previewImage?: string;
}

// ============================================
// TIPOS DE EXPORTAÇÃO
// ============================================

export type ExportFormat = 'pdf' | 'dwg' | 'obj' | 'fbx' | 'png' | 'jpg';

export interface ExportOptions {
  format: ExportFormat;
  scale?: number;
  includeDimensions?: boolean;
  includeMaterials?: boolean;
  quality?: 'low' | 'medium' | 'high';
  paperSize?: 'A4' | 'A3' | 'A2' | 'A1' | 'letter' | 'legal';
}

// ============================================
// TIPOS DE HISTÓRICO
// ============================================

export interface HistoryAction {
  id: ID;
  type: 'create' | 'update' | 'delete' | 'move' | 'rotate' | 'scale';
  targetType: 'wall' | 'room' | 'door' | 'window' | 'furniture';
  targetId: ID;
  previousState: any;
  newState: any;
  timestamp: Date;
}

// ============================================
// TIPOS DE FILTROS E BUSCA
// ============================================

export interface FilterCriteria<T> {
  field: keyof T;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
}

export interface SortOptions<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

// ============================================
// TIPOS DE API/RESPONSE
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// ============================================
// TIPOS DE PONTO (para Canvas)
// ============================================

export interface Point {
  x: number;
  y: number;
}

// ============================================
// RE-EXPORTS (para compatibilidade)
// ============================================

export type { Vector2D as Point2D };
export type { Vector3D as Point3D };
