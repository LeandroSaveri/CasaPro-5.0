import type { Project } from '../types';
import { authService } from './authService';

export interface CloudProject {
  id: string;
  userId: string;
  project: Project;
  thumbnail?: string;
  lastSynced: Date;
  version: number;
}

export interface SyncResult {
  success: boolean;
  project?: CloudProject;
  error?: string;
  conflicts?: ConflictInfo[];
}

export interface ConflictInfo {
  field: string;
  localValue: unknown;
  cloudValue: unknown;
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg' | 'glb' | 'json';
  quality?: 'low' | 'medium' | 'high';
  includeMeasurements?: boolean;
  includeFurniture?: boolean;
}

// Mock cloud storage
const CLOUD_PROJECTS: Map<string, CloudProject[]> = new Map();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class CloudService {
  private syncQueue: Map<string, Project> = new Map();
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async saveProject(project: Project, thumbnail?: string): Promise<SyncResult> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    await delay(800);

    if (!this.isOnline) {
      // Queue for later sync
      this.syncQueue.set(project.id, project);
      return { success: false, error: 'Offline - projeto salvo localmente' };
    }

    const cloudProject: CloudProject = {
      id: project.id,
      userId: user.id,
      project: { ...project, updatedAt: new Date() },
      thumbnail,
      lastSynced: new Date(),
      version: (project.version || 1) + 1,
    };

    // Save to mock cloud
    const userProjects = CLOUD_PROJECTS.get(user.id) || [];
    const existingIndex = userProjects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      userProjects[existingIndex] = cloudProject;
    } else {
      userProjects.push(cloudProject);
    }
    
    CLOUD_PROJECTS.set(user.id, userProjects);

    // Also save to localStorage as backup
    this.saveToLocal(project);

    return { success: true, project: cloudProject };
  }

  async loadProject(projectId: string): Promise<SyncResult> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    await delay(500);

    // Try cloud first
    const userProjects = CLOUD_PROJECTS.get(user.id) || [];
    const cloudProject = userProjects.find(p => p.id === projectId);

    if (cloudProject) {
      return { success: true, project: cloudProject };
    }

    // Fallback to local
    const localProject = this.loadFromLocal(projectId);
    if (localProject) {
      return { 
        success: true, 
        project: {
          id: localProject.id,
          userId: user.id,
          project: localProject,
          lastSynced: new Date(0),
          version: 1,
        }
      };
    }

    return { success: false, error: 'Projeto não encontrado' };
  }

  async listProjects(): Promise<CloudProject[]> {
    const user = authService.getCurrentUser();
    if (!user) {
      return [];
    }

    await delay(500);

    const cloudProjects = CLOUD_PROJECTS.get(user.id) || [];
    
    // Also get local projects that might not be synced
    const localProjects = this.listLocalProjects().filter(
      lp => !cloudProjects.some(cp => cp.id === lp.id)
    );

    return [
      ...cloudProjects,
      ...localProjects.map(p => ({
        id: p.id,
        userId: user.id,
        project: p,
        lastSynced: new Date(0),
        version: 1,
      })),
    ].sort((a, b) => 
      new Date(b.project.updatedAt).getTime() - new Date(a.project.updatedAt).getTime()
    );
  }

  async deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    await delay(500);

    // Delete from cloud
    const userProjects = CLOUD_PROJECTS.get(user.id) || [];
    const filtered = userProjects.filter(p => p.id !== projectId);
    CLOUD_PROJECTS.set(user.id, filtered);

    // Delete from local
    this.deleteFromLocal(projectId);

    return { success: true };
  }

  async syncAll(): Promise<{ success: boolean; synced: number; failed: number; error?: string }> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, synced: 0, failed: 0, error: 'Usuário não autenticado' };
    }

    let synced = 0;
    let failed = 0;

    // Process sync queue
    for (const [projectId, project] of this.syncQueue) {
      const result = await this.saveProject(project);
      if (result.success) {
        this.syncQueue.delete(projectId);
        synced++;
      } else {
        failed++;
      }
    }

    // Sync local projects
    const localProjects = this.listLocalProjects();
    for (const project of localProjects) {
      const result = await this.saveProject(project);
      if (result.success) {
        synced++;
      } else {
        failed++;
      }
    }

    return { success: failed === 0, synced, failed };
  }

  async exportProject(project: Project, options: ExportOptions): Promise<{ success: boolean; url?: string; blob?: Blob; error?: string }> {
    await delay(600);

    switch (options.format) {
      case 'json':
        const json = JSON.stringify(project, null, 2);
        const jsonBlob = new Blob([json], { type: 'application/json' });
        return { 
          success: true, 
          blob: jsonBlob,
          url: URL.createObjectURL(jsonBlob)
        };

      case 'pdf':
        // In real app, generate PDF with project info, 2D view, measurements
        const pdfContent = this.generatePDFContent(project, options);
        const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
        return { 
          success: true, 
          blob: pdfBlob,
          url: URL.createObjectURL(pdfBlob)
        };

      case 'png':
      case 'jpg':
        // In real app, capture 3D canvas screenshot
        return { 
          success: true, 
          url: project.thumbnail || ''
        };

      case 'glb':
        // In real app, export 3D scene as GLB
        const glbBlob = new Blob([], { type: 'model/gltf-binary' });
        return { 
          success: true, 
          blob: glbBlob,
          url: URL.createObjectURL(glbBlob)
        };

      default:
        return { success: false, error: 'Formato não suportado' };
    }
  }

  private generatePDFContent(project: Project, options: ExportOptions): string {
    // Simplified PDF generation - in real app, use a library like jsPDF
    const date = new Date().toLocaleDateString('pt-BR');
    return `
CasaPro AI - Relatório do Projeto
================================

Projeto: ${project.name}
Data: ${date}

${project.description || 'Sem descrição'}

Dimensões do Terreno:
- Largura: ${project.exterior.terrain?.width || 'N/A'}m
- Profundidade: ${project.exterior.terrain?.depth || 'N/A'}m

Cômodos: ${project.rooms.length}
Paredes: ${project.walls.length}
Portas: ${project.doors.length}
Janelas: ${project.windows.length}
Móveis: ${project.furniture.length}

${options.includeMeasurements ? 'Medições incluídas' : ''}
    `.trim();
  }

  private saveToLocal(project: Project): void {
    const key = `casapro_project_${project.id}`;
    localStorage.setItem(key, JSON.stringify(project));
    
    // Update project list
    const projectList = this.getLocalProjectList();
    if (!projectList.includes(project.id)) {
      projectList.push(project.id);
      localStorage.setItem('casapro_project_list', JSON.stringify(projectList));
    }
  }

  private loadFromLocal(projectId: string): Project | null {
    const key = `casapro_project_${projectId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private deleteFromLocal(projectId: string): void {
    const key = `casapro_project_${projectId}`;
    localStorage.removeItem(key);
    
    const projectList = this.getLocalProjectList().filter(id => id !== projectId);
    localStorage.setItem('casapro_project_list', JSON.stringify(projectList));
  }

  private listLocalProjects(): Project[] {
    return this.getLocalProjectList()
      .map(id => this.loadFromLocal(id))
      .filter((p): p is Project => p !== null);
  }

  private getLocalProjectList(): string[] {
    const data = localStorage.getItem('casapro_project_list');
    return data ? JSON.parse(data) : [];
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.size > 0 && this.isOnline) {
      await this.syncAll();
    }
  }

  isCloudAvailable(): boolean {
    return this.isOnline && authService.isAuthenticated();
  }

  getPendingSyncCount(): number {
    return this.syncQueue.size;
  }
}

export const cloudService = new CloudService();
