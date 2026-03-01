// ============================================
// ARQUIVO: src/App.tsx 
// ============================================

import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';
import { useTemplateStore } from '@/store/templateStore';
import Toolbar from '@/components/ui/Toolbar';
import Canvas2D from '@/components/canvas/Canvas2D';
import Canvas3D from '@/components/canvas/Canvas3D';
import FurniturePanel from '@/components/ui/FurniturePanel';
import AIAssistant from '@/components/ui/AIAssistant';
import PropertiesPanel from '@/components/ui/PropertiesPanel';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';
import CreateProjectModal, { ProjectConfig } from '@/components/modals/CreateProjectModal';
import AIGenerationModal from '@/components/modals/AIGenerationModal';
import DesignSuggestionsPanel from '@/components/panels/DesignSuggestionsPanel';
import LoginModal from '@/components/modals/LoginModal';
import ExportModal from '@/components/modals/ExportModal';
import AdminPanel from '@/components/admin/AdminPanel';
import { 
  Sparkles, 
  Wand2, 
  Lightbulb, 
  User, 
  LogOut, 
  Download,
  Save,
  Cloud,
  CloudOff,
  Loader2,
  ArrowLeft,
  Menu,
  X,
  Settings,
  FolderOpen,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// User Menu Component - SIMPLIFICADO (remove duplicatas com MobileMenu)
const UserMenu: React.FC<{
  onLogin: () => void;
  onExport: () => void;
}> = ({ onLogin, onExport }) => {
  const { isAuthenticated, user, logout, isSyncing, lastSync, syncAll } = useUserStore();
  const { currentProject, updateProject } = useProjectStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
  };

  const handleSave = async () => {
    if (currentProject) {
      updateProject({ updatedAt: new Date() });
    }
    setShowMenu(false);
  };

  const handleSync = async () => {
    await syncAll();
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => isAuthenticated ? setShowMenu(!showMenu) : onLogin()}
        className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
      >
        {isAuthenticated && user ? (
          <>
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-white/80 hidden sm:inline">{user.name.split(' ')[0]}</span>
            {isSyncing ? (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            ) : lastSync ? (
              <Cloud className="w-4 h-4 text-green-400" />
            ) : (
              <CloudOff className="w-4 h-4 text-amber-400" />
            )}
          </>
        ) : (
          <>
            <User className="w-5 h-5 text-white/60" />
            <span className="text-sm text-white/80 hidden sm:inline">Entrar</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {showMenu && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/10">
              <p className="text-white font-medium truncate">{user?.name}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
                {user?.plan === 'free' ? 'Gratuito' : user?.plan === 'pro' ? 'Pro' : 'Empresarial'}
              </span>
            </div>

            <div className="p-2">
              <button
                onClick={handleSave}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Salvar projeto
              </button>
              
              <button
                onClick={onExport}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                Sincronizar
              </button>
            </div>

            <div className="p-2 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

// Mobile Menu Component - CONSOLIDADO (única fonte de ações no mobile)
const MobileMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentProject: any;
  setPanel: (key: string, value: boolean) => void;
  panels: any;
  setShowAIGenerationModal: (v: boolean) => void;
  setShowDesignSuggestions: (v: boolean) => void;
  onCloseProject: () => void;
  onBackToWelcome: () => void;
}> = ({
  isOpen,
  onClose,
  currentProject,
  setPanel,
  panels,
  setShowAIGenerationModal,
  setShowDesignSuggestions,
  onCloseProject,
  onBackToWelcome
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full w-80 bg-[#0a0a0f]/95 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col gap-6"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-lg">Menu</span>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={24} className="text-white/60" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#c9a962]/20 via-[#c9a962]/5 to-transparent border border-[#c9a962]/40 rounded-2xl p-5 shadow-lg shadow-[#c9a962]/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#c9a962]/20 flex items-center justify-center">
                <FolderOpen size={20} className="text-[#c9a962]" />
              </div>
              <p className="text-xs uppercase tracking-wider text-[#c9a962] font-medium">
                Projeto Atual
              </p>
            </div>
            <p className="text-white font-semibold text-lg truncate">
              {currentProject?.name || 'Novo Projeto'}
            </p>
            <p className="text-sm text-white/40 mt-1">
              Unidade: {currentProject?.settings?.unit === 'meters' ? 'Metros' : 'Pés'}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-white/30 font-medium ml-1">
              Inteligência
            </p>

            <button
              onClick={() => {
                setShowDesignSuggestions(true);
                onClose();
              }}
              className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
                  <Sparkles size={18} className="text-amber-400" />
                </div>
                <span className="text-white/90 font-medium group-hover:text-white transition-colors">Sugestões</span>
              </div>
              <ArrowLeft size={16} className="text-white/20 -rotate-180 group-hover:text-[#c9a962] transition-colors" />
            </button>

            <button
              onClick={() => {
                setShowAIGenerationModal(true);
                onClose();
              }}
              className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/10 flex items-center justify-center border border-violet-500/20 group-hover:border-violet-500/40 transition-colors">
                  <Palette size={18} className="text-violet-400" />
                </div>
                <span className="text-white/90 font-medium group-hover:text-white transition-colors">Gerar Projeto</span>
              </div>
              <ArrowLeft size={16} className="text-white/20 -rotate-180 group-hover:text-[#c9a962] transition-colors" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-white/30 font-medium ml-1">
              Ferramentas
            </p>

            <button
              onClick={() => {
                setPanel('furniture', !panels.furniture);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all group ${
                panels.furniture 
                  ? 'bg-[#c9a962]/10 border-[#c9a962]/40' 
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                  panels.furniture 
                    ? 'bg-[#c9a962]/20 border-[#c9a962]/40' 
                    : 'bg-white/5 border-white/10 group-hover:border-[#c9a962]/30'
                }`}>
                  <span className={panels.furniture ? 'text-[#c9a962]' : 'text-white/60 group-hover:text-[#c9a962]'}>🛋️</span>
                </div>
                <span className={`font-medium transition-colors ${panels.furniture ? 'text-[#c9a962]' : 'text-white/90 group-hover:text-white'}`}>
                  Móveis
                </span>
              </div>
              <div className={`w-2 h-2 rounded-full transition-colors ${panels.furniture ? 'bg-[#c9a962]' : 'bg-white/20'}`} />
            </button>

            <button
              onClick={() => {
                setPanel('ai', !panels.ai);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all group ${
                panels.ai 
                  ? 'bg-[#c9a962]/10 border-[#c9a962]/40' 
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                  panels.ai 
                    ? 'bg-[#c9a962]/20 border-[#c9a962]/40' 
                    : 'bg-white/5 border-white/10 group-hover:border-[#c9a962]/30'
                }`}>
                  <Sparkles size={18} className={panels.ai ? 'text-[#c9a962]' : 'text-white/60 group-hover:text-[#c9a962]'} />
                </div>
                <span className={`font-medium transition-colors ${panels.ai ? 'text-[#c9a962]' : 'text-white/90 group-hover:text-white'}`}>
                  Assistente IA
                </span>
              </div>
              <div className={`w-2 h-2 rounded-full transition-colors ${panels.ai ? 'bg-[#c9a962]' : 'bg-white/20'}`} />
            </button>

            <button
              onClick={() => {
                setPanel('properties', !panels.properties);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all group ${
                panels.properties 
                  ? 'bg-[#c9a962]/10 border-[#c9a962]/40' 
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                  panels.properties 
                    ? 'bg-[#c9a962]/20 border-[#c9a962]/40' 
                    : 'bg-white/5 border-white/10 group-hover:border-[#c9a962]/30'
                }`}>
                  <Settings size={18} className={panels.properties ? 'text-[#c9a962]' : 'text-white/60 group-hover:text-[#c9a962]'} />
                </div>
                <span className={`font-medium transition-colors ${panels.properties ? 'text-[#c9a962]' : 'text-white/90 group-hover:text-white'}`}>
                  Propriedades
                </span>
              </div>
              <div className={`w-2 h-2 rounded-full transition-colors ${panels.properties ? 'bg-[#c9a962]' : 'bg-white/20'}`} />
            </button>
          </div>

          <div className="mt-2">
            <button
              onClick={() => {
                onBackToWelcome();
                onClose();
              }}
              className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-colors">
                  <ArrowLeft size={18} className="text-white/60 group-hover:text-white transition-colors" />
                </div>
                <span className="text-white/70 font-medium group-hover:text-white transition-colors">Voltar para Início</span>
              </div>
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-white/10">
            <button
              onClick={() => {
                onCloseProject();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl border border-white/10 hover:bg-white/[0.03] hover:border-white/20 transition-all text-white/50 hover:text-white/80"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <FolderOpen size={16} className="text-white/40" />
              </div>
              <span className="font-medium">Fechar Projeto</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Interface principal do editor
const EditorInterface: React.FC<{ onBackToWelcome: () => void }> = ({ onBackToWelcome }) => {
  const { 
    viewMode, 
    currentProject, 
    selectedElement,
  } = useProjectStore();
  
  const { 
    panels, 
    setPanel, 
    sidebarOpen, 
    toggleSidebar,
    setViewMode,
  } = useUIStore();

  const { isAuthenticated, syncProject } = useUserStore();

  const [showAIGenerationModal, setShowAIGenerationModal] = useState(false);
  const [showDesignSuggestions, setShowDesignSuggestions] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdminPanel(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (currentProject && isAuthenticated) {
      const timeout = setTimeout(() => {
        syncProject(currentProject);
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [currentProject, isAuthenticated, syncProject]);

  useEffect(() => {
    if (selectedElement) {
      setPanel('properties', true);
    }
  }, [selectedElement, setPanel]);

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] overflow-hidden">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 max-md:absolute max-md:left-0 max-md:top-16 max-md:h-[calc(100%-64px)] max-md:z-40"
          >
            <Toolbar />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 relative flex flex-col min-w-0 min-h-0">
        <div className="flex-shrink-0 h-14 md:h-16 flex items-center justify-between px-2 md:px-4 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10 z-30">
          <div className="flex items-center gap-1 md:gap-3 min-w-0 flex-1">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 hidden sm:block"
              title="Toggle Sidebar"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1">
                <div className="w-full h-0.5 bg-white/60" />
                <div className="w-3/4 h-0.5 bg-white/60" />
                <div className="w-full h-0.5 bg-white/60" />
              </div>
            </button>
            
            <div className="h-6 w-px bg-white/20 hidden sm:block flex-shrink-0" />
            
            <div className="min-w-0">
              <div className="text-white font-semibold truncate text-sm md:text-base">
                {currentProject?.name}
              </div>
              <div className="text-xs text-white/50 hidden sm:block">
                {viewMode === '2d' ? 'Planta 2D' : 'Visualização 3D'} • 
                {currentProject?.settings?.unit === 'meters' ? ' Metros' : ' Pés'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center flex-shrink-0">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 md:p-1">
              <button
                onClick={() => setViewMode('2d')}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
                  viewMode === '2d'
                    ? 'bg-[#c9a962] text-[#0a0a0f]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
                  viewMode === '3d'
                    ? 'bg-[#c9a962] text-[#0a0a0f]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                3D
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Desktop: botões completos - SÓ APARECEM EM lg */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setPanel('furniture', !panels.furniture)}
                className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  panels.furniture 
                    ? 'bg-[#c9a962]/20 text-[#c9a962] border border-[#c9a962]/30' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
              >
                <span>🛋️</span>
                <span>Móveis</span>
              </button>
              
              <button
                onClick={() => setPanel('ai', !panels.ai)}
                className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  panels.ai 
                    ? 'bg-[#c9a962]/20 text-[#c9a962] border border-[#c9a962]/30' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
              >
                <Sparkles size={16} />
                <span>IA</span>
              </button>
              
              <button
                onClick={() => setPanel('properties', !panels.properties)}
                className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  panels.properties 
                    ? 'bg-[#c9a962]/20 text-[#c9a962] border border-[#c9a962]/30' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
              >
                <span>⚙️</span>
                <span>Propriedades</span>
              </button>

              <div className="h-6 w-px bg-white/20 mx-1" />

              <button
                onClick={() => setShowDesignSuggestions(true)}
                className="px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
              >
                <Lightbulb size={16} />
                <span>Sugestões</span>
              </button>
              
              <button
                onClick={() => setShowAIGenerationModal(true)}
                className="px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90"
              >
                <Wand2 size={16} />
                <span>Gerar com IA</span>
              </button>

              <div className="h-6 w-px bg-white/20 mx-1" />
            </div>

            {/* Mobile: menu hambúrguer - APARECE EM lg:hidden */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-white/60" />
            </button>

            <UserMenu
              onLogin={() => setShowLoginModal(true)}
              onExport={() => setShowExportModal(true)}
            />
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {viewMode === '2d' ? <Canvas2D /> : <Canvas3D />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {panels.furniture && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: 20 }}
            animate={{ width: 320, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-hidden max-md:absolute max-md:right-0 max-md:top-14 max-md:h-[calc(100%-56px)] max-md:z-40 bg-[#0a0a0f] border-l border-white/10"
          >
            <FurniturePanel />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {panels.ai && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: 20 }}
            animate={{ width: 320, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-hidden max-md:absolute max-md:right-0 max-md:top-14 max-md:h-[calc(100%-56px)] max-md:z-40 bg-[#0a0a0f] border-l border-white/10"
          >
            <AIAssistant />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {panels.properties && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: 20 }}
            animate={{ width: 288, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-hidden max-md:absolute max-md:right-0 max-md:top-14 max-md:h-[calc(100%-56px)] max-md:z-40 bg-[#0a0a0f] border-l border-white/10"
          >
            <PropertiesPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        currentProject={currentProject}
        setPanel={setPanel}
        panels={panels}
        setShowAIGenerationModal={setShowAIGenerationModal}
        setShowDesignSuggestions={setShowDesignSuggestions}
        onCloseProject={onBackToWelcome}
        onBackToWelcome={onBackToWelcome}
      />

      <AIGenerationModal
        isOpen={showAIGenerationModal}
        onClose={() => setShowAIGenerationModal(false)}
      />
      
      <DesignSuggestionsPanel
        isOpen={showDesignSuggestions}
        onClose={() => setShowDesignSuggestions(false)}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {currentProject && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          project={currentProject}
        />
      )}

      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />
    </div>
  );
};

// Componente principal - CORRIGIDO para usar CreateProjectModal
function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentProject, createProject, clearCurrentProject, updateProject } = useProjectStore();
  const { loadTemplates, loadStyles } = useTemplateStore();
  const { loadPlans, initialize } = useUserStore();

  useEffect(() => {
    loadTemplates();
    loadStyles();
    loadPlans();
    initialize();
  }, [loadTemplates, loadStyles, loadPlans, initialize]);

  useEffect(() => {
    if (currentProject) {
      setShowWelcome(false);
    }
  }, [currentProject]);

  // CORRIGIDO: Abre o modal de criação em vez de criar direto
  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  // CORRIGIDO: Recebe configuração completa do modal
  const handleCreateWithConfig = (config: ProjectConfig) => {
    // Cria projeto com nome e descrição
    createProject(config.name, config.description);
    
    // Aplica configurações adicionais
    const currentProject = useProjectStore.getState().currentProject;
    if (currentProject) {
      const updates: any = {
        settings: {
          ...currentProject.settings,
          unit: config.unit,
          defaultWallHeight: config.wallHeight,
          defaultWallThickness: config.wallThickness,
          terrainSize: { x: config.terrainSize.width, y: config.terrainSize.depth },
        },
        exterior: {
          ...currentProject.exterior,
          terrainSize: { x: config.terrainSize.width, y: config.terrainSize.depth },
        }
      };
      
      // Aplica template se selecionado
      if (config.template) {
        updates.exterior.terrainSize = config.template.terrainSize;
        updates.settings.terrainSize = config.template.terrainSize;
        updates.settings.defaultWallHeight = config.template.defaultWallHeight;
      }
      
      updateProject(updates);
    }
    
    setShowCreateModal(false);
    setShowWelcome(false);
  };

  const handleOpenProjects = () => {
    setShowCreateModal(true);
  };

  const handleExploreTemplates = () => {
    setShowCreateModal(true);
  };

  const handleSubscribePro = () => {
    alert('Assinatura Pro - Em breve!');
  };

  const handleBackToWelcome = () => {
    clearCurrentProject();
    setShowWelcome(true);
  };

  if (showWelcome) {
    return (
      <>
        <WelcomeScreen 
          onCreateProject={handleCreateProject}
          onOpenProjects={handleOpenProjects}
          onExploreTemplates={handleExploreTemplates}
          onSubscribePro={handleSubscribePro}
        />
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWithConfig}
        />
      </>
    );
  }

  return <EditorInterface onBackToWelcome={handleBackToWelcome} />;
}

export default App;
