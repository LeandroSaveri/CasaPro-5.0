// ============================================
// TIPOS PRINCIPAIS - CasaPro AI Premium
// ============================================

// --- Tipos Geométricos Básicos ---
export interface Point {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Size {
  width: number;
  height: number;
  depth: number;
}

export interface Bounds {
  min: Point;
  max: Point;
}

// --- Elementos da Planta ---
export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  height: number;
  color: string;
  material?: string;
  layer?: string;
  metadata?: {
    length?: number;
    angle?: number;
  };
}

export interface Room {
  id: string;
  name: string;
  points: Point[];
  color: string;
  floorMaterial: string;
  wallMaterial?: string;
  ceilingMaterial?: string;
  area: number;
  perimeter?: number;
  layer?: string;
  metadata?: {
    center?: Point;
    bounds?: Bounds;
  };
}

export interface Door {
  id: string;
  wallId: string;
  position: number; // 0-1 posição ao longo da parede
  width: number;
  height: number;
  type: 'single' | 'double' | 'sliding' | 'pocket' | 'folding';
  angle: number;
  swingDirection?: 'left' | 'right' | 'inward' | 'outward';
  material?: string;
  frameColor?: string;
  layer?: string;
}

export interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
  sillHeight: number;
  type: 'fixed' | 'sliding' | 'casement' | 'awning' | 'bay';
  material?: string;
  frameColor?: string;
  hasBlinds?: boolean;
  layer?: string;
}

// --- Móveis e Objetos ---
export interface Furniture {
  id: string;
  type: string;
  category: string;
  subcategory?: string;
  position: Point;
  position3D?: Point3D;
  rotation: number;
  rotation3D?: Point3D;
  scale: Point;
  width: number;
  height: number;
  depth: number;
  color: string;
  material: string;
  name: string;
  visible: boolean;
  locked: boolean;
  metadata?: {
    brand?: string;
    model?: string;
    price?: number;
    url?: string;
  };
}

// --- Materiais e Texturas ---
export interface Material {
  id: string;
  name: string;
  type: 'floor' | 'wall' | 'furniture' | 'exterior' | 'ceiling';
  color: string;
  textureUrl?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  properties: {
    roughness: number;
    metalness: number;
    reflectivity: number;
    transparency: number;
    emissive?: string;
    emissiveIntensity?: number;
  };
  category: string;
  tags: string[];
}

// --- Estilos de Design ---
export interface DesignStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  materials: {
    floor: string[];
    wall: string[];
    furniture: string[];
  };
  lighting: {
    intensity: number;
    color: string;
    ambientIntensity: number;
  };
  furnitureCategories: string[];
}

// --- Templates de Projeto ---
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  terrainSize: Point;
  defaultWallHeight: number;
  rooms: Array<{
    name: string;
    width: number;
    depth: number;
    position: Point;
  }>;
  preloadedFurniture?: Furniture[];
  recommendedStyle?: string;
}

// --- Configurações do Projeto ---
export interface ProjectSettings {
  unit: 'meters' | 'centimeters' | 'feet' | 'inches';
  gridSize: number;
  snapToGrid: boolean;
  snapToAngle: boolean;
  snapAngles: number[];
  showMeasurements: boolean;
  showGrid: boolean;
  showAxes: boolean;
  defaultWallHeight: number;
  defaultWallThickness: number;
  defaultFloorMaterial: string;
  defaultWallMaterial: string;
  terrainSize: Point;
  layers: Layer[];
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  opacity: number;
  type: 'structure' | 'electrical' | 'plumbing' | 'furniture' | 'decor' | 'custom';
}

// --- Design Externo ---
export interface ExteriorDesign {
  facadeMaterial: string;
  facadeColor: string;
  roofType: 'flat' | 'gable' | 'hip' | 'mansard' | 'shed';
  roofMaterial: string;
  roofColor: string;
  hasGarage: boolean;
  garageSize?: Size;
  hasPool: boolean;
  poolSize?: Size;
  hasGarden: boolean;
  gardenArea?: Bounds;
  terrainSize: Point;
  terrainShape: Point[];
  terrain?: {
    width: number;
    depth: number;
  };
  fenceType?: string;
  fenceHeight?: number;
  gateType?: string;
}

// --- Projeto Completo ---
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  isTemplate: boolean;
  isPublic: boolean;
  thumbnail?: string;
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  furniture: Furniture[];
  exterior: ExteriorDesign;
  settings: ProjectSettings;
  appliedStyle?: string;
  version: number;
  tags: string[];
}

// --- Modos de Ferramenta ---
export type ToolMode = 
  | 'select' 
  | 'wall' 
  | 'room' 
  | 'door' 
  | 'window' 
  | 'furniture' 
  | 'measure' 
  | 'eraser'
  | 'pan'
  | 'zoom'
  | 'text'
  | 'dimension';

export type ViewMode = '2d' | '3d';

export type CameraMode3D = 'orbit' | 'walk' | 'top' | 'firstPerson';

// --- Estado do Canvas ---
export interface CanvasState {
  scale: number;
  offset: Point;
  rotation: number;
  isPanning: boolean;
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  snapPoint: Point | null;
  hoveredElement: string | null;
  selectionBox: { start: Point; end: Point } | null;
}

// --- Iluminação 3D ---
export interface LightingSettings {
  ambientIntensity: number;
  ambientColor: string;
  sunPosition: Point3D;
  sunIntensity: number;
  sunColor: string;
  shadowsEnabled: boolean;
  shadowQuality: 'low' | 'medium' | 'high' | 'ultra';
  timeOfDay: number; // 0-24
  exposure: number;
  fogEnabled: boolean;
  fogDensity: number;
  fogColor: string;
}

// --- Recomendações de IA ---
export interface AIRecommendation {
  id: string;
  type: 'layout' | 'style' | 'color' | 'furniture' | 'lighting' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  data: any;
  applied: boolean;
  timestamp: Date;
}

export interface AIGeneratedProject {
  prompt: string;
  project: Partial<Project>;
  recommendations: AIRecommendation[];
  style: DesignStyle;
  estimatedCost?: number;
  estimatedArea?: number;
}

// --- Biblioteca de Móveis ---
export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  icon: string;
  thumbnail?: string;
  model3D?: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultDepth: number;
  colors: string[];
  materials: string[];
  tags: string[];
  popular: boolean;
  premium: boolean;
  brand?: string;
  price?: number;
  description?: string;
}

export interface FurnitureCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  itemCount: number;
  subcategories: string[];
}

// --- Usuário e Autenticação ---
export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: UserPlan;
  planExpiry?: Date;
  projects: string[];
  projectsCount: number;
  maxProjects: number;
  favorites: {
    furniture: string[];
    materials: string[];
    styles: string[];
  };
  settings: UserSettings;
  createdAt: Date;
  lastLoginAt: Date;
  lastLogin?: Date;
}

export interface UserSettings {
  language: string;
  theme: 'dark' | 'light' | 'auto';
  notifications: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  defaultUnit: string;
  defaultView: ViewMode;
  toolbarPosition: 'left' | 'right' | 'top';
}

// --- Planos de Assinatura ---
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    projects: number;
    exportsPerMonth: number;
    rendersPerMonth: number;
    storageGB: number;
    aiRequestsPerMonth: number;
    maxFurniturePerProject: number;
  };
}

// --- Exportações ---
export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg' | 'glb' | 'obj' | 'dxf';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  includeDimensions: boolean;
  includeAnnotations: boolean;
  scale?: number;
  paperSize?: 'A4' | 'A3' | 'A2' | 'A1' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

// --- UI e Animações ---
export interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  activePanel: string | null;
  panels: {
    furniture: boolean;
    properties: boolean;
    layers: boolean;
    materials: boolean;
    ai: boolean;
  };
  tooltipsEnabled: boolean;
  animationsEnabled: boolean;
  reducedMotion: boolean;
}

// --- Estatísticas e Analytics ---
export interface ProjectStats {
  totalArea: number;
  builtArea: number;
  roomCount: number;
  wallCount: number;
  doorCount: number;
  windowCount: number;
  furnitureCount: number;
  estimatedCost: number;
  lastModified: Date;
}

// --- Histórico de Ações ---
export interface HistoryAction {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  data: any;
  undo: () => void;
  redo: () => void;
}

// ============================================
// TIPOS ADMIN
// ============================================

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  premiumUsers: number;
  revenue: number;
  popularFeatures: string[];
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
  };
}

export interface AdminUser extends User {
  isAdmin: boolean;
  permissions: string[];
}

export interface ContentManagement {
  furniture: FurnitureItem[];
  materials: Material[];
  styles: DesignStyle[];
  templates: ProjectTemplate[];
}
