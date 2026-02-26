import type { User, UserPlan } from '../types';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Mock users database
const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'demo@casapro.ai',
    name: 'Usuário Demo',
    plan: 'pro',
    projectsCount: 5,
    maxProjects: 50,
    projects: [],
    favorites: { furniture: [], materials: [], styles: [] },
    settings: {
      language: 'pt-BR',
      theme: 'dark',
      notifications: true,
      autoSave: true,
      autoSaveInterval: 30,
      defaultUnit: 'meters',
      defaultView: '2d',
      toolbarPosition: 'left',
    },
    createdAt: new Date('2024-01-15'),
    lastLoginAt: new Date(),
    lastLogin: new Date(),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  },
  {
    id: 'user-2',
    email: 'free@casapro.ai',
    name: 'Usuário Free',
    plan: 'free',
    projectsCount: 2,
    maxProjects: 3,
    projects: [],
    favorites: { furniture: [], materials: [], styles: [] },
    settings: {
      language: 'pt-BR',
      theme: 'dark',
      notifications: true,
      autoSave: true,
      autoSaveInterval: 30,
      defaultUnit: 'meters',
      defaultView: '2d',
      toolbarPosition: 'left',
    },
    createdAt: new Date('2024-02-01'),
    lastLoginAt: new Date(),
    lastLogin: new Date(),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=free',
  },
];

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;

  constructor() {
    // Check for stored session
    const storedToken = localStorage.getItem('casapro_token');
    const storedUser = localStorage.getItem('casapro_user');
    if (storedToken && storedUser) {
      this.token = storedToken;
      this.currentUser = JSON.parse(storedUser);
    }
  }

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    await delay(800); // Simulate network delay

    const user = MOCK_USERS.find(u => u.email === credentials.email);
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Mock password check (in real app, this would be hashed)
    if (credentials.password !== '123456') {
      return { success: false, error: 'Senha incorreta' };
    }

    // Update last login
    user.lastLogin = new Date();
    
    this.currentUser = user;
    this.token = `mock-token-${user.id}-${Date.now()}`;
    
    // Persist session
    localStorage.setItem('casapro_token', this.token);
    localStorage.setItem('casapro_user', JSON.stringify(user));

    return { success: true, user, token: this.token };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    await delay(1000);

    // Check if email already exists
    if (MOCK_USERS.some(u => u.email === data.email)) {
      return { success: false, error: 'Email já cadastrado' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      plan: 'free',
      projectsCount: 0,
      maxProjects: 3,
      projects: [],
      favorites: { furniture: [], materials: [], styles: [] },
      settings: {
        language: 'pt-BR',
        theme: 'dark',
        notifications: true,
        autoSave: true,
        autoSaveInterval: 30,
        defaultUnit: 'meters',
        defaultView: '2d',
        toolbarPosition: 'left',
      },
      createdAt: new Date(),
      lastLoginAt: new Date(),
      lastLogin: new Date(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
    };

    MOCK_USERS.push(newUser);
    
    this.currentUser = newUser;
    this.token = `mock-token-${newUser.id}-${Date.now()}`;
    
    localStorage.setItem('casapro_token', this.token);
    localStorage.setItem('casapro_user', JSON.stringify(newUser));

    return { success: true, user: newUser, token: this.token };
  }

  async logout(): Promise<void> {
    await delay(300);
    
    this.currentUser = null;
    this.token = null;
    
    localStorage.removeItem('casapro_token');
    localStorage.removeItem('casapro_user');
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    await delay(800);

    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) {
      return { success: false, error: 'Email não encontrado' };
    }

    // In real app, send reset email
    return { success: true };
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    await delay(600);

    const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...updates };
    this.currentUser = MOCK_USERS[userIndex];
    
    localStorage.setItem('casapro_user', JSON.stringify(this.currentUser));

    return { success: true, user: this.currentUser };
  }

  async upgradePlan(userId: string, plan: UserPlan): Promise<{ success: boolean; error?: string }> {
    await delay(1000);

    const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    const maxProjects = plan === 'free' ? 3 : plan === 'pro' ? 50 : 999;
    
    MOCK_USERS[userIndex].plan = plan;
    MOCK_USERS[userIndex].maxProjects = maxProjects;
    
    this.currentUser = MOCK_USERS[userIndex];
    localStorage.setItem('casapro_user', JSON.stringify(this.currentUser));

    return { success: true };
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  async validateSession(): Promise<boolean> {
    if (!this.token || !this.currentUser) {
      return false;
    }

    // In real app, validate token with server
    await delay(300);
    return true;
  }
}

export const authService = new AuthService();
