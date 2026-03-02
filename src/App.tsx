// src/App.tsx
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
import AIGenerationModal from '@/components/modals/AIGenerationModal';
import DesignSuggestionsPanel from '@/components/panels/DesignSuggestionsPanel';
import LoginModal from '@/components/modals/LoginModal';
import ExportModal from '@/components/modals/ExportModal';
import AdminPanel from '@/components/admin/AdminPanel';
// import CameraSettingsModal from '@/components/modals/CameraSettingsModal';
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
  Palette,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// User Menu Component
const UserMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onExport: () => void;
}> = ({ isOpen, onLogin, onExport }) => {
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        {isAuthenticated ? (
          <>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a962] to-[#a08040] flex items-center justify-center text-[#0a0a0f] font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm text-white/80 hidden sm:inline">{user?.name?.split(' ')[0] || 'Usuário'}</span>
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

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="p-4 border-b border-white/10">
              <p className="text-white font-medium truncate">{user?.name}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
                {user?.plan === 'free' ? 'Gratuito' : user?.plan === 'pro' ? 'Pro' : 'Empresarial'}
              </span>
            </div>

            {/* Menu Items */}
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

            {/* Logout */}
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

      {/* Click outside to close */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

// Mobile Menu Component - VERSÃO PREMIUM COM ÍCONES LUCIDE
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
        className="fixed inset-0 z-50 lg:hidden"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Menu Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full w-[85%] max-w-[360px] bg-[#0f0f16] border-l border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-[#c9a962]/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a962] to-[#a08040] flex items-center justify-center shadow-lg shadow-[#c9a962]/20">
                <span className="text-[#0a0a0f] font-bold text-lg">C</span>
              </div>
              <div>
                <p className="text-white font-semibold">CasaPro</p>
                <p className="text-xs text-[#c9a962]">Menu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} className="text-white/60" />
            </button>
          </div>

          {/* PROJETO ATUAL */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
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

            {/* INTELIGÊNCIA */}
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

            {/* FERRAMENTAS */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-white/30 font-medium ml-1">
                Ferramentas
              </p>

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

            {/* AÇÕES */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-white/30 font-medium ml-1">
                Ações
              </p>

              <button
                onClick={onClose}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#c9a962]/30 transition-colors">
                    <Save size={18} className="text-white/60 group-hover:text-[#c9a962] transition-colors" />
                  </div>
                  <span className="text-white/90 font-medium group-hover:text-white transition-colors">Salvar</span>
                </div>
                <ArrowLeft size={16} className="text-white/20 -rotate-180 group-hover:text-[#c9a962] transition-colors" />
              </button>

              <button
                onClick={onClose}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#c9a962]/30 transition-colors">
                    <Download size={18} className="text-white/60 group-hover:text-[#c9a962] transition-colors" />
                  </div>
                  <span className="text-white/90 font-medium group-hover:text-white transition-colors">Exportar</span>
                </div>
                <ArrowLeft size={16} className="text-white/20 -rotate-180 group-hover:text-[#c9a962] transition-colors" />
              </button>
            </div>

            {/* BOTÃO VOLTAR PARA INÍCIO */}
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
          </div>

          {/* FECHAR PROJETO */}
          <div className="p-4 border-t border-white/10">
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

  // Estados para modais
  const [showAIGenerationModal, setShowAIGenerationModal] = useState(false);
  const [showDesignSuggestions, setShowDesignSuggestions] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCameraSettings, setShowCameraSettings] = useState(false);

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
    <div className="min-h-screen flex bg-[#0a0a0f] overflow-hidden">
      {/* Toolbar - Esconde no mobile, ou vira overlay */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 72, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 max-md:hidden"
          >
            <Toolbar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Área principal do canvas */}
      <div className="flex-1 relative flex flex-col min-w-0 min-h-0">
        {/* Header do projeto - Responsivo */}
        <div className="relative flex-shrink-0 h-14 md:h-16 flex items-center justify-between px-2 md:px-4 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10 z-30">
          {/* Lado esquerdo: Menu + Configurações */}
          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
              title="Toggle Sidebar"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1">
                <div className="w-full h-0.5 bg-white/60" />
                <div className="w-3/4 h-0.5 bg-white/60" />
                <div className="w-full h-0.5 bg-white/60" />
              </div>
            </button>

            <button
              onClick={() => setShowCameraSettings(true)}
              className="p-2 rounded-xl bg-gradient-to-br from-[#c9a962]/20 to-[#c9a962]/5 border border-[#c9a962]/30 text-[#c9a962] hover:from-[#c9a962]/30 hover:to-[#c9a962]/10 hover:border-[#c9a962]/50 hover:shadow-lg hover:shadow-[#c9a962]/20 transition-all duration-300 backdrop-blur-sm"
              title="Configurações"
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
          
          {/* Centro: Nome do projeto - ABSOLUTAMENTE CENTRALIZADO */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <div className="text-white font-semibold truncate text-sm md:text-base">
              {currentProject?.name}
            </div>
            <div className="text-xs text-white/50 hidden sm:block">
              {viewMode === '2d' ? 'Planta 2D' : 'Visualização 3D'} • 
              {currentProject?.settings?.unit === 'meters' ? ' Metros' : ' Pés'}
            </div>
          </div>

          {/* Lado direito: View Mode + Ações */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 md:p-1 mr-2">
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

            {/* Desktop: todos os botões */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setPanel('furniture', !panels.furniture)}
                className={`px-3 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 backdrop-blur-sm ${
                  panels.furniture 
                    ? 'bg-gradient-to-br from-[#c9a962]/30 to-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/50 shadow-lg shadow-[#c9a962]/10' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 hover:border-[#c9a962]/30'
                }`}
              >
                <span>🛋️</span>
                <span>Móveis</span>
              </button>
              
              <button
                onClick={() => setPanel('ai', !panels.ai)}
                className={`px-3 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 backdrop-blur-sm ${
                  panels.ai 
                    ? 'bg-gradient-to-br from-[#c9a962]/30 to-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/50 shadow-lg shadow-[#c9a962]/10' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 hover:border-[#c9a962]/30'
                }`}
              >
                <Sparkles size={16} />
                <span>IA</span>
              </button>
              
              <button
                onClick={() => setPanel('properties', !panels.properties)}
                className={`px-3 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 backdrop-blur-sm ${
                  panels.properties 
                    ? 'bg-gradient-to-br from-[#c9a962]/30 to-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/50 shadow-lg shadow-[#c9a962]/10' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 hover:border-[#c9a962]/30'
                }`}
              >
                <span>⚙️</span>
                <span>Propriedades</span>
              </button>

              <div className="h-6 w-px bg-white/20 mx-1" />

              <button
                onClick={() => setShowDesignSuggestions(true)}
                className="px-3 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/30 hover:border-amber-500/50 backdrop-blur-sm"
              >
                <Lightbulb size={16} />
                <span>Sugestões</span>
              </button>
              
              <button
                onClick={() => setShowAIGenerationModal(true)}
                className="px-3 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105"
              >
                <Wand2 size={16} />
                <span>Gerar com IA</span>
              </button>

              <div className="h-6 w-px bg-white/20 mx-1" />
            </div>

            {/* Tablet: botões compactos */}
            <div className="hidden md:flex lg:hidden items-center gap-1">
              <button
                onClick={() => setPanel('furniture', !panels.furniture)}
                className={`p-2 rounded-xl transition-all duration-300 backdrop-blur-sm ${panels.furniture ? 'bg-gradient-to-br from-[#c9a962]/30 to-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/50' : 'text-white/60 hover:bg-white/5 border border-transparent'}`}
              >
                🛋️
              </button>
              <button
                onClick={() => setPanel('ai', !panels.ai)}
                className={`p-2 rounded-xl transition-all duration-300 backdrop-blur-sm ${panels.ai ? 'bg-gradient-to-br from-[#c9a962]/30 to-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/50' : 'text-white/60 hover:bg-white/5 border border-transparent'}`}
              >
                <Sparkles size={18} />
              </button>
              <button
                onClick={() => setPanel('properties', !panels.properties)}
                className={`p-2 rounded-xl transition-all duration-300 backdrop-blur-sm ${panels.properties ? 'bg-gradient-to-br from-[#c9a962]/30 to-[#c9a962]/10 text-[#c9a962] border border-[#c9a962]/50' : 'text-white/60 hover:bg-white/5 border border-transparent'}`}
              >
                ⚙️
              </button>
            </div>

            {/* Mobile: menu hambúrguer */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-white/60" />
            </button>

            {/* User Menu - sempre visível */}
            <UserMenu
              isOpen={true}
              onClose={() => {}}
              onLogin={() => setShowLoginModal(true)}
              onExport={() => setShowExportModal(true)}
            />
          </div>
        </div>

        {/* Canvas - Ocupa o espaço restante */}
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

      {/* Painéis laterais - Desktop: lateral, Mobile: overlay */}
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

      {/* Mobile Menu - VERSÃO PREMIUM */}
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

      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      {/* <CameraSettingsModal
        isOpen={showCameraSettings}
        onClose={() => setShowCameraSettings(false)}
      /> */}
    </div>
  );
};

// Componente principal
function App() {
  const [showWelcome, setShowWelcome] = useState(true);
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

  // NOVO: Criar projeto diretamente sem modal de template
  const handleCreateProject = () => {
    // Cria projeto com valores padrão
    createProject('Novo Projeto', 'Projeto residencial');
    // Não abre mais o modal de template, vai direto para o canvas
    setShowWelcome(false);
  };

  const handleOpenProjects = () => {
    // Pode implementar lista de projetos depois
    // setShowCreateModal(true);
  };

  const handleExploreTemplates = () => {
    // Por enquanto cria projeto direto também
    handleCreateProject();
  };

  const handleSubscribePro = () => {
    alert('Assinatura Pro - Em breve!');
  };

  // Voltar para Welcome e fechar projeto
  const handleBackToWelcome = () => {
    clearCurrentProject();
    setShowWelcome(true);
  };

  if (showWelcome) {
    return (
      <WelcomeScreen
        onCreateProject={handleCreateProject}
        onOpenProjects={handleOpenProjects}
        onExploreTemplates={handleExploreTemplates}
        onSubscribePro={handleSubscribePro}
      />
    );
  }

  return <EditorInterface onBackToWelcome={handleBackToWelcome} />;
}

export default App;
