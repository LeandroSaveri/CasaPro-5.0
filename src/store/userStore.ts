import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserSettings, Plan, Project } from '@/types';
import { authService } from '../services/authService';
import { cloudService } from '../services/cloudService';

interface UserState {
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  
  // Plans
  plans: Plan[];
  currentPlan: Plan | null;
  
  // Projects list
  userProjects: Project[];
  
  // Cloud sync
  isSyncing: boolean;
  lastSync: Date | null;
  pendingSyncCount: number;
  
  // Usage stats
  usage: {
    projectsCount: number;
    exportsThisMonth: number;
    rendersThisMonth: number;
    storageUsed: number;
    aiRequestsThisMonth: number;
  };
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  updateSettings: (settings: Partial<UserSettings>) => void;
  
  loadPlans: () => void;
  subscribeToPlan: (planId: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  
  loadUserProjects: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<boolean>;
  duplicateProject: (projectId: string) => Promise<Project | null>;
  
  // Cloud actions
  syncProject: (project: Project, thumbnail?: string) => Promise<boolean>;
  syncAll: () => Promise<{ success: boolean; synced: number; failed: number }>;
  loadCloudProject: (projectId: string) => Promise<Project | null>;
  
  incrementExportCount: () => void;
  incrementRenderCount: () => void;
  incrementAIRequestCount: () => void;
  updateStorageUsed: (bytes: number) => void;
  
  canExport: () => boolean;
  canRender: () => boolean;
  canUseAI: () => boolean;
  canCreateProject: () => boolean;
  
  // Favorites
  addToFavorites: (type: 'furniture' | 'materials' | 'styles', id: string) => void;
  removeFromFavorites: (type: 'furniture' | 'materials' | 'styles', id: string) => void;
  isFavorite: (type: 'furniture' | 'materials' | 'styles', id: string) => boolean;
  
  // Init
  initialize: () => Promise<void>;
}

const defaultPlans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Perfeito para começar',
    price: 0,
    currency: 'BRL',
    interval: 'month',
    features: [
      'Até 3 projetos',
      'Visualização 2D e 3D',
      'Biblioteca básica de móveis',
      'Exportação em PNG',
      'Suporte por email',
    ],
    limits: {
      projects: 3,
      exportsPerMonth: 5,
      rendersPerMonth: 10,
      storageGB: 1,
      aiRequestsPerMonth: 5,
      maxFurniturePerProject: 20,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para profissionais',
    price: 49.9,
    currency: 'BRL',
    interval: 'month',
    features: [
      'Projetos ilimitados',
      'Biblioteca completa de móveis (300+)',
      'Exportação PDF técnico',
      'Renderização em alta qualidade',
      'IA completa',
      'Materiais PBR',
      'Suporte prioritário',
    ],
    limits: {
      projects: -1,
      exportsPerMonth: 50,
      rendersPerMonth: 100,
      storageGB: 10,
      aiRequestsPerMonth: 100,
      maxFurniturePerProject: 200,
    },
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    description: 'Para escritórios e construtoras',
    price: 199.9,
    currency: 'BRL',
    interval: 'month',
    features: [
      'Tudo do plano Pro',
      'Múltiplos usuários',
      'API de integração',
      'White label',
      'Treinamento dedicado',
      'Suporte 24/7',
      'Backup automático',
    ],
    limits: {
      projects: -1,
      exportsPerMonth: -1,
      rendersPerMonth: -1,
      storageGB: 100,
      aiRequestsPerMonth: -1,
      maxFurniturePerProject: -1,
    },
  },
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      
      plans: defaultPlans,
      currentPlan: defaultPlans[0],
      
      userProjects: [],
      
      isSyncing: false,
      lastSync: null,
      pendingSyncCount: 0,
      
      usage: {
        projectsCount: 0,
        exportsThisMonth: 0,
        rendersThisMonth: 0,
        storageUsed: 0,
        aiRequestsThisMonth: 0,
      },
      
      initialize: async () => {
        const isValid = await authService.validateSession();
        if (isValid) {
          const user = authService.getCurrentUser();
          const token = authService.getToken();
          const plan = defaultPlans.find(p => p.id === user?.plan) || defaultPlans[0];
          
          set({
            isAuthenticated: true,
            user,
            token,
            currentPlan: plan,
            usage: {
              projectsCount: user?.projectsCount || 0,
              exportsThisMonth: 0,
              rendersThisMonth: 0,
              storageUsed: 0,
              aiRequestsThisMonth: 0,
            },
          });
          
          // Load cloud projects
          await get().loadUserProjects();
        }
      },
      
      login: async (email, password) => {
        const result = await authService.login({ email, password });
        
        if (result.success && result.user) {
          const plan = defaultPlans.find(p => p.id === result.user!.plan) || defaultPlans[0];
          
          set({
            isAuthenticated: true,
            user: result.user,
            token: result.token,
            currentPlan: plan,
            usage: {
              projectsCount: result.user.projectsCount || 0,
              exportsThisMonth: 0,
              rendersThisMonth: 0,
              storageUsed: 0,
              aiRequestsThisMonth: 0,
            },
          });
          
          // Load cloud projects
          await get().loadUserProjects();
          
          return true;
        }
        
        return false;
      },
      
      register: async (name, email, password) => {
        const result = await authService.register({ name, email, password });
        
        if (result.success && result.user) {
          set({
            isAuthenticated: true,
            user: result.user,
            token: result.token,
            currentPlan: defaultPlans[0],
            usage: {
              projectsCount: 0,
              exportsThisMonth: 0,
              rendersThisMonth: 0,
              storageUsed: 0,
              aiRequestsThisMonth: 0,
            },
          });
          
          return true;
        }
        
        return false;
      },
      
      logout: async () => {
        await authService.logout();
        
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          userProjects: [],
          isSyncing: false,
          lastSync: null,
          pendingSyncCount: 0,
          usage: {
            projectsCount: 0,
            exportsThisMonth: 0,
            rendersThisMonth: 0,
            storageUsed: 0,
            aiRequestsThisMonth: 0,
          },
        });
      },
      
      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return false;
        
        const result = await authService.updateProfile(user.id, updates);
        
        if (result.success && result.user) {
          set({ user: result.user });
          return true;
        }
        
        return false;
      },
      
      updateSettings: (settings) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, settings: { ...state.user.settings, ...settings } }
            : null,
        }));
      },
      
      loadPlans: () => set({ plans: defaultPlans }),
      
      subscribeToPlan: async (planId) => {
        const { user } = get();
        if (!user) return false;
        
        const plan = get().plans.find((p) => p.id === planId);
        if (!plan) return false;
        
        const result = await authService.upgradePlan(user.id, planId as 'free' | 'pro' | 'enterprise');
        
        if (result.success) {
          set((state) => ({
            user: state.user
              ? { ...state.user, plan: planId as 'free' | 'pro' | 'enterprise' }
              : null,
            currentPlan: plan,
          }));
          
          return true;
        }
        
        return false;
      },
      
      cancelSubscription: async () => {
        const { user } = get();
        if (!user) return false;
        
        const result = await authService.upgradePlan(user.id, 'free');
        
        if (result.success) {
          set((state) => ({
            user: state.user ? { ...state.user, plan: 'free' } : null,
            currentPlan: defaultPlans[0],
          }));
          
          return true;
        }
        
        return false;
      },
      
      loadUserProjects: async () => {
        set({ isSyncing: true });
        
        const cloudProjects = await cloudService.listProjects();
        const projects = cloudProjects.map(cp => cp.project);
        
        set({
          userProjects: projects,
          isSyncing: false,
          lastSync: new Date(),
        });
      },
      
      deleteProject: async (projectId) => {
        const result = await cloudService.deleteProject(projectId);
        
        if (result.success) {
          set((state) => ({
            userProjects: state.userProjects.filter((p) => p.id !== projectId),
            usage: {
              ...state.usage,
              projectsCount: Math.max(0, state.usage.projectsCount - 1),
            },
          }));
          return true;
        }
        
        return false;
      },
      
      duplicateProject: async (projectId) => {
        const project = get().userProjects.find((p) => p.id === projectId);
        if (!project) return null;
        
        const newProject: Project = {
          ...project,
          id: 'proj-' + Math.random().toString(36).substr(2, 9),
          name: project.name + ' (Cópia)',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        };
        
        // Save to cloud
        await get().syncProject(newProject);
        
        set((state) => ({
          userProjects: [...state.userProjects, newProject],
          usage: {
            ...state.usage,
            projectsCount: state.usage.projectsCount + 1,
          },
        }));
        
        return newProject;
      },
      
      syncProject: async (project, thumbnail) => {
        set({ isSyncing: true });
        
        const result = await cloudService.saveProject(project, thumbnail);
        
        set({
          isSyncing: false,
          lastSync: new Date(),
          pendingSyncCount: cloudService.getPendingSyncCount(),
        });
        
        return result.success;
      },
      
      syncAll: async () => {
        set({ isSyncing: true });
        
        const result = await cloudService.syncAll();
        
        if (result.success) {
          await get().loadUserProjects();
        }
        
        set({
          isSyncing: false,
          lastSync: new Date(),
          pendingSyncCount: cloudService.getPendingSyncCount(),
        });
        
        return result;
      },
      
      loadCloudProject: async (projectId) => {
        const result = await cloudService.loadProject(projectId);
        
        if (result.success && result.project) {
          return result.project.project;
        }
        
        return null;
      },
      
      incrementExportCount: () =>
        set((state) => ({
          usage: {
            ...state.usage,
            exportsThisMonth: state.usage.exportsThisMonth + 1,
          },
        })),
      
      incrementRenderCount: () =>
        set((state) => ({
          usage: {
            ...state.usage,
            rendersThisMonth: state.usage.rendersThisMonth + 1,
          },
        })),
      
      incrementAIRequestCount: () =>
        set((state) => ({
          usage: {
            ...state.usage,
            aiRequestsThisMonth: state.usage.aiRequestsThisMonth + 1,
          },
        })),
      
      updateStorageUsed: (bytes) =>
        set((state) => ({
          usage: {
            ...state.usage,
            storageUsed: bytes,
          },
        })),
      
      canExport: () => {
        const { currentPlan, usage } = get();
        if (!currentPlan) return false;
        return (
          currentPlan.limits.exportsPerMonth === -1 ||
          usage.exportsThisMonth < currentPlan.limits.exportsPerMonth
        );
      },
      
      canRender: () => {
        const { currentPlan, usage } = get();
        if (!currentPlan) return false;
        return (
          currentPlan.limits.rendersPerMonth === -1 ||
          usage.rendersThisMonth < currentPlan.limits.rendersPerMonth
        );
      },
      
      canUseAI: () => {
        const { currentPlan, usage } = get();
        if (!currentPlan) return false;
        return (
          currentPlan.limits.aiRequestsPerMonth === -1 ||
          usage.aiRequestsThisMonth < currentPlan.limits.aiRequestsPerMonth
        );
      },
      
      canCreateProject: () => {
        const { currentPlan, usage } = get();
        if (!currentPlan) return false;
        return (
          currentPlan.limits.projects === -1 ||
          usage.projectsCount < currentPlan.limits.projects
        );
      },
      
      addToFavorites: (type, id) => {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                favorites: {
                  ...state.user.favorites,
                  [type]: [...state.user.favorites[type], id],
                },
              }
            : null,
        }));
      },
      
      removeFromFavorites: (type, id) => {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                favorites: {
                  ...state.user.favorites,
                  [type]: state.user.favorites[type].filter((fid) => fid !== id),
                },
              }
            : null,
        }));
      },
      
      isFavorite: (type, id) => {
        const { user } = get();
        if (!user) return false;
        return user.favorites[type].includes(id);
      },
    }),
    {
      name: 'casapro-user',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        usage: state.usage,
      }),
    }
  )
);
