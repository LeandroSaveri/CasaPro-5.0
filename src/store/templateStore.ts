// ============================================
// ARQUIVO 4: src/store/templateStore.ts
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectTemplate, DesignStyle } from '@/types';

interface TemplateState {
  templates: ProjectTemplate[];
  styles: DesignStyle[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTemplates: () => Promise<void>;
  loadStyles: () => Promise<void>;
  addTemplate: (template: ProjectTemplate) => void;
  removeTemplate: (id: string) => void;
  addStyle: (style: DesignStyle) => void;
  removeStyle: (id: string) => void;
}

const defaultTemplates: ProjectTemplate[] = [
  {
    id: 'template-1',
    name: 'Casa Compacta',
    description: 'Casa pequena e funcional, ideal para terrenos estreitos',
    icon: '🏠',
    rooms: 3,
    area: 60,
    terrainSize: { x: 6, y: 10 },
    defaultWallHeight: 2.6,
    defaultWallThickness: 0.12,
    category: 'residential',
    tags: ['compacto', 'econômico', 'moderno'],
  },
  {
    id: 'template-2',
    name: 'Casa Familiar',
    description: 'Casa espaçosa com área de lazer e quintal',
    icon: '🏡',
    rooms: 5,
    area: 150,
    terrainSize: { x: 12, y: 15 },
    defaultWallHeight: 2.8,
    defaultWallThickness: 0.15,
    category: 'residential',
    tags: ['familiar', 'espaçoso', 'conforto'],
  },
  {
    id: 'template-3',
    name: 'Apartamento Studio',
    description: 'Layout aberto integrando sala, cozinha e quarto',
    icon: '🏢',
    rooms: 1,
    area: 45,
    terrainSize: { x: 5, y: 9 },
    defaultWallHeight: 2.7,
    defaultWallThickness: 0.10,
    category: 'apartment',
    tags: ['studio', 'moderno', 'compacto'],
  },
  {
    id: 'template-4',
    name: 'Escritório Comercial',
    description: 'Espaço profissional com salas de reunião e área aberta',
    icon: '🏛️',
    rooms: 4,
    area: 120,
    terrainSize: { x: 10, y: 12 },
    defaultWallHeight: 3.0,
    defaultWallThickness: 0.12,
    category: 'commercial',
    tags: ['comercial', 'profissional', 'moderno'],
  },
];

const defaultStyles: DesignStyle[] = [
  {
    id: 'style-1',
    name: 'Moderno Minimalista',
    description: 'Linhas limpas, poucos adornos, funcionalidade em primeiro lugar',
    icon: '⬜',
    tags: ['minimalista', 'limpo', 'funcional', 'moderno'],
    colors: ['#FFFFFF', '#000000', '#808080'],
    materials: ['concreto', 'vidro', 'aço'],
  },
  {
    id: 'style-2',
    name: 'Clássico Tradicional',
    description: 'Elegância atemporal com detalhes sofisticados',
    icon: '🏛️',
    tags: ['clássico', 'elegante', 'sofisticado', 'tradicional'],
    colors: ['#8B4513', '#DAA520', '#F5F5DC'],
    materials: ['madeira', 'mármore', 'tecido'],
  },
  {
    id: 'style-3',
    name: 'Industrial',
    description: 'Estética urbana com elementos brutos e expostos',
    icon: '🏭',
    tags: ['industrial', 'urbano', 'brutalista', 'moderno'],
    colors: ['#4A4A4A', '#8B0000', '#C0C0C0'],
    materials: ['tijolo', 'metal', 'concreto'],
  },
  {
    id: 'style-4',
    name: 'Escandinavo',
    description: 'Conforto acolhedor com madeira clara e tons neutros',
    icon: '🌲',
    tags: ['escandinavo', 'acolhedor', 'natural', 'claro'],
    colors: ['#F0F0F0', '#D2B48C', '#FFFFFF'],
    materials: ['madeira clara', 'lã', 'linho'],
  },
  {
    id: 'style-5',
    name: 'Tropical',
    description: 'Ambiente fresco com elementos naturais e ventilação',
    icon: '🌴',
    tags: ['tropical', 'natural', 'fresco', 'verde'],
    colors: ['#228B22', '#F5DEB3', '#87CEEB'],
    materials: ['bambu', 'palha', 'madeira'],
  },
];

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: defaultTemplates,
      styles: defaultStyles,
      isLoading: false,
      error: null,

      loadTemplates: async () => {
        set({ isLoading: true, error: null });
        try {
          // Aqui você pode carregar da API no futuro
          // Por enquanto usa os templates padrão
          set({ isLoading: false });
        } catch (err) {
          set({ error: 'Erro ao carregar templates', isLoading: false });
        }
      },

      loadStyles: async () => {
        set({ isLoading: true, error: null });
        try {
          // Aqui você pode carregar da API no futuro
          set({ isLoading: false });
        } catch (err) {
          set({ error: 'Erro ao carregar estilos', isLoading: false });
        }
      },

      addTemplate: (template) => {
        set((state) => ({
          templates: [...state.templates, template],
        }));
      },

      removeTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      addStyle: (style) => {
        set((state) => ({
          styles: [...state.styles, style],
        }));
      },

      removeStyle: (id) => {
        set((state) => ({
          styles: state.styles.filter((s) => s.id !== id),
        }));
      },
    }),
    {
      name: 'template-storage',
      partialize: (state) => ({ templates: state.templates, styles: state.styles }),
    }
  )
);

export default useTemplateStore;
