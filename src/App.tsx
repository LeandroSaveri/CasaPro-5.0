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
  Settings,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  X,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// ============================================
// EDITOR INTERFACE - Interface principal do editor
// ============================================
const EditorInterface: React.FC<{
  onBackToWelcome: () => void;
}> = ({ onBackToWelcome }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      }, 30000); // Auto-save after 30 seconds

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
      {/* ============================================
          TOOLBAR - Barra lateral de ferramentas
          ============================================ */}
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

      {/* ============================================
          ÁREA PRINCIPAL DO CANVAS
          ============================================ */}
      <div className="flex-1 relative flex flex-col">
        {/* ============================================
            HEADER PREMIUM - Barra superior elegante
            ============================================ */}
        <div className="flex-shrink-0 z-10 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] backdrop-blur-xl border-b border-white/10 shadow-lg">
          {/* Lado esquerdo - Informações do projeto */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Toggle Sidebar - Desktop */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-transparent hover:border-white/20"
              title="Toggle Sidebar"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
                <div className="w-full h-0.5 bg-gradient-to-r from-[#c9a962] to-[#a08040]" />
                <div className="w-2/3 h-0.5 bg-gradient-to-r from-[#c9a962] to-[#a08040]" />
                <div className="w-full h-0.5 bg-gradient-to-r from-[#c9a962] to-[#a08040]" />
              </div>
            </button>
            
            <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            
            {/* Info do projeto */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#c9a962] animate-pulse" />
                <span className="text-white font-semibold text-sm sm:text-lg tracking-wide truncate">
                  {currentProject?.name || 'Novo Projeto'}
                </span>
              </div>
              <div className="text-xs text-white/40 hidden sm:block mt-0.5">
                {viewMode === '2d' ? 'Planta Baixa 2D' : 'Visualização 3D'} • 
                {currentProject?.settings?.unit === 'meters' ? ' Sistema Métrico' : ' Imperial'}
              </div>
            </div>
          </div>
          
          {/* ============================================
              LADO DIREITO - CONTROLES PREMIUM
              ============================================ */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* View Mode Toggle - Estilo Segmentado Premium */}
            <div className="flex items-center bg-[#1a1a24] border border-white/10 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => setViewMode('2d')}
                className={`relative px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  viewMode === '2d'
                    ? 'bg-gradient-to-br from-[#c9a962] to-[#a08040] text-[#0a0a0f] shadow-lg'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="relative z-10">2D</span>
                {viewMode === '2d' && (
                  <motion.div
                    layoutId="viewModeIndicator"
                    className="absolute inset-0 bg-gradient-to-br from-[#c9a962] to-[#a08040] rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`relative px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  viewMode === '3d'
                    ? 'bg-gradient-to-br from-[#c9a962] to-[#a08040] text-[#0a0a0f] shadow-lg'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="relative z-10">3D</span>
                {viewMode === '3d' && (
                  <motion.div
                    layoutId="viewModeIndicator"
                    className="absolute inset-0 bg-gradient-to-br from-[#c9a962] to-[#a08040] rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            </div>

            <div className="hidden lg:block h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />

            {/* Panel Toggles - Desktop Premium */}
            <button
              onClick={() => setPanel('furniture', !panels.furniture)}
              className={`hidden lg:flex px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 items-center gap-2.5 border ${
                panels.furniture 
                  ? 'bg-[#c9a962]/15 text-[#c9a962] border-[#c9a962]/40 shadow-[0_0_20px_rgba(201,169,98,0.15)]' 
                  : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white border-white/10 hover:border-white/20'
              }`}
            >
              <span className="text-lg">🛋️</span>
              <span>Móveis</span>
            </button>
            
            <button
              onClick={() => setPanel('properties', !panels.properties)}
              className={`hidden lg:flex px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 items-center gap-2.5 border ${
                panels.properties 
                  ? 'bg-[#c9a962]/15 text-[#c9a962] border-[#c9a962]/40 shadow-[0_0_20px_rgba(201,169,98,0.15)]' 
                  : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white border-white/10 hover:border-white/20'
              }`}
            >
              <Settings size={16} className={panels.properties ? 'text-[#c9a962]' : ''} />
              <span>Propriedades</span>
            </button>

            {/* Menu Button - Premium Gold */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a962] to-[#a08040] hover:from-[#d4b76a] hover:to-[#b08d4a] transition-all duration-300 text-[#0a0a0f] font-semibold shadow-lg shadow-[#c9a962]/25 hover:shadow-[#c9a962]/40 border border-[#c9a962]/50"
            >
              <Menu size={18} />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>

        {/* ============================================
            CANVAS AREA
            ============================================ */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              {viewMode === '2d' ? <Canvas2D /> : <Canvas3D />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ============================================
          PAINÉIS LATERAIS - Desktop
          ============================================ */}
      <AnimatePresence>
        {panels.furniture && (
          <motion.div
            initial={{ width: 0, opacity: 0, x: 20 }}
            animate={{ width: 320, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="hidden xl:flex flex-shrink-0 overflow-hidden"
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
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="hidden xl:flex flex-shrink-0 overflow-hidden"
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
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="hidden xl:flex flex-shrink-0 overflow-hidden"
          >
            <PropertiesPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================
          MODAIS
          ============================================ */}
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

      {/* ============================================
          SIDEMENU - Menu Lateral Responsivo
          ============================================ */}
      <AnimatePresence>
        {isMenuOpen && (
          <SideMenu
            onClose={() => setIsMenuOpen(false)}
            onBackToWelcome={onBackToWelcome}
            setShowDesignSuggestions={setShowDesignSuggestions}
            setShowAIGenerationModal={setShowAIGenerationModal}
            setPanel={setPanel}
            panels={panels}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// SIDEMENU COMPONENT - Menu lateral premium
// ============================================
const SideMenu: React.FC<{
  onClose: () => void;
  onBackToWelcome: () => void;
  setShowDesignSuggestions: (value: boolean) => void;
  setShowAIGenerationModal: (value: boolean) => void;
  setPanel: (key: string, value: boolean) => void;
  panels: any;
}> = ({ onClose, onBackToWelcome, setShowDesignSuggestions, setShowAIGenerationModal, setPanel, panels }) => {
  const [openAI, setOpenAI] = useState(false);
  const { currentProject, updateProject } = useProjectStore();

  const handleSave = () => {
    if (currentProject) {
      updateProject({ updatedAt: new Date() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay com blur */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Painel do Menu */}
      <motion.div 
        initial={{ x: '100%', opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.8 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-gradient-to-b from-[#0f0f16] to-[#0a0a0f] border-l border-white/10 overflow-y-auto shadow-2xl"
      >
        {/* Header do Menu */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-[#0f0f16]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a962] to-[#a08040] flex items-center justify-center shadow-lg shadow-[#c9a962]/30">
              <span className="text-[#0a0a0f] font-bold text-xl">C</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg tracking-wide">CasaPro</p>
              <p className="text-xs text-[#c9a962] font-medium tracking-wider uppercase">Menu Principal</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 text-white/60 hover:text-white border border-transparent hover:border-white/20"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Projeto Atual - Card Premium */}
          <div className="bg-gradient-to-br from-[#c9a962]/20 via-[#c9a962]/8 to-transparent border border-[#c9a962]/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(201,169,98,0.1)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#c9a962]/20 flex items-center justify-center border border-[#c9a962]/30">
                <FolderOpen size={24} className="text-[#c9a962]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#c9a962] font-semibold">
                  Projeto Atual
                </p>
                <div className="w-8 h-0.5 bg-gradient-to-r from-[#c9a962] to-transparent mt-1" />
              </div>
            </div>
            <p className="text-white font-bold text-xl truncate">
              {currentProject?.name || 'Novo Projeto'}
            </p>
            <p className="text-sm text-white/50 mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a962]" />
              Unidade: {currentProject?.settings?.unit === 'meters' ? 'Sistema Métrico' : 'Imperial'}
            </p>
          </div>

          {/* Inteligência AI - Seção Expansível */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setOpenAI(!openAI)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 flex items-center justify-center border border-violet-500/30 group-hover:border-violet-500/50 transition-colors shadow-lg shadow-violet-500/10">
                  <Sparkles size={20} className="text-violet-400" />
                </div>
                <div className="text-left">
                  <span className="text-white font-semibold block">Inteligência AI</span>
                  <span className="text-xs text-white/40">Assistente inteligente</span>
                </div>
              </div>
              <div className={`p-2 rounded-lg bg-white/5 transition-transform duration-300 ${openAI ? 'rotate-180' : ''}`}>
                <ChevronDown size={20} className="text-white/50" />
              </div>
            </button>

            <AnimatePresence>
              {openAI && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-2">
                    <button
                      onClick={() => {
                        setShowDesignSuggestions(true);
                        onClose();
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-amber-500/30 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/25 transition-colors">
                        <Lightbulb size={18} className="text-amber-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-white/90 font-medium block group-hover:text-white transition-colors">Sugestões</span>
                        <span className="text-xs text-white/40">Ideias de design</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setPanel('ai', true);
                        onClose();
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#c9a962]/30 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#c9a962]/15 flex items-center justify-center group-hover:bg-[#c9a962]/25 transition-colors">
                        <Sparkles size={18} className="text-[#c9a962]" />
                      </div>
                      <div className="text-left">
                        <span className="text-white/90 font-medium block group-hover:text-white transition-colors">Assistente IA</span>
                        <span className="text-xs text-white/40">Chat inteligente</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowAIGenerationModal(true);
                        onClose();
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-violet-500/30 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/15 flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-purple-600/25 transition-all">
                        <Wand2 size={18} className="text-violet-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-white/90 font-medium block group-hover:text-white transition-colors">Gerar com IA</span>
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
            <p className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-3 ml-1 flex items-center gap-2">
              <div className="w-4 h-px bg-white/20" />
              Ferramentas
              <div className="flex-1 h-px bg-white/10" />
            </p>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  setPanel('furniture', !panels.furniture);
                  onClose();
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-300 ${
                  panels.furniture 
                    ? 'bg-[#c9a962]/10 border-[#c9a962]/40 shadow-[0_0_20px_rgba(201,169,98,0.1)]' 
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                  panels.furniture 
                    ? 'bg-[#c9a962]/20' 
                    : 'bg-white/5'
                }`}>
                  🛋️
                </div>
                <div className="text-left">
                  <span className={`font-semibold block ${panels.furniture ? 'text-[#c9a962]' : 'text-white/90'}`}>
                    Móveis
                  </span>
                  <span className="text-xs text-white/40">Biblioteca de móveis</span>
                </div>
                {panels.furniture && <div className="ml-auto w-2 h-2 rounded-full bg-[#c9a962]" />}
              </button>

              <button
                onClick={() => {
                  setPanel('properties', !panels.properties);
                  onClose();
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-300 ${
                  panels.properties 
                    ? 'bg-[#c9a962]/10 border-[#c9a962]/40 shadow-[0_0_20px_rgba(201,169,98,0.1)]' 
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                  panels.properties 
                    ? 'bg-[#c9a962]/20 border-[#c9a962]/40' 
                    : 'bg-white/5 border-white/10'
                }`}>
                  <Settings size={20} className={panels.properties ? 'text-[#c9a962]' : 'text-white/50'} />
                </div>
                <div className="text-left">
                  <span className={`font-semibold block ${panels.properties ? 'text-[#c9a962]' : 'text-white/90'}`}>
                    Propriedades
                  </span>
                  <span className="text-xs text-white/40">Configurações do projeto</span>
                </div>
                {panels.properties && <div className="ml-auto w-2 h-2 rounded-full bg-[#c9a962]" />}
              </button>
            </div>
          </div>

          {/* Ações */}
          <div>
            <p className="text-xs uppercase tracking-widest text-white/30 font-semibold mb-3 ml-1 flex items-center gap-2">
              <div className="w-4 h-px bg-white/20" />
              Ações
              <div className="flex-1 h-px bg-white/10" />
            </p>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  handleSave();
                  onClose();
                }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#c9a962]/30 group-hover:bg-[#c9a962]/10 transition-all">
                  <svg className="w-5 h-5 text-white/50 group-hover:text-[#c9a962] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-white/90 font-semibold block group-hover:text-white transition-colors">Salvar Projeto</span>
                  <span className="text-xs text-white/40">Salvar alterações</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#c9a962]/30 group-hover:bg-[#c9a962]/10 transition-all">
                  <svg className="w-5 h-5 text-white/50 group-hover:text-[#c9a962] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-white/90 font-semibold block group-hover:text-white transition-colors">Exportar</span>
                  <span className="text-xs text-white/40">Exportar projeto</span>
                </div>
              </button>
            </div>
          </div>

          {/* Voltar para Home - Botão Premium Destaque */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => {
                onBackToWelcome();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-[#c9a962] via-[#b8944f] to-[#a08040] hover:from-[#d4b76a] hover:via-[#c9a962] hover:to-[#b08d4a] transition-all duration-300 text-[#0a0a0f] font-bold shadow-xl shadow-[#c9a962]/30 hover:shadow-[#c9a962]/50 border border-[#c9a962]/60 hover:border-[#c9a962] group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0a0a0f]/20 flex items-center justify-center group-hover:bg-[#0a0a0f]/30 transition-colors">
                <Home size={20} className="text-[#0a0a0f]" />
              </div>
              <span className="text-lg">Voltar para Home</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// APP COMPONENT - Componente principal
// ============================================
function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentProject, createProject, clearCurrentProject } = useProjectStore();
  const { loadTemplates, loadStyles } = useTemplateStore();
  const { loadPlans, initialize } = useUserStore();

  // ============================================
  // EFEITOS INICIAIS
  // ============================================
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

  // ============================================
  // HANDLERS
  // ============================================
  const handleCreateProject = (config: ProjectConfig) => {
    createProject(config.name, config.description);
    
    if (config.template) {
      // TODO: Apply template rooms and settings
    }
    
    if (config.style) {
      // TODO: Apply style colors and materials
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

  // ============================================
  // RENDER - TELA INICIAL OU EDITOR
  // ============================================
  if (showWelcome) {
    return (
      <>
        <WelcomeScreen 
          onCreateProject={() => setShowCreateModal(true)}
          onOpenProjects={handleOpenProjects}
          onExploreTemplates={handleExploreTemplates}
          onSubscribePro={handleSubscribePro}
        />
        
        {/* Botão Premium "Ir para Canvas" - Posicionado elegantemente */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          onClick={() => setShowWelcome(false)}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#c9a962] via-[#b8944f] to-[#a08040] hover:from-[#d4b76a] hover:via-[#c9a962] hover:to-[#b08d4a] transition-all duration-300 text-[#0a0a0f] font-bold rounded-2xl shadow-2xl shadow-[#c9a962]/40 hover:shadow-[#c9a962]/60 border border-[#c9a962]/70 hover:border-[#c9a962] group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0a0a0f]/20 flex items-center justify-center group-hover:bg-[#0a0a0f]/30 transition-colors">
            <Compass size={22} className="text-[#0a0a0f]" />
          </div>
          <div className="text-left">
            <span className="block text-sm font-bold">Ir para Canvas</span>
            <span className="block text-xs text-[#0a0a0f]/70">Continuar editando</span>
          </div>
          <ChevronRight size={20} className="text-[#0a0a0f]/60 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      </>
    );
  }

  return <EditorInterface onBackToWelcome={handleBackToWelcome} />;
}

export default App;
