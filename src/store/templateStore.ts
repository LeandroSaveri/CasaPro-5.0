import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectTemplate, DesignStyle, Material, FurnitureItem } from '@/types';

interface TemplateState {
  // Templates
  templates: ProjectTemplate[];
  selectedTemplate: ProjectTemplate | null;
  
  // Styles
  styles: DesignStyle[];
  selectedStyle: DesignStyle | null;
  
  // Materials
  materials: Material[];
  selectedMaterial: Material | null;
  materialCategories: string[];
  
  // Furniture Library (expanded)
  furnitureLibrary: FurnitureItem[];
  furnitureCategories: Array<{
    id: string;
    name: string;
    icon: string;
    count: number;
  }>;
  
  // Favorites
  favoriteFurniture: string[];
  favoriteMaterials: string[];
  
  // Actions
  loadTemplates: () => void;
  selectTemplate: (template: ProjectTemplate | null) => void;
  applyTemplate: (templateId: string) => Partial<ProjectTemplate>;
  
  loadStyles: () => void;
  selectStyle: (style: DesignStyle | null) => void;
  applyStyle: (styleId: string) => DesignStyle | null;
  
  loadMaterials: () => void;
  selectMaterial: (material: Material | null) => void;
  getMaterialsByCategory: (category: string) => Material[];
  getMaterialsByType: (type: string) => Material[];
  
  loadFurnitureLibrary: () => void;
  getFurnitureByCategory: (category: string) => FurnitureItem[];
  getFurnitureBySubcategory: (subcategory: string) => FurnitureItem[];
  searchFurniture: (query: string) => FurnitureItem[];
  toggleFavoriteFurniture: (furnitureId: string) => void;
  toggleFavoriteMaterial: (materialId: string) => void;
  getFavoriteFurniture: () => FurnitureItem[];
  getFavoriteMaterials: () => Material[];
}

// Default templates
const defaultTemplates: ProjectTemplate[] = [
  {
    id: 'casa-2-quartos',
    name: 'Casa 2 Quartos',
    description: 'Casa compacta e funcional com 2 quartos, sala, cozinha e banheiro.',
    thumbnail: '/templates/casa-2q.jpg',
    category: 'residential',
    difficulty: 'beginner',
    terrainSize: { x: 12, y: 15 },
    defaultWallHeight: 2.8,
    rooms: [
      { name: 'Sala', width: 4, depth: 5, position: { x: 0, y: 0 } },
      { name: 'Cozinha', width: 3, depth: 4, position: { x: 4, y: 0 } },
      { name: 'Quarto 1', width: 3, depth: 3.5, position: { x: 0, y: 5 } },
      { name: 'Quarto 2', width: 3, depth: 3.5, position: { x: 3, y: 5 } },
      { name: 'Banheiro', width: 2, depth: 2.5, position: { x: 6, y: 5 } },
    ],
    recommendedStyle: 'moderno',
  },
  {
    id: 'casa-3-quartos',
    name: 'Casa 3 Quartos',
    description: 'Casa familiar espaçosa com 3 quartos, suíte, área de serviço e garagem.',
    thumbnail: '/templates/casa-3q.jpg',
    category: 'residential',
    difficulty: 'intermediate',
    terrainSize: { x: 15, y: 20 },
    defaultWallHeight: 2.8,
    rooms: [
      { name: 'Sala', width: 5, depth: 6, position: { x: 0, y: 0 } },
      { name: 'Cozinha', width: 4, depth: 4, position: { x: 5, y: 0 } },
      { name: 'Suíte', width: 4, depth: 4.5, position: { x: 0, y: 6 } },
      { name: 'Quarto 2', width: 3.5, depth: 3.5, position: { x: 4, y: 6 } },
      { name: 'Quarto 3', width: 3.5, depth: 3.5, position: { x: 7.5, y: 6 } },
      { name: 'Banheiro Social', width: 2.5, depth: 2.5, position: { x: 9, y: 4 } },
      { name: 'Área de Serviço', width: 3, depth: 3, position: { x: 9, y: 0 } },
    ],
    recommendedStyle: 'contemporaneo',
  },
  {
    id: 'casa-area-gourmet',
    name: 'Casa com Área Gourmet',
    description: 'Casa perfeita para receber, com área gourmet integrada à piscina.',
    thumbnail: '/templates/casa-gourmet.jpg',
    category: 'residential',
    difficulty: 'advanced',
    terrainSize: { x: 20, y: 25 },
    defaultWallHeight: 2.8,
    rooms: [
      { name: 'Sala', width: 6, depth: 5, position: { x: 0, y: 0 } },
      { name: 'Cozinha', width: 4, depth: 4, position: { x: 6, y: 0 } },
      { name: 'Área Gourmet', width: 8, depth: 5, position: { x: 0, y: 5 } },
      { name: 'Suíte Master', width: 5, depth: 5, position: { x: 10, y: 0 } },
      { name: 'Quarto 2', width: 4, depth: 4, position: { x: 10, y: 5 } },
      { name: 'Quarto 3', width: 4, depth: 4, position: { x: 14, y: 5 } },
      { name: 'Banheiro Social', width: 3, depth: 2.5, position: { x: 15, y: 0 } },
    ],
    recommendedStyle: 'luxo',
  },
  {
    id: 'studio-compacto',
    name: 'Studio Compacto',
    description: 'Apartamento studio otimizado para vida urbana.',
    thumbnail: '/templates/studio.jpg',
    category: 'apartment',
    difficulty: 'beginner',
    terrainSize: { x: 6, y: 8 },
    defaultWallHeight: 2.7,
    rooms: [
      { name: 'Living', width: 4, depth: 5, position: { x: 0, y: 0 } },
      { name: 'Cozinha', width: 2, depth: 3, position: { x: 4, y: 0 } },
      { name: 'Banheiro', width: 2, depth: 2, position: { x: 4, y: 3 } },
    ],
    recommendedStyle: 'minimalista',
  },
  {
    id: 'sobrado-simples',
    name: 'Sobrado Simples',
    description: 'Sobrado econômico com área social no térreo e quartos no superior.',
    thumbnail: '/templates/sobrado.jpg',
    category: 'residential',
    difficulty: 'intermediate',
    terrainSize: { x: 8, y: 12 },
    defaultWallHeight: 2.8,
    rooms: [
      { name: 'Sala', width: 4, depth: 4, position: { x: 0, y: 0 } },
      { name: 'Cozinha', width: 3, depth: 3, position: { x: 4, y: 0 } },
      { name: 'Banheiro Térreo', width: 1.5, depth: 2, position: { x: 7, y: 0 } },
      { name: 'Quarto 1 Superior', width: 3.5, depth: 3.5, position: { x: 0, y: 6 } },
      { name: 'Quarto 2 Superior', width: 3.5, depth: 3.5, position: { x: 3.5, y: 6 } },
      { name: 'Banheiro Superior', width: 2, depth: 2, position: { x: 7, y: 6 } },
    ],
    recommendedStyle: 'moderno',
  },
];

// Default styles
const defaultStyles: DesignStyle[] = [
  {
    id: 'moderno',
    name: 'Moderno',
    description: 'Linhas limpas, cores neutras e funcionalidade máxima.',
    icon: '🏢',
    colors: {
      primary: '#2C3E50',
      secondary: '#95A5A6',
      accent: '#E74C3C',
      background: '#ECF0F1',
      text: '#2C3E50',
    },
    materials: {
      floor: ['concrete', 'porcelain', 'wood-light'],
      wall: ['white', 'gray', 'concrete'],
      furniture: ['metal', 'glass', 'leather'],
    },
    lighting: {
      intensity: 1.0,
      color: '#fff9e6',
      ambientIntensity: 0.5,
    },
    furnitureCategories: ['minimalist', 'contemporary', 'scandinavian'],
  },
  {
    id: 'minimalista',
    name: 'Minimalista',
    description: 'Menos é mais. Espaços limpos e descomplicados.',
    icon: '◻️',
    colors: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      accent: '#000000',
      background: '#FFFFFF',
      text: '#333333',
    },
    materials: {
      floor: ['white-tile', 'light-wood', 'concrete'],
      wall: ['white', 'off-white'],
      furniture: ['white', 'natural-wood', 'metal'],
    },
    lighting: {
      intensity: 1.2,
      color: '#ffffff',
      ambientIntensity: 0.6,
    },
    furnitureCategories: ['minimalist', 'japandi', 'scandinavian'],
  },
  {
    id: 'rustico',
    name: 'Rústico',
    description: 'Aconchego natural com madeira e pedra.',
    icon: '🪵',
    colors: {
      primary: '#8B4513',
      secondary: '#D2691E',
      accent: '#228B22',
      background: '#F5F5DC',
      text: '#4A3728',
    },
    materials: {
      floor: ['wood-dark', 'stone', 'brick'],
      wall: ['brick', 'stone', 'wood'],
      furniture: ['wood', 'leather', 'wicker'],
    },
    lighting: {
      intensity: 0.8,
      color: '#ffcc80',
      ambientIntensity: 0.4,
    },
    furnitureCategories: ['rustic', 'farmhouse', 'vintage'],
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Estilo urbano com elementos brutos expostos.',
    icon: '🏭',
    colors: {
      primary: '#2C2C2C',
      secondary: '#4A4A4A',
      accent: '#FF6B35',
      background: '#1A1A1A',
      text: '#E0E0E0',
    },
    materials: {
      floor: ['concrete', 'polished-concrete', 'metal'],
      wall: ['brick', 'concrete', 'metal'],
      furniture: ['metal', 'leather', 'reclaimed-wood'],
    },
    lighting: {
      intensity: 0.7,
      color: '#ffaa55',
      ambientIntensity: 0.3,
    },
    furnitureCategories: ['industrial', 'loft', 'vintage'],
  },
  {
    id: 'luxo',
    name: 'Luxo Contemporâneo',
    description: 'Elegância sofisticada com materiais premium.',
    icon: '💎',
    colors: {
      primary: '#1A1A2E',
      secondary: '#16213E',
      accent: '#C9A962',
      background: '#0F0F23',
      text: '#FFFFFF',
    },
    materials: {
      floor: ['marble', 'granite', 'hardwood'],
      wall: ['marble', 'velvet', 'gold-accent'],
      furniture: ['velvet', 'brass', 'marble'],
    },
    lighting: {
      intensity: 0.9,
      color: '#fff8e7',
      ambientIntensity: 0.5,
    },
    furnitureCategories: ['luxury', 'contemporary', 'art-deco'],
  },
];

// Default materials
const defaultMaterials: Material[] = [
  {
    id: 'wood-oak',
    name: 'Carvalho',
    type: 'floor',
    color: '#8B6914',
    properties: { roughness: 0.7, metalness: 0, reflectivity: 0.1, transparency: 0 },
    category: 'wood',
    tags: ['natural', 'warm', 'classic'],
  },
  {
    id: 'wood-walnut',
    name: 'Nogueira',
    type: 'floor',
    color: '#5D4E37',
    properties: { roughness: 0.6, metalness: 0, reflectivity: 0.15, transparency: 0 },
    category: 'wood',
    tags: ['dark', 'elegant', 'premium'],
  },
  {
    id: 'concrete-polished',
    name: 'Concreto Polido',
    type: 'floor',
    color: '#9E9E9E',
    properties: { roughness: 0.3, metalness: 0, reflectivity: 0.3, transparency: 0 },
    category: 'concrete',
    tags: ['modern', 'industrial', 'minimalist'],
  },
  {
    id: 'marble-carrara',
    name: 'Mármore Carrara',
    type: 'floor',
    color: '#F5F5F5',
    properties: { roughness: 0.1, metalness: 0, reflectivity: 0.6, transparency: 0 },
    category: 'stone',
    tags: ['luxury', 'elegant', 'classic'],
  },
  {
    id: 'porcelain-white',
    name: 'Porcelanato Branco',
    type: 'floor',
    color: '#FFFFFF',
    properties: { roughness: 0.2, metalness: 0, reflectivity: 0.4, transparency: 0 },
    category: 'ceramic',
    tags: ['clean', 'modern', 'bright'],
  },
  {
    id: 'brick-exposed',
    name: 'Tijolo Aparente',
    type: 'wall',
    color: '#B7410E',
    properties: { roughness: 0.9, metalness: 0, reflectivity: 0.05, transparency: 0 },
    category: 'brick',
    tags: ['rustic', 'industrial', 'warm'],
  },
  {
    id: 'paint-white',
    name: 'Tinta Branca',
    type: 'wall',
    color: '#FFFFFF',
    properties: { roughness: 0.8, metalness: 0, reflectivity: 0.1, transparency: 0 },
    category: 'paint',
    tags: ['clean', 'neutral', 'versatile'],
  },
  {
    id: 'glass-clear',
    name: 'Vidro Transparente',
    type: 'furniture',
    color: '#FFFFFF',
    properties: { roughness: 0, metalness: 0, reflectivity: 0.9, transparency: 0.9 },
    category: 'glass',
    tags: ['modern', 'elegant', 'transparent'],
  },
  {
    id: 'metal-brushed',
    name: 'Metal Escovado',
    type: 'furniture',
    color: '#C0C0C0',
    properties: { roughness: 0.3, metalness: 0.8, reflectivity: 0.7, transparency: 0 },
    category: 'metal',
    tags: ['industrial', 'modern', 'durable'],
  },
  {
    id: 'velvet-navy',
    name: 'Veludo Azul Marinho',
    type: 'furniture',
    color: '#1A237E',
    properties: { roughness: 0.9, metalness: 0, reflectivity: 0.1, transparency: 0 },
    category: 'fabric',
    tags: ['luxury', 'soft', 'elegant'],
  },
];

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: defaultTemplates,
      selectedTemplate: null,
      
      styles: defaultStyles,
      selectedStyle: null,
      
      materials: defaultMaterials,
      selectedMaterial: null,
      materialCategories: ['wood', 'stone', 'ceramic', 'concrete', 'metal', 'glass', 'fabric', 'paint'],
      
      furnitureLibrary: [],
      furnitureCategories: [],
      
      favoriteFurniture: [],
      favoriteMaterials: [],
      
      loadTemplates: () => set({ templates: defaultTemplates }),
      
      selectTemplate: (template) => set({ selectedTemplate: template }),
      
      applyTemplate: (templateId) => {
        const template = get().templates.find((t) => t.id === templateId);
        return template || defaultTemplates[0];
      },
      
      loadStyles: () => set({ styles: defaultStyles }),
      
      selectStyle: (style) => set({ selectedStyle: style }),
      
      applyStyle: (styleId) => {
        const style = get().styles.find((s) => s.id === styleId);
        return style || null;
      },
      
      loadMaterials: () => set({ materials: defaultMaterials }),
      
      selectMaterial: (material) => set({ selectedMaterial: material }),
      
      getMaterialsByCategory: (category) => {
        return get().materials.filter((m) => m.category === category);
      },
      
      getMaterialsByType: (type) => {
        return get().materials.filter((m) => m.type === type);
      },
      
      loadFurnitureLibrary: () => {
        // Will be populated from furnitureLibrary.ts
      },
      
      getFurnitureByCategory: (category) => {
        return get().furnitureLibrary.filter((f) => f.category === category);
      },
      
      getFurnitureBySubcategory: (subcategory) => {
        return get().furnitureLibrary.filter((f) => f.subcategory === subcategory);
      },
      
      searchFurniture: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().furnitureLibrary.filter(
          (f) =>
            f.name.toLowerCase().includes(lowerQuery) ||
            f.tags.some((t) => t.toLowerCase().includes(lowerQuery))
        );
      },
      
      toggleFavoriteFurniture: (furnitureId) =>
        set((state) => ({
          favoriteFurniture: state.favoriteFurniture.includes(furnitureId)
            ? state.favoriteFurniture.filter((id) => id !== furnitureId)
            : [...state.favoriteFurniture, furnitureId],
        })),
      
      toggleFavoriteMaterial: (materialId) =>
        set((state) => ({
          favoriteMaterials: state.favoriteMaterials.includes(materialId)
            ? state.favoriteMaterials.filter((id) => id !== materialId)
            : [...state.favoriteMaterials, materialId],
        })),
      
      getFavoriteFurniture: () => {
        return get().furnitureLibrary.filter((f) =>
          get().favoriteFurniture.includes(f.id)
        );
      },
      
      getFavoriteMaterials: () => {
        return get().materials.filter((m) =>
          get().favoriteMaterials.includes(m.id)
        );
      },
    }),
    {
      name: 'casapro-templates',
      partialize: (state) => ({
        favoriteFurniture: state.favoriteFurniture,
        favoriteMaterials: state.favoriteMaterials,
        selectedStyle: state.selectedStyle,
      }),
    }
  )
);
