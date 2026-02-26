import { create } from 'zustand';
import type { AdminStats, AdminUser, ContentManagement, FurnitureItem, Material, DesignStyle, ProjectTemplate } from '@/types';

interface AdminState {
  // Auth
  isAdmin: boolean;
  adminToken: string | null;
  
  // Stats
  stats: AdminStats | null;
  
  // Content Management
  content: ContentManagement;
  
  // Users
  users: AdminUser[];
  
  // Actions
  loginAsAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  
  // Stats
  loadStats: () => Promise<void>;
  
  // Furniture Management
  addFurniture: (furniture: Omit<FurnitureItem, 'id'>) => Promise<FurnitureItem>;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => Promise<boolean>;
  deleteFurniture: (id: string) => Promise<boolean>;
  
  // Material Management
  addMaterial: (material: Omit<Material, 'id'>) => Promise<Material>;
  updateMaterial: (id: string, updates: Partial<Material>) => Promise<boolean>;
  deleteMaterial: (id: string) => Promise<boolean>;
  
  // Style Management
  addStyle: (style: Omit<DesignStyle, 'id'>) => Promise<DesignStyle>;
  updateStyle: (id: string, updates: Partial<DesignStyle>) => Promise<boolean>;
  deleteStyle: (id: string) => Promise<boolean>;
  
  // Template Management
  addTemplate: (template: Omit<ProjectTemplate, 'id'>) => Promise<ProjectTemplate>;
  updateTemplate: (id: string, updates: Partial<ProjectTemplate>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  
  // User Management
  loadUsers: () => Promise<void>;
  updateUserPlan: (userId: string, planId: string) => Promise<boolean>;
  deactivateUser: (userId: string) => Promise<boolean>;
  reactivateUser: (userId: string) => Promise<boolean>;
  
  // Feature Flags
  featureFlags: Record<string, boolean>;
  toggleFeature: (feature: string) => void;
  
  // Plan Limits
  updatePlanLimit: (planId: string, limit: string, value: number) => void;
}

const defaultStats: AdminStats = {
  totalUsers: 1250,
  activeUsers: 890,
  totalProjects: 3450,
  premiumUsers: 180,
  revenue: 8950.5,
  popularFeatures: ['3D View', 'AI Assistant', 'Furniture Library', 'Export PDF'],
  systemHealth: {
    status: 'healthy',
    uptime: 99.98,
    responseTime: 120,
  },
};

const defaultContent: ContentManagement = {
  furniture: [],
  materials: [],
  styles: [],
  templates: [],
};

const defaultFeatureFlags: Record<string, boolean> = {
  'ai-assistant': true,
  '3d-rendering': true,
  'export-pdf': true,
  'export-glb': true,
  'premium-materials': true,
  'collaboration': false,
  'vr-view': false,
  'ar-placement': false,
};

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: false,
  adminToken: null,
  
  stats: defaultStats,
  
  content: defaultContent,
  
  users: [],
  
  featureFlags: defaultFeatureFlags,
  
  loginAsAdmin: async (password) => {
    // Simple admin auth - in production, use proper authentication
    if (password === 'admin-casapro-2024') {
      const token = 'admin-token-' + Math.random().toString(36).substr(2);
      set({ isAdmin: true, adminToken: token });
      return true;
    }
    return false;
  },
  
  logoutAdmin: () => {
    set({ isAdmin: false, adminToken: null });
  },
  
  loadStats: async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ stats: defaultStats });
  },
  
  // Furniture Management
  addFurniture: async (furniture) => {
    const newFurniture: FurnitureItem = {
      ...furniture,
      id: 'furniture-' + Math.random().toString(36).substr(2, 9),
    };
    
    set((state) => ({
      content: {
        ...state.content,
        furniture: [...state.content.furniture, newFurniture],
      },
    }));
    
    return newFurniture;
  },
  
  updateFurniture: async (id, updates) => {
    set((state) => ({
      content: {
        ...state.content,
        furniture: state.content.furniture.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      },
    }));
    return true;
  },
  
  deleteFurniture: async (id) => {
    set((state) => ({
      content: {
        ...state.content,
        furniture: state.content.furniture.filter((f) => f.id !== id),
      },
    }));
    return true;
  },
  
  // Material Management
  addMaterial: async (material) => {
    const newMaterial: Material = {
      ...material,
      id: 'material-' + Math.random().toString(36).substr(2, 9),
    };
    
    set((state) => ({
      content: {
        ...state.content,
        materials: [...state.content.materials, newMaterial],
      },
    }));
    
    return newMaterial;
  },
  
  updateMaterial: async (id, updates) => {
    set((state) => ({
      content: {
        ...state.content,
        materials: state.content.materials.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      },
    }));
    return true;
  },
  
  deleteMaterial: async (id) => {
    set((state) => ({
      content: {
        ...state.content,
        materials: state.content.materials.filter((m) => m.id !== id),
      },
    }));
    return true;
  },
  
  // Style Management
  addStyle: async (style) => {
    const newStyle: DesignStyle = {
      ...style,
      id: 'style-' + Math.random().toString(36).substr(2, 9),
    };
    
    set((state) => ({
      content: {
        ...state.content,
        styles: [...state.content.styles, newStyle],
      },
    }));
    
    return newStyle;
  },
  
  updateStyle: async (id, updates) => {
    set((state) => ({
      content: {
        ...state.content,
        styles: state.content.styles.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    }));
    return true;
  },
  
  deleteStyle: async (id) => {
    set((state) => ({
      content: {
        ...state.content,
        styles: state.content.styles.filter((s) => s.id !== id),
      },
    }));
    return true;
  },
  
  // Template Management
  addTemplate: async (template) => {
    const newTemplate: ProjectTemplate = {
      ...template,
      id: 'template-' + Math.random().toString(36).substr(2, 9),
    };
    
    set((state) => ({
      content: {
        ...state.content,
        templates: [...state.content.templates, newTemplate],
      },
    }));
    
    return newTemplate;
  },
  
  updateTemplate: async (id, updates) => {
    set((state) => ({
      content: {
        ...state.content,
        templates: state.content.templates.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      },
    }));
    return true;
  },
  
  deleteTemplate: async (id) => {
    set((state) => ({
      content: {
        ...state.content,
        templates: state.content.templates.filter((t) => t.id !== id),
      },
    }));
    return true;
  },
  
  // User Management
  loadUsers: async () => {
    // Mock users
    const mockUsers: AdminUser[] = [
      {
        id: 'user-1',
        email: 'joao@email.com',
        name: 'João Silva',
        plan: 'pro',
        projectsCount: 2,
        maxProjects: 50,
        projects: ['proj-1', 'proj-2'],
        favorites: { furniture: [], materials: [], styles: [] },
        settings: {} as any,
        createdAt: new Date('2024-01-15'),
        lastLoginAt: new Date(),
        isAdmin: false,
        permissions: [],
      },
      {
        id: 'user-2',
        email: 'maria@email.com',
        name: 'Maria Santos',
        plan: 'free',
        projectsCount: 1,
        maxProjects: 3,
        projects: ['proj-3'],
        favorites: { furniture: [], materials: [], styles: [] },
        settings: {} as any,
        createdAt: new Date('2024-02-20'),
        lastLoginAt: new Date(),
        isAdmin: false,
        permissions: [],
      },
    ];
    
    set({ users: mockUsers });
  },
  
  updateUserPlan: async (userId, planId) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, plan: planId as any } : u
      ),
    }));
    return true;
  },
  
  deactivateUser: async (userId) => {
    // In a real app, this would deactivate the user account
    console.log('Deactivating user:', userId);
    return true;
  },
  
  reactivateUser: async (userId) => {
    console.log('Reactivating user:', userId);
    return true;
  },
  
  toggleFeature: (feature) => {
    set((state) => ({
      featureFlags: {
        ...state.featureFlags,
        [feature]: !state.featureFlags[feature],
      },
    }));
  },
  
  updatePlanLimit: (planId, limit, value) => {
    // This would update plan limits in the database
    console.log('Updating plan limit:', planId, limit, value);
  },
}));
