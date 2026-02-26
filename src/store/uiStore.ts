import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState, ViewMode, CameraMode3D, LightingSettings } from '@/types';

interface UIStateExtended extends UIState {
  // View modes
  viewMode: ViewMode;
  cameraMode3D: CameraMode3D;
  previousViewMode: ViewMode;
  
  // Lighting
  lighting: LightingSettings;
  
  // Canvas state
  canvas2D: {
    scale: number;
    offset: { x: number; y: number };
    showGrid: boolean;
    showAxes: boolean;
    snapToGrid: boolean;
    snapToAngle: boolean;
    gridSize: number;
  };
  
  // Selection
  selectedTool: string;
  hoveredElement: string | null;
  
  // Modals
  modals: {
    createProject: boolean;
    settings: boolean;
    export: boolean;
    share: boolean;
    help: boolean;
    shortcuts: boolean;
  };
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration: number;
  }>;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setCameraMode3D: (mode: CameraMode3D) => void;
  toggleViewMode: () => void;
  
  setPanel: (panel: string, visible: boolean) => void;
  togglePanel: (panel: string) => void;
  toggleSidebar: () => void;
  
  setCanvasScale: (scale: number) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  resetCanvasView: () => void;
  
  setSelectedTool: (tool: string) => void;
  setHoveredElement: (id: string | null) => void;
  
  updateLighting: (settings: Partial<LightingSettings>) => void;
  setTimeOfDay: (hour: number) => void;
  toggleDayNight: () => void;
  
  openModal: (modal: keyof UIStateExtended['modals']) => void;
  closeModal: (modal: keyof UIStateExtended['modals']) => void;
  closeAllModals: () => void;
  
  addNotification: (notification: Omit<UIStateExtended['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  toggleSetting: (key: keyof UIState) => void;
}

const defaultLighting: LightingSettings = {
  ambientIntensity: 0.6,
  ambientColor: '#ffffff',
  sunPosition: { x: 50, y: 100, z: 50 },
  sunIntensity: 1.6,
  sunColor: '#fff9e6',
  shadowsEnabled: true,
  shadowQuality: 'high',
  timeOfDay: 12,
  exposure: 1.3,
  fogEnabled: false,
  fogDensity: 0.01,
  fogColor: '#e8e8e8',
};

export const useUIStore = create<UIStateExtended>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      sidebarWidth: 280,
      activePanel: null,
      panels: {
        furniture: false,
        properties: false,
        layers: false,
        materials: false,
        ai: false,
      },
      tooltipsEnabled: true,
      animationsEnabled: true,
      reducedMotion: false,
      
      viewMode: '2d',
      cameraMode3D: 'orbit',
      previousViewMode: '2d',
      
      lighting: defaultLighting,
      
      canvas2D: {
        scale: 20,
        offset: { x: 0, y: 0 },
        showGrid: true,
        showAxes: true,
        snapToGrid: true,
        snapToAngle: true,
        gridSize: 0.5,
      },
      
      selectedTool: 'select',
      hoveredElement: null,
      
      modals: {
        createProject: false,
        settings: false,
        export: false,
        share: false,
        help: false,
        shortcuts: false,
      },
      
      notifications: [],
      
      // Actions
      setViewMode: (mode) => set((state) => ({
        viewMode: mode,
        previousViewMode: state.viewMode,
      })),
      
      setCameraMode3D: (mode) => set({ cameraMode3D: mode }),
      
      toggleViewMode: () => set((state) => ({
        viewMode: state.viewMode === '2d' ? '3d' : '2d',
        previousViewMode: state.viewMode,
      })),
      
      setPanel: (panel, visible) => set((state) => ({
        panels: { ...state.panels, [panel]: visible },
        activePanel: visible ? panel : state.activePanel === panel ? null : state.activePanel,
      })),
      
      togglePanel: (panel) => set((state) => ({
        panels: { ...state.panels, [panel]: !state.panels[panel as keyof typeof state.panels] },
        activePanel: state.panels[panel as keyof typeof state.panels] ? null : panel,
      })),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setCanvasScale: (scale) => set((state) => ({
        canvas2D: { ...state.canvas2D, scale: Math.max(1, Math.min(200, scale)) },
      })),
      
      setCanvasOffset: (offset) => set((state) => ({
        canvas2D: { ...state.canvas2D, offset },
      })),
      
      resetCanvasView: () => set((state) => ({
        canvas2D: { ...state.canvas2D, scale: 20, offset: { x: 0, y: 0 } },
      })),
      
      setSelectedTool: (tool) => set({ selectedTool: tool }),
      
      setHoveredElement: (id) => set({ hoveredElement: id }),
      
      updateLighting: (settings) => set((state) => ({
        lighting: { ...state.lighting, ...settings },
      })),
      
      setTimeOfDay: (hour) => {
        const normalizedHour = Math.max(0, Math.min(24, hour));
        const angle = (normalizedHour - 6) * (Math.PI / 12); // 6am = 0, 6pm = PI
        const sunX = Math.cos(angle) * 100;
        const sunY = Math.sin(angle) * 100;
        
        set((state) => ({
          lighting: {
            ...state.lighting,
            timeOfDay: normalizedHour,
            sunPosition: { x: sunX, y: Math.max(10, sunY), z: 50 },
            sunIntensity: normalizedHour >= 6 && normalizedHour <= 18 ? 1.2 : 0.1,
            ambientIntensity: normalizedHour >= 6 && normalizedHour <= 18 ? 0.4 : 0.1,
          },
        }));
      },
      
      toggleDayNight: () => {
        const currentHour = get().lighting.timeOfDay;
        const newHour = currentHour >= 6 && currentHour <= 18 ? 22 : 12;
        get().setTimeOfDay(newHour);
      },
      
      openModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: true },
      })),
      
      closeModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: false },
      })),
      
      closeAllModals: () => set({
        modals: {
          createProject: false,
          settings: false,
          export: false,
          share: false,
          help: false,
          shortcuts: false,
        },
      }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          ...state.notifications,
          { ...notification, id: Math.random().toString(36).substr(2, 9) },
        ],
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      toggleSetting: (key) => set((state) => ({ [key]: !state[key] })),
    }),
    {
      name: 'casapro-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        tooltipsEnabled: state.tooltipsEnabled,
        animationsEnabled: state.animationsEnabled,
        reducedMotion: state.reducedMotion,
        canvas2D: state.canvas2D,
        lighting: state.lighting,
      }),
    }
  )
);
