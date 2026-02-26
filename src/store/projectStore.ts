import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Project, 
  Wall, 
  Room, 
  Door, 
  Window, 
  Furniture, 
  Point, 
  ToolMode, 
  ViewMode,
  ProjectSettings,
  AIRecommendation 
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ProjectState {
  // Projeto atual
  currentProject: Project | null;
  
  // Modos de trabalho
  toolMode: ToolMode;
  viewMode: ViewMode;
  
  // Estado de seleção
  selectedElement: string | null;
  selectedElementType: 'wall' | 'room' | 'door' | 'window' | 'furniture' | null;
  
  // Histórico para undo/redo
  history: Project[];
  historyIndex: number;
  
  // Estado de desenho
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  
  // Categoria de móveis selecionada
  selectedFurnitureCategory: string | null;
  selectedFurnitureItem: string | null;
  
  // Recomendações da IA
  aiRecommendations: AIRecommendation[];
  isAILoading: boolean;
  
  // Ações
  createProject: (name: string, description?: string) => void;
  loadProject: (project: Project) => void;
  updateProject: (updates: Partial<Project>) => void;
  saveProject: () => void;
  
  // Ferramentas
  setToolMode: (mode: ToolMode) => void;
  setViewMode: (mode: ViewMode) => void;
  
  // Desenho
  startDrawing: (point: Point) => void;
  updateDrawing: (point: Point) => void;
  endDrawing: (point?: Point) => void;
  
  // Paredes
  addWall: (wall: Omit<Wall, 'id'>) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  deleteWall: (id: string) => void;
  
  // Cômodos
  addRoom: (room: Omit<Room, 'id' | 'area'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  
  // Portas
  addDoor: (door: Omit<Door, 'id'>) => void;
  updateDoor: (id: string, updates: Partial<Door>) => void;
  deleteDoor: (id: string) => void;
  
  // Janelas
  addWindow: (window: Omit<Window, 'id'>) => void;
  updateWindow: (id: string, updates: Partial<Window>) => void;
  deleteWindow: (id: string) => void;
  
  // Móveis
  addFurniture: (furniture: Omit<Furniture, 'id'>) => void;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;
  deleteFurniture: (id: string) => void;
  setSelectedFurnitureCategory: (category: string | null) => void;
  setSelectedFurnitureItem: (item: string | null) => void;
  
  // Seleção
  selectElement: (id: string | null, type?: 'wall' | 'room' | 'door' | 'window' | 'furniture') => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  addToHistory: () => void;
  
  // IA
  generateAIRecommendations: (prompt: string) => Promise<void>;
  applyAIRecommendation: (recommendation: AIRecommendation) => void;
  clearAIRecommendations: () => void;
}

const defaultSettings: ProjectSettings = {
  unit: 'meters',
  gridSize: 0.5,
  snapToGrid: true,
  snapToAngle: true,
  snapAngles: [0, 45, 90, 135, 180],
  showMeasurements: true,
  showGrid: true,
  showAxes: true,
  defaultWallHeight: 2.8,
  defaultWallThickness: 0.15,
  defaultFloorMaterial: 'ceramic',
  defaultWallMaterial: 'plaster',
  terrainSize: { x: 10, y: 10 },
  layers: [
    { id: 'layer-1', name: 'Padrão', visible: true, locked: false, color: '#000000', opacity: 1, type: 'custom' },
  ],
};

const createEmptyProject = (name: string, description: string = ''): Project => ({
  id: uuidv4(),
  name,
  description,
  createdAt: new Date(),
  updatedAt: new Date(),
  walls: [],
  rooms: [],
  doors: [],
  windows: [],
  furniture: [],
  exterior: {
    facadeMaterial: 'concrete',
    facadeColor: '#FFFFFF',
    roofType: 'flat',
    roofColor: '#333333',
    roofMaterial: 'tiles',
    hasGarage: false,
    hasPool: false,
    hasGarden: false,
    terrainShape: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 30 }, { x: 0, y: 30 }],
    terrainSize: { x: 20, y: 30 },
  },
  settings: defaultSettings,
  isTemplate: false,
  isPublic: false,
  version: 1,
  tags: [],
});

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      toolMode: 'select',
      viewMode: '2d',
      selectedElement: null,
      selectedElementType: null,
      history: [],
      historyIndex: -1,
      isDrawing: false,
      drawStart: null,
      drawCurrent: null,
      selectedFurnitureCategory: null,
      selectedFurnitureItem: null,
      aiRecommendations: [],
      isAILoading: false,

      createProject: (name, description = '') => {
        const project = createEmptyProject(name, description);
        set({ 
          currentProject: project, 
          history: [project], 
          historyIndex: 0,
          selectedElement: null,
          selectedElementType: null,
        });
      },

      loadProject: (project) => {
        set({ 
          currentProject: project, 
          history: [project], 
          historyIndex: 0,
          selectedElement: null,
          selectedElementType: null,
        });
      },

      updateProject: (updates) => {
        const { currentProject } = get();
        if (!currentProject) return;
        
        const updated = { 
          ...currentProject, 
          ...updates, 
          updatedAt: new Date() 
        };
        set({ currentProject: updated });
      },

      saveProject: () => {
        const { addToHistory } = get();
        addToHistory();
      },

      setToolMode: (mode) => set({ toolMode: mode }),
      setViewMode: (mode) => set({ viewMode: mode }),

      startDrawing: (point) => set({ 
        isDrawing: true, 
        drawStart: point, 
        drawCurrent: point 
      }),

      updateDrawing: (point) => set({ drawCurrent: point }),

      endDrawing: (point) => {
        const { isDrawing, drawStart, toolMode } = get();
        if (!isDrawing || !drawStart) return;

        const endPoint = point || get().drawCurrent;
        if (!endPoint) return;

        // Adicionar elemento baseado na ferramenta atual
        if (toolMode === 'wall') {
          get().addWall({
            start: drawStart,
            end: endPoint,
            thickness: 0.15,
            height: 2.8,
            color: '#2a2a2a',
          });
        }

        set({ 
          isDrawing: false, 
          drawStart: null, 
          drawCurrent: null 
        });
      },

      addWall: (wall) => {
        const { currentProject, addToHistory } = get();
        if (!currentProject) return;

        const newWall: Wall = { ...wall, id: uuidv4() };
        const updated = {
          ...currentProject,
          walls: [...currentProject.walls, newWall],
        };
        set({ currentProject: updated });
        addToHistory();
      },

      updateWall: (id, updates) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updated = {
          ...currentProject,
          walls: currentProject.walls.map(w => 
            w.id === id ? { ...w, ...updates } : w
          ),
        };
        set({ currentProject: updated });
      },

      deleteWall: (id) => {
        const { currentProject, addToHistory } = get();
        if (!currentProject) return;

        const updated = {
          ...currentProject,
          walls: currentProject.walls.filter(w => w.id !== id),
        };
        set({ currentProject: updated });
        addToHistory();
      },

      addRoom: (room) => {
        const { currentProject, addToHistory } = get();
        if (!currentProject) return;

        // Calcular área do polígono
        const area = calculatePolygonArea(room.points);
        const newRoom: Room = { ...room, id: uuidv4(), area };
        
        const updated = {
          ...currentProject,
          rooms: [...currentProject.rooms, newRoom],
        };
        set({ currentProject: updated });
        addToHistory();
      },

      updateRoom: (id, updates) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updated = {
          ...currentProject,
          rooms: currentProject.rooms.map(r => {
            if (r.id !== id) return r;
            const newRoom = { ...r, ...updates };
            if (updates.points) {
              newRoom.area = calculatePolygonArea(updates.points);
            }
            return newRoom;
          }),
        };
        set({ currentProject: updated });
      },

      deleteRoom: (id) => {
        const { currentProject, addToHistory } = get();
        if (!currentProject) return;

        const updated = {
          ...currentProject,
          rooms: currentProject.rooms.filter(r => r.id !== id),
        };
        set({ currentProject: updated });
        addToHistory();
      },

      addDoor: (door) => {
        const { currentProject, addToHistory } = get();
        if (!currentProject) return;

        const newDoor: Door = { ...door, id: uuidv4() };
        const updated = {
          ...currentProject,
          doors: [...currentProject.doors, newDoor],
        };
        set({ currentProject: updated });
        addToHistory();
      },

      updateDoor: (id, updates) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updated = {
          ...currentProject,
          doors: currentProject.doors.map(d => 
            d.id === id ? { ...d, ...updates } : d
          ),
        };
        set({ currentProject: updated });
      },

      deleteDoor: (id) => {
        const { currentProject, addToHistory } = get();
        if (!currentProject) return;

        const updated = {
          ...currentProject,
          doors: currentProject.doors.filter(d => d.id !== id),
        };
        set({ currentProject: updated });
        addToHistory();
      },

      addWindow: (window) => {
        const { currentProject, addToHistory } = get();
        if (!currentProject) return;

        const newWindow: Window = { ...window, id: uuidv4() };
        const updated = {
          ...currentProject,
          windows: [...currentProject.windows, newWindow],
        };
        set({ currentProject: updated });
        addToHistory();
      },

      updateWindow: (id, updates) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updated = {
          ...currentProject,
          windows: currentProject.windows.map(w => 
            w.id === id ? { ...w, ...updates } : w
          ),
        };
        set({ currentProject: updated });
      },

      deleteWindow: (id) => {
        const { currentProject, addToHistory } = get();
        if (!currentProject) return;

        const updated = {
          ...currentProject,
          windows: currentProject.windows.filter(w => w.id !== id),
        };
        set({ currentProject: updated });
        addToHistory();
      },

      addFurniture: (furniture) => {
        const { currentProject, addToHistory } = get();
        if (!currentProject) return;

        const newFurniture: Furniture = { ...furniture, id: uuidv4() };
        const updated = {
          ...currentProject,
          furniture: [...currentProject.furniture, newFurniture],
        };
        set({ currentProject: updated });
        addToHistory();
      },

      updateFurniture: (id, updates) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updated = {
          ...currentProject,
          furniture: currentProject.furniture.map(f => 
            f.id === id ? { ...f, ...updates } : f
          ),
        };
        set({ currentProject: updated });
      },

      deleteFurniture: (id) => {
        const { currentProject, addToHistory } = get();
        if (!currentProject) return;

        const updated = {
          ...currentProject,
          furniture: currentProject.furniture.filter(f => f.id !== id),
        };
        set({ currentProject: updated });
        addToHistory();
      },

      setSelectedFurnitureCategory: (category) => set({ 
        selectedFurnitureCategory: category,
        selectedFurnitureItem: null,
      }),

      setSelectedFurnitureItem: (item) => set({ selectedFurnitureItem: item }),

      selectElement: (id, type) => set({ 
        selectedElement: id, 
        selectedElementType: type || null 
      }),

      addToHistory: () => {
        const { currentProject, history, historyIndex } = get();
        if (!currentProject) return;

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ ...currentProject });
        
        // Limitar histórico a 50 estados
        if (newHistory.length > 50) {
          newHistory.shift();
        }

        set({ 
          history: newHistory, 
          historyIndex: newHistory.length - 1 
        });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({ 
            currentProject: { ...history[newIndex] },
            historyIndex: newIndex 
          });
        }
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({ 
            currentProject: { ...history[newIndex] },
            historyIndex: newIndex 
          });
        }
      },

      generateAIRecommendations: async () => {
        set({ isAILoading: true, aiRecommendations: [] });
        
        // Simular chamada à API de IA
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const recommendations: AIRecommendation[] = [
          {
            id: uuidv4(),
            type: 'layout',
            title: 'Layout Otimizado',
            description: 'Baseado no seu pedido, sugerimos este arranjo de cômodos:',
            confidence: 0.85,
            data: {
              rooms: [
                { name: 'Sala de Estar', width: 4, depth: 5 },
                { name: 'Cozinha', width: 3, depth: 4 },
                { name: 'Quarto Principal', width: 3.5, depth: 4 },
                { name: 'Quarto 2', width: 3, depth: 3.5 },
                { name: 'Banheiro', width: 2, depth: 2.5 },
              ]
            } as any,
            applied: false,
            timestamp: new Date(),
          },
          {
            id: uuidv4(),
            type: 'style',
            title: 'Estilo Moderno Minimalista',
            description: 'Cores neutras, linhas limpas e funcionalidade máxima.',
            confidence: 0.9,
            data: {
              colors: ['#FFFFFF', '#E8E8E8', '#333333', '#C9A962'],
              materials: ['concrete', 'wood', 'glass'],
            } as any,
            applied: false,
            timestamp: new Date(),
          },
          {
            id: uuidv4(),
            type: 'furniture',
            title: 'Mobiliário Sugerido',
            description: 'Peças que combinam com o estilo moderno:',
            confidence: 0.8,
            data: {
              items: [
                { type: 'sofa', style: 'modern', color: 'gray' },
                { type: 'dining_table', style: 'minimalist', material: 'wood' },
                { type: 'bed', size: 'queen', style: 'modern' },
              ]
            } as any,
            applied: false,
            timestamp: new Date(),
          }
        ];
        
        set({ 
          aiRecommendations: recommendations, 
          isAILoading: false 
        });
      },

      applyAIRecommendation: () => {
        // Implementação da aplicação de recomendações
      },

      clearAIRecommendations: () => set({ aiRecommendations: [] }),
    }),
    {
      name: 'casapro-projects',
      partialize: (state) => ({ 
        currentProject: state.currentProject,
      }),
    }
  )
);

// Função auxiliar para calcular área de polígono
function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area) / 2;
}
