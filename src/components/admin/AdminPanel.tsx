import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  BarChart3,
  Package,
  Palette,
  FileText,
  Settings,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Server,
  CheckCircle,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import type { AdminUser, Plan } from '../../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'dashboard' | 'users' | 'content' | 'analytics' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const {
    stats,
    users,
    loadStats,
    loadUsers,
    updateUserPlan,
    deactivateUser,
  } = useAdminStore();

  const _isLoading = false;

  useEffect(() => {
    if (isOpen) {
      loadStats();
      loadUsers();
    }
  }, [isOpen, loadStats, loadUsers]);

  const tabs = [
    { id: 'dashboard' as AdminTab, name: 'Dashboard', icon: BarChart3 },
    { id: 'users' as AdminTab, name: 'Usuários', icon: Users },
    { id: 'content' as AdminTab, name: 'Conteúdo', icon: Package },
    { id: 'analytics' as AdminTab, name: 'Analytics', icon: Activity },
    { id: 'settings' as AdminTab, name: 'Configurações', icon: Settings },
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#0a0a0f]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a0f]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-sm text-white/50">CasaPro AI Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white/60" />
          </button>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/10 bg-[#0f0f15]">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-violet-600/20 text-violet-400 border border-violet-600/30'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* System Status */}
            <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  stats?.systemHealth.status === 'healthy' ? 'bg-green-500' :
                  stats?.systemHealth.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span className="text-white/60">
                  Sistema {stats?.systemHealth.status === 'healthy' ? 'OK' : stats?.systemHealth.status}
                </span>
              </div>
              <p className="text-xs text-white/40 mt-1">
                Uptime: {Math.floor((stats?.systemHealth.uptime || 0) / 3600)}h
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'dashboard' && <DashboardTab stats={stats} isLoading={_isLoading} />}
            {activeTab === 'users' && (
              <UsersTab
                users={filteredUsers}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                onUpdatePlan={updateUserPlan}
                onDeleteUser={deactivateUser}
                isLoading={_isLoading}
              />
            )}
            {activeTab === 'content' && <ContentTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Dashboard Tab
const DashboardTab: React.FC<{ stats: any; isLoading: boolean }> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Usuários Ativos',
      value: stats.activeUsers.toLocaleString(),
      change: '+8%',
      trend: 'up',
      icon: Activity,
      color: 'green',
    },
    {
      title: 'Projetos Criados',
      value: stats.totalProjects.toLocaleString(),
      change: '+23%',
      trend: 'up',
      icon: FileText,
      color: 'purple',
    },
    {
      title: 'Usuários Premium',
      value: stats.premiumUsers.toLocaleString(),
      change: '+15%',
      trend: 'up',
      icon: TrendingUp,
      color: 'amber',
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${stats.revenue.toLocaleString()}`,
      change: '+18%',
      trend: 'up',
      icon: DollarSign,
      color: 'emerald',
    },
    {
      title: 'Tempo de Resposta',
      value: `${stats.systemHealth.responseTime}ms`,
      change: '-5%',
      trend: 'down',
      icon: Server,
      color: 'cyan',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendIcon className={`w-4 h-4 ${
                      card.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`} />
                    <span className={`text-sm ${
                      card.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {card.change}
                    </span>
                    <span className="text-white/40 text-sm">vs mês anterior</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-${card.color}-500/20`}>
                  <Icon className={`w-6 h-6 text-${card.color}-400`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Popular Features */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Funcionalidades Populares</h3>
        <div className="space-y-3">
          {stats.popularFeatures.map((feature: string, index: number) => (
            <div key={feature} className="flex items-center gap-4">
              <span className="text-white/40 w-6">{index + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white">{feature}</span>
                  <span className="text-white/60">{100 - index * 15}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                    style={{ width: `${100 - index * 15}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Users Tab
const UsersTab: React.FC<{
  users: AdminUser[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedUsers: string[];
  setSelectedUsers: (ids: string[]) => void;
  onUpdatePlan: (userId: string, planId: string) => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
  isLoading: boolean;
}> = ({ users, searchQuery, setSearchQuery, selectedUsers, setSelectedUsers, onUpdatePlan, onDeleteUser, isLoading: _isLoadingUsers }) => {
  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-500/20 text-gray-400';
      case 'pro': return 'bg-violet-500/20 text-violet-400';
      case 'enterprise': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar usuários..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white transition-colors">
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={() => {
                    if (selectedUsers.length === users.length) {
                      setSelectedUsers([]);
                    } else {
                      setSelectedUsers(users.map(u => u.id));
                    }
                  }}
                  className="rounded border-white/20"
                />
              </th>
              <th className="px-4 py-3 text-left text-white/60 font-medium">Usuário</th>
              <th className="px-4 py-3 text-left text-white/60 font-medium">Plano</th>
              <th className="px-4 py-3 text-left text-white/60 font-medium">Projetos</th>
              <th className="px-4 py-3 text-left text-white/60 font-medium">Último Acesso</th>
              <th className="px-4 py-3 text-left text-white/60 font-medium">Status</th>
              <th className="px-4 py-3 text-left text-white/60 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="rounded border-white/20"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-white/50 text-sm">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(user.plan)}`}>
                    {user.plan.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-white">{user.projects.length}</td>
                <td className="px-4 py-3 text-white/60">
                  {new Date(user.lastLoginAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Ativo
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdatePlan(user.id, user.plan === 'free' ? 'pro' : 'free')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Alterar Plano"
                    >
                      <Edit2 className="w-4 h-4 text-white/60" />
                    </button>
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Content Tab
const ContentTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'furniture' | 'materials' | 'styles' | 'templates'>('furniture');

  const subTabs = [
    { id: 'furniture', name: 'Móveis', icon: Package },
    { id: 'materials', name: 'Materiais', icon: Palette },
    { id: 'styles', name: 'Estilos', icon: Palette },
    { id: 'templates', name: 'Templates', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeSubTab === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Content Placeholder */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Gerenciamento de {subTabs.find(t => t.id === activeSubTab)?.name}
        </h3>
        <p className="text-white/50 mb-6">
          Adicione, edite ou remova itens da biblioteca
        </p>
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white mx-auto transition-colors">
          <Plus className="w-4 h-4" />
          Adicionar Novo
        </button>
      </div>
    </div>
  );
};

// Analytics Tab
const AnalyticsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Crescimento de Usuários</h3>
          <div className="h-48 flex items-end justify-between gap-2">
            {[65, 78, 90, 81, 95, 110, 125, 140, 155, 170, 185, 200].map((value, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg"
                style={{ height: `${(value / 200) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/40">
            <span>Jan</span>
            <span>Mar</span>
            <span>Jun</span>
            <span>Set</span>
            <span>Dez</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Planos</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white">Gratuito</span>
                <span className="text-white/60">65%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-gray-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white">Pro</span>
                <span className="text-white/60">30%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[30%] bg-violet-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white">Empresarial</span>
                <span className="text-white/60">5%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[5%] bg-amber-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Métricas de Engajamento</h3>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">4.2</p>
            <p className="text-white/50 text-sm">Projetos/Usuário</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">28min</p>
            <p className="text-white/50 text-sm">Tempo Médio</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">73%</p>
            <p className="text-white/50 text-sm">Retenção</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">12%</p>
            <p className="text-white/50 text-sm">Conversão</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Tab
const SettingsTab: React.FC = () => {
  const mockPlans: Plan[] = [
    {
      id: 'free',
      name: 'Gratuito',
      description: 'Para uso pessoal e testes',
      price: 0,
      currency: 'BRL',
      interval: 'month',
      features: ['3 projetos', 'Exportação básica', 'Biblioteca limitada'],
      limits: {
        projects: 3,
        exportsPerMonth: 5,
        rendersPerMonth: 0,
        storageGB: 1,
        aiRequestsPerMonth: 10,
        maxFurniturePerProject: 20,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Para profissionais',
      price: 49,
      currency: 'BRL',
      interval: 'month',
      features: ['Projetos ilimitados', 'Exportação completa', 'Biblioteca completa', 'IA avançada'],
      limits: {
        projects: -1,
        exportsPerMonth: -1,
        rendersPerMonth: 50,
        storageGB: 10,
        aiRequestsPerMonth: 100,
        maxFurniturePerProject: 100,
      },
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      description: 'Para equipes',
      price: 199,
      currency: 'BRL',
      interval: 'month',
      features: ['Tudo do Pro', 'Múltiplos usuários', 'API access', 'Suporte prioritário'],
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
  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Planos de Assinatura</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white transition-colors">
            <Plus className="w-4 h-4" />
            Novo Plano
          </button>
        </div>

        <div className="space-y-4">
          {mockPlans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h4 className="text-white font-medium">{plan.name}</h4>
                <p className="text-white/50 text-sm">{plan.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                  <span>R$ {plan.price}/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                  <span>•</span>
                  <span>{plan.limits.projects === -1 ? 'Projetos ilimitados' : `${plan.limits.projects} projetos`}</span>
                  <span>•</span>
                  <span>{plan.limits.exportsPerMonth === -1 ? 'Exportações ilimitadas' : `${plan.limits.exportsPerMonth} exportações/mês`}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4 text-white/60" />
                </button>
                <button className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configurações do Sistema</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-white">Manutenção Programada</p>
              <p className="text-white/50 text-sm">Agendar período de manutenção</p>
            </div>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors">
              Configurar
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-white">Backup Automático</p>
              <p className="text-white/50 text-sm">Frequência de backup dos dados</p>
            </div>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors">
              Diário
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white">Notificações</p>
              <p className="text-white/50 text-sm">Alertas para administradores</p>
            </div>
            <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">
              Ativado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
