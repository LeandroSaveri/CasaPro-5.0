// ============================================
// App.tsx - CasaPro Premium Editor
// Visual SaaS Profissional | Build-Safe
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
import CreateProjectModal, { type ProjectConfig } from '@/components/modals/CreateProjectModal';
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
  Menu,
  X,
  Home,
  FolderOpen,
  ChevronDown,
  Box,
  Settings,
  Layers,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// ============================================
// UserMenu Component - Menu do usuário premium
// ============================================

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onExport: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onLogin, onExport }) => {
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

  if (!isOpen) return null;

  return (
    <div className="relative">
      <button
        onClick={() => isAuthenticated ? setShowMenu(!showMenu) : onLogin()}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
      >
        {isAuthenticated && user ? (
          <>
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-7 h-7 rounded-full ring-2 ring-white/10"
            />
            <span className="text-sm text-white/90 hidden sm:inline font-medium">{user.name.split(' ')[0]}</span>
            {isSyncing ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            ) : lastSync ? (
              <Cloud className="w-4 h-4 text-emerald-400" />
            ) : (
              <CloudOff className="w-4 h-4 text-amber-400" />
            )}
          </>
        ) : (
          <>
            <User className="w-5 h-5 text-white/70" />
            <span className="text-sm text-white/80 font-medium">Entrar</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {showMenu && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-60 bg-[#13131f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
          >
            {/* User Info Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent">
              <p className="text-white font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
              <span className="inline-block mt-2 px-2.5 py-1 bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 text-xs rounded-full border border-amber-500/30 font-medium">
                {user?.plan === 'free' ? 'Gratuito' : user?.plan === 'pro' ? 'Pro' : 'Empresarial'}
              </span>
            </div>

            {/* Menu Actions */}
            <div className="p-2">
              <button
                onClick={handleSave}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 rounded-xl transition-colors"
              >
                <Save className="w-4 h-4 text-amber-400" />
                Salvar projeto
              </button>
              
              <button
                onClick={onExport}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4 text-blue-400" />
                Exportar
              </button>
              
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Cloud className="w-4 h-4 text-emerald-400" />
                )}
                Sincronizar
              </button>
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
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

// ============================================
// SideMenu Component - Menu lateral premium
// Scroll horizontal e vertical no mobile
// ============================================

interface SideMenuProps {
  onClose: () => void;
  onBackToWelcome: () => void;
  setShowDesignSuggestions: (value: boolean) => void;
  setShowAIGenerationModal: (value: boolean) => void;
  setPanel: (key: 'furniture' | 'ai' | 'properties', value: boolean) => void;
  panels: { furniture: boolean; ai: boolean; properties: boolean };
  viewMode: '2d' | '3d';
  setViewMode: (mode: '2d' | '3d') => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ 
  onClose, 
  onBackToWelcome, 
  setShowDesignSuggestions, 
  setShowAIGenerationModal, 
  setPanel, 
  panels,
  viewMode,
  setViewMode
}) => {
  const [openAI, setOpenAI] = useState(false);
  const { currentProject, updateProject } = useProjectStore();

  const handleSave = () => {
    if (currentProject) {
      updateProject({ updatedAt: new Date() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Menu Panel - Scroll em ambas direções */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d0d14] border-l border-white/10 shadow-2xl"
      >
        {/* Header fixo */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-[#0d0d14] border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-[#0a0a0f] font-bold text-xl">C</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg">CasaPro</p>
              <p className="text-xs text-amber-400 font-medium tracking-wide">MENU</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-white/10 rounded-xl text-white/60 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo scrollável - horizontal e vertical */}
        <div 
          className="p-5 space-y-4 overflow-x-auto overflow-y-auto"
          style={{ 
            maxHeight: 'calc(100vh - 90px)',
            minWidth: '320px'
          }}
        >
          {/* Projeto Atual */}
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <FolderOpen size={20} className="text-amber-400" />
              </div>
              <p className="text-xs uppercase text-amber-400 font-bold tracking-wider">Projeto Atual</p>
            </div>
            <p className="text-white font-bold text-lg truncate">{currentProject?.name || 'Novo Projeto'}</p>
            <p className="text-sm text-white/40 mt-1">
              {viewMode === '2d' ? 'Modo Planta 2D' : 'Modo Visualização 3D'}
            </p>
          </div>

          {/* Toggle 2D/3D - Movido para o menu */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Layers size={18} className="text-blue-400" />
                </div>
                <div>
                  <span className="text-white font-semibold block">Visualização</span>
                  <span className="text-xs text-white/40">Alternar entre modos</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center bg-[#1a1a2e] border border-white/10 rounded-xl p-1.5">
                <button
                  onClick={() => setViewMode('2d')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                    viewMode === '2d'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0a0f] shadow-lg shadow-amber-500/25'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  2D Planta
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                    viewMode === '3d'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0a0f] shadow-lg shadow-amber-500/25'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  3D Visual
                </button>
              </div>
            </div>
          </div>

          {/* Inteligência AI */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setOpenAI(!openAI)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                  <Sparkles size={18} className="text-violet-400" />
                </div>
                <div>
                  <span className="text-white font-semibold block">Inteligência AI</span>
                  <span className="text-xs text-white/40">Ferramentas inteligentes</span>
                </div>
              </div>
              <ChevronDown 
                size={20} 
                className={`text-white/50 transition-transform duration-200 ${openAI ? 'rotate-180' : ''}`} 
              />
            </button>

            <AnimatePresence>
              {openAI && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-2">
                    <button
                      onClick={() => { setShowDesignSuggestions(true); onClose(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all border border-transparent hover:border-amber-500/30"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Lightbulb size={16} className="text-amber-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-white/90 font-medium block">Sugestões</span>
                        <span className="text-xs text-white/40">Ideias de design</span>
                      </div>
                    </button>
                    <button
                      onClick={() => { setShowAIGenerationModal(true); onClose(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all border border-transparent hover:border-violet-500/30"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Wand2 size={16} className="text-violet-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-white/90 font-medium block">Gerar com IA</span>
                        <span className="text-xs text-white/40">Criação automática</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ferramentas */}
          <div>
            <p className="text-xs uppercase text-white/30 font-bold mb-3 ml-1 tracking-wider">Ferramentas</p>
            <div className="space-y-2">
              <button
                onClick={() => { setPanel('furniture', !panels.furniture); onClose(); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200 ${
                  panels.furniture 
                    ? 'bg-gradient-to-r from-amber-500/15 to-transparent border-amber-500/40 text-amber-400' 
                    : 'bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${panels.furniture ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                  <Box size={20} />
                </div>
                <div className="text-left">
                  <span className="font-semibold block">Móveis</span>
                  <span className="text-xs text-white/40">Catálogo de móveis</span>
                </div>
              </button>

              <button
                onClick={() => { setPanel('ai', !panels.ai); onClose(); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200 ${
                  panels.ai 
                    ? 'bg-gradient-to-r from-violet-500/15 to-transparent border-violet-500/40 text-violet-400' 
                    : 'bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${panels.ai ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                  <Sparkles size={20} />
                </div>
                <div className="text-left">
                  <span className="font-semibold block">Assistente AI</span>
                  <span className="text-xs text-white/40">Chat inteligente</span>
                </div>
              </button>

              <button
                onClick={() => { setPanel('properties', !panels.properties); onClose(); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-200 ${
                  panels.properties 
                    ? 'bg-gradient-to-r from-blue-500/15 to-transparent border-blue-500/40 text-blue-400' 
                    : 'bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${panels.properties ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                  <Settings size={20} />
                </div>
                <div className="text-left">
                  <span className="font-semibold block">Propriedades</span>
                  <span className="text-xs text-white/40">Configurações do elemento</span>
                </div>
              </button>
            </div>
          </div>

          {/* Ações */}
          <div>
            <p className="text-xs uppercase text-white/30 font-bold mb-3 ml-1 tracking-wider">Ações</p>
            <div className="space-y-2">
              <button
                onClick={() => { handleSave(); onClose(); }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-200 text-white/80"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Save size={20} />
                </div>
                <div className="text-left">
                  <span className="font-semibold block">Salvar Projeto</span>
                  <span className="text-xs text-white/40">Salvar alterações</span>
                </div>
              </button>

              <button
                onClick={() => { onClose(); }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-blue-500/30 transition-all duration-200 text-white/80"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Download size={20} />
                </div>
                <div className="text-left">
                  <span className="font-semibold block">Exportar</span>
                  <span className="text-xs text-white/40">PDF, imagem ou 3D</span>
                </div>
              </button>
            </div>
          </div>

          {/* Voltar para Home */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => { onBackToWelcome(); onClose(); }}
              className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all duration-200 text-[#0a0a0f] font-bold text-lg shadow-lg shadow-amber-500/25"
            >
              <Home size={22} />
              <span>Voltar para Home</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// EditorInterface - Interface principal premium
// ============================================

interface EditorInterfaceProps {
  onBackToWelcome: () => void;
}

const EditorInterface: React.FC<EditorInterfaceProps> = ({ onBackToWelcome }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { 
    viewMode, 
    currentProject, 
    selectedElement,
    setViewMode
  } = useProjectStore();
  
  const { 
    panels, 
    setPanel, 
    sidebarOpen, 
    toggleSidebar
  } = useUIStore();

  const { isAuthenticated, syncProject } = useUserStore();

  // Estados para modais
  const [showAIGenerationModal, setShowAIGenerationModal] = useState(false);
  const [showDesignSuggestions, setShowDesignSuggestions] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Keyboard shortcut for admin panel (Ctrl+Shift+A)
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

  // Auto-save when project changes
  useEffect(() => {
    if (currentProject && isAuthenticated) {
      const timeout = setTimeout(() => {
        syncProject(currentProject);
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [currentProject, isAuthenticated, syncProject]);

  // Mostrar painel de propriedades quando elemento é selecionado
  useEffect(() => {
    if (selectedElement) {
      setPanel('properties', true);
    }
  }, [selectedElement, setPanel]);

  return (
    <div className="h-screen flex bg-[#0a0a0f] overflow-hidden">
      {/* Toolbar - Sempre visível em desktop */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 hidden md:block"
          >
            <Toolbar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Área principal do canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Premium - Nome do projeto centralizado */}
        <div className="flex-shrink-0 z-20 flex items-center justify-between px-4 py-3 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10">
          {/* Lado esquerdo */}
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2.5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20"
              title="Toggle Sidebar"
            >
              <Menu size={20} className="text-amber-400" />
            </button>
            
            <div className="hidden sm:block h-6 w-px bg-white/20" />
            
            {/* NOME DO PROJETO CENTRALIZADO */}
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-white font-bold text-base sm:text-lg truncate max-w-[180px] sm:max-w-[280px] md:max-w-[400px]">
                    {currentProject?.name}
                  </span>
                </div>
                <div className="text-xs text-white/40 hidden sm:block mt-0.5">
                  {viewMode === '2d' ? 'Planta 2D' : 'Visualização 3D'} • 
                  {currentProject?.settings?.unit === 'meters' ? ' Metros' : ' Pés'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Lado direito */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Panel Toggles - Desktop only */}
            <button
              onClick={() => setPanel('furniture', !panels.furniture)}
              className={`hidden lg:flex px-3 py-2 rounded-xl text-sm transition-all items-center gap-2 ${
                panels.furniture 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }`}
            >
              <Box size={16} />
              <span className="hidden xl:inline font-medium">Móveis</span>
            </button>
            
            <button
              onClick={() => setPanel('ai', !panels.ai)}
              className={`hidden lg:flex px-3 py-2 rounded-xl text-sm transition-all items-center gap-2 ${
                panels.ai 
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }`}
            >
              <Sparkles size={16} />
              <span className="hidden xl:inline font-medium">IA</span>
            </button>
            
            <button
              onClick={() => setPanel('properties', !panels.properties)}
              className={`hidden lg:flex px-3 py-2 rounded-xl text-sm transition-all items-center gap-2 ${
                panels.properties 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }`}
            >
              <Settings size={16} />
              <span className="hidden xl:inline font-medium">Propriedades</span>
            </button>

            <div className="hidden lg:block h-6 w-px bg-white/20 mx-1" />

            {/* User Menu */}
            <UserMenu
              isOpen={true}
              onClose={() => {}}
              onLogin={() => setShowLoginModal(true)}
              onExport={() => setShowExportModal(true)}
            />

            {/* Menu Principal Button */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all duration-200 text-[#0a0a0f] font-bold shadow-lg shadow-amber-500/25"
            >
              <Menu size={18} />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative min-h-0">
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

      {/* Painéis laterais */}
      <AnimatePresence>
        {panels.furniture && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden xl:block flex-shrink-0"
          >
            <FurniturePanel />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {panels.ai && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden xl:block flex-shrink-0"
          >
            <AIAssistant />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {panels.properties && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden xl:block flex-shrink-0"
          >
            <PropertiesPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
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

      {/* Admin Panel */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      {/* Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <SideMenu
            onClose={() => setIsMenuOpen(false)}
            onBackToWelcome={onBackToWelcome}
            setShowDesignSuggestions={setShowDesignSuggestions}
            setShowAIGenerationModal={setShowAIGenerationModal}
            setPanel={setPanel}
            panels={panels}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// App Component - Entry point
// ============================================

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentProject, createProject, clearCurrentProject } = useProjectStore();
  const { loadTemplates, loadStyles } = useTemplateStore();
  const { loadPlans, initialize } = useUserStore();

  // Load initial data
  useEffect(() => {
    loadTemplates();
    loadStyles();
    loadPlans();
    initialize();
  }, [loadTemplates, loadStyles, loadPlans, initialize]);

  // Se já tem projeto, mostrar editor
  useEffect(() => {
    if (currentProject) {
      setShowWelcome(false);
    }
  }, [currentProject]);

  const handleCreateProject = (config: ProjectConfig) => {
    createProject(config.name, config.description);
    setShowCreateModal(false);
    setShowWelcome(false);
  };

  const handleBackToWelcome = () => {
    clearCurrentProject();
    setShowWelcome(true);
  };

  if (showWelcome) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <WelcomeScreen 
          onCreateProject={() => setShowCreateModal(true)}
          onOpenProjects={() => setShowCreateModal(true)}
          onExploreTemplates={() => setShowCreateModal(true)}
          onSubscribePro={() => alert('Assinatura Pro - Em breve!')}
        />
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => setShowWelcome(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all duration-200 text-[#0a0a0f] font-bold rounded-xl shadow-lg shadow-amber-500/25"
        >
          <Compass size={20} />
          <span>Ir para Canvas</span>
        </motion.button>

        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      </div>
    );
  }

  return <EditorInterface onBackToWelcome={handleBackToWelcome} />;
}

export default App;
