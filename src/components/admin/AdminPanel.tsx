// ============================================
// ARQUIVO 10: src/components/admin/AdminPanel.tsx
// ============================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, BarChart3, Settings, Shield, Database, Loader2 } from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const tabs = [
  { id: 'overview', name: 'Visão Geral', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'users', name: 'Usuários', icon: <Users className="w-4 h-4" /> },
  { id: 'system', name: 'Sistema', icon: <Settings className="w-4 h-4" /> },
  { id: 'security', name: 'Segurança', icon: <Shield className="w-4 h-4" /> },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl h-[80vh] bg-[#1a1a1f] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Painel Administrativo</h2>
                <p className="text-sm text-white/60">Gerenciamento do sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Usuários', value: '1,234', change: '+12%', color: 'blue' },
                  { label: 'Projetos Ativos', value: '3,456', change: '+8%', color: 'green' },
                  { label: 'Assinantes Pro', value: '89', change: '+23%', color: 'amber' },
                  { label: 'Uptime', value: '99.9%', change: 'Estável', color: 'purple' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="text-sm text-white/50 mb-1">{stat.label}</div>
                    <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
                    <div className={`text-xs ${
                      stat.change.startsWith('+') ? 'text-green-400' : 'text-white/40'
                    }`}>
                      {stat.change}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Usuários Recentes</h3>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/70 transition-colors">
                    Ver todos
                  </button>
                </div>
                <div className="space-y-2">
                  {['João Silva', 'Maria Santos', 'Pedro Costa'].map((name, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a962] to-[#8b7355] flex items-center justify-center text-[#0a0a0f] font-medium">
                        {name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{name}</div>
                        <div className="text-xs text-white/50">usuario{i + 1}@email.com</div>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Ativo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Status do Sistema</h3>
                <div className="space-y-3">
                  {[
                    { name: 'API', status: 'Operacional', color: 'green' },
                    { name: 'Banco de Dados', status: 'Operacional', color: 'green' },
                    { name: 'Armazenamento', status: 'Operacional', color: 'green' },
                    { name: 'Fila de Processamento', status: 'Lento', color: 'amber' },
                  ].map((service, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-white/40" />
                        <span className="text-white">{service.name}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        service.color === 'green' ? 'bg-green-500/20 text-green-400' :
                        service.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {service.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Logs de Segurança</h3>
                <div className="p-4 bg-black/30 border border-white/10 rounded-lg font-mono text-sm">
                  <div className="text-green-400">[2024-01-15 10:23:45] Login bem-sucedido: admin@casapro.ai</div>
                  <div className="text-white/60">[2024-01-15 10:15:22] Backup automático concluído</div>
                  <div className="text-amber-400">[2024-01-15 09:45:10] Tentativa de login bloqueada: 192.168.1.100</div>
                  <div className="text-white/60">[2024-01-15 09:30:00] Sistema iniciado</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminPanel;
