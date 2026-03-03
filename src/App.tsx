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
  Compass,
  LayoutGrid,
  Box as BoxIcon,
  SlidersHorizontal,
  Maximize2,
  PanelLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// ============================================
// EDITOR INTERFACE - Interface Premium
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
    <div className="w-full h-screen flex bg-[#0a0a0f] overflow-hidden">
      {/* SIDEBAR - Desktop */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 hidden md:block z-20"
          >
            <Toolbar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 relative flex flex-col min-w-0">
        
        {/* HEADER PREMIUM - Multi-nível */}
        <header className="flex-shrink-0 z-50 bg-gradient-to-r from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] border-b border-white/10 shadow-2xl shadow-black/50">
          
          {/* NÍVEL 1: Barra Principal */}
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3">
            
            {/* ESQUERDA: Controle + Projeto */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Toggle Sidebar */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleSidebar}
                className="hidden md:flex p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#c9a962]/30 transition-all duration-300 group"
              >
                <PanelLeft size={20} className="text-white/60 group-hover:text-[#c9a962] transition-colors" />
              </motion.button>
              
              <div className="hidden md:block h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              
              {/* Info do Projeto */}
              <div className="min-w-0">
                <motion.div 
                  className="flex items-center gap-2"
                  initial={false}
                  animate={{ opacity: 1 }}
                >
                  <motion.div 
                    animate={{ 
                      boxShadow: ['0 0 0px #c9a962', '0 0 10px #c9a962', '0 0 0px #c9a962']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-[#c9a962]"
                  />
                  <h1 className="text-white font-bold text-sm sm:text-base lg:text-lg tracking-wide truncate">
                    {currentProject?.name || 'Novo Projeto'}
                  </h1>
                </motion.div>
                <p className="text-[10px] sm:text-xs text-white/40 hidden sm:block font-medium">
                  {viewMode === '2d' ? 'Planta Baixa 2D' : 'Visualização 3D'} • 
                  {currentProject?.settings?.unit === 'meters' ? ' Métrico' : ' Imperial'}
                </p>
              </div>
            </div>

            {/* CENTRO: View Mode - Desktop */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center bg-[#1a1a24] border border-white/10 rounded-2xl p-1 shadow-inner shadow-black/50">
                <ViewModeButton 
                  active={viewMode === '2d'} 
                  onClick={() => setViewMode('2d')}
                  label="2D"
                />
                <ViewModeButton 
                  active={viewMode === '3d'} 
                  onClick={() => setViewMode('3d')}
                  label="3D"
                />
              </div>
            </div>

            {/* DIREITA: Ações */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              
              {/* View Mode Compacto - Mobile/Tablet */}
              <div className="flex lg:hidden items-center bg-[#1a1a24] border border-white/10 rounded-xl p-0.5 shadow-inner">
                <CompactViewButton 
                  active={viewMode === '2d'} 
                  onClick={() => setViewMode('2d')}
                  label="2D"
                />
                <CompactViewButton 
                  active={viewMode === '3d'} 
                  onClick={() => setViewMode('3d')}
                  label="3D"
                />
              </div>

              {/* Painéis - Desktop */}
              <PanelToggleButton
                icon={<BoxIcon size={18} />}
                label="Móveis"
                active={panels.furniture}
                onClick={() => setPanel('furniture', !panels.furniture)}
                className="hidden xl:flex"
              />
              
              <PanelToggleButton
                icon={<SlidersHorizontal size={18} />}
                label="Propriedades"
                active={panels.properties}
                onClick={() => setPanel('properties', !panels.properties)}
                className="hidden xl:flex"
              />

              {/* Menu Principal - Premium */}
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(201,169,98,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMenuOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#c9a962] via-[#b8944f] to-[#a08040] hover:from-[#d4b76a] hover:via-[#c9a962] hover:to-[#b08d4a] transition-all duration-300 text-[#0a0a0f] font-bold shadow-lg shadow-[#c9a962]/30 border border-[#c9a962]/50"
              >
                <Menu size={18} />
                <span className="hidden sm:inline text-sm">Menu</span>
              </motion.button>
            </div>
          </div>

          {/* NÍVEL 2: Barra de Ferramentas Mobile - SEMPRE VISÍVEL */}
          <div className="xl:hidden border-t border-white/5 bg-[#0d0d12]/95 backdrop-blur-xl">
            <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
              <MobileToolPill
                icon={<BoxIcon size={16} />}
                label="Móveis"
                active={panels.furniture}
                onClick={() => setPanel('furniture', !panels.furniture)}
              />
              <MobileToolPill
                icon={<SlidersHorizontal size={16} />}
                label="Propriedades"
                active={panels.properties}
                onClick={() => setPanel('properties', !panels.properties)}
              />
              <MobileToolPill
                icon={<LayoutGrid size={16} />}
                label="Camadas"
                active={panels.ai}
                onClick={() => setPanel('ai', !panels.ai)}
              />
              <MobileToolPill
                icon={<Maximize2 size={16} />}
                label="Tela Cheia"
                active={false}
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                  } else {
                    document.exitFullscreen();
                  }
                }}
              />
            </div>
          </div>
        </header>

        {/* CANVAS AREA */}
        <div className="relative flex-1 overflow-hidden bg-[#0a0a0f]">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="w-full h-full"
            >
              {viewMode === '2d' ? <Canvas2D /> : <Canvas3D />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* PAINÉIS LATERAIS - Desktop */}
      <AnimatePresence>
        {panels.furniture && (
          <PanelWrapper width={320}>
            <FurniturePanel />
          </PanelWrapper>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {panels.ai && (
          <PanelWrapper width={320}>
            <AIAssistant />
          </PanelWrapper>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {panels.properties && (
          <PanelWrapper width={288}>
            <PropertiesPanel />
          </PanelWrapper>
        )}
      </AnimatePresence>

      {/* MODAIS */}
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

      {/* SIDEMENU PREMIUM */}
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
// COMPONENTES AUXILIARES PREMIUM
// ============================================

const ViewModeButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
}> = ({ active, onClick, label }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
      active
        ? 'bg-gradient-to-br from-[#c9a962] to-[#a08040] text-[#0a0a0f] shadow-lg shadow-[#c9a962]/30'
        : 'text-white/50 hover:text-white hover:bg-white/5'
    }`}
  >
    {label}
  </motion.button>
);

const CompactViewButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
}> = ({ active, onClick, label }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
      active
        ? 'bg-gradient-to-br from-[#c9a962] to-[#a08040] text-[#0a0a0f]'
        : 'text-white/50 hover:text-white'
    }`}
  >
    {label}
  </motion.button>
);

const PanelToggleButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}> = ({ icon, label, active, onClick, className = '' }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
      active 
        ? 'bg-[#c9a962]/15 text-[#c9a962] border-[#c9a962]/40 shadow-[0_0_20px_rgba(201,169,98,0.15)]' 
        : 'bg-white/[0.03] text-white/60 border-white/10 hover:bg-white/[0.08] hover:text-white hover:border-white/20'
    } ${className}`}
  >
    {icon}
    <span>{label}</span>
  </motion.button>
);

const MobileToolPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
      active
        ? 'bg-gradient-to-r from-[#c9a962]/20 to-[#a08040]/10 text-[#c9a962] border border-[#c9a962]/40 shadow-[0_0_15px_rgba(201,169,98,0.15)]'
        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
    }`}
  >
    {icon}
    <span>{label}</span>
  </motion.button>
);

const PanelWrapper: React.FC<{
  width: number;
  children: React.ReactNode;
}> = ({ width, children }) => (
  <motion.div
    initial={{ width: 0, opacity: 0, x: 20 }}
    animate={{ width, opacity: 1, x: 0 }}
    exit={{ width: 0, opacity: 0, x: 20 }}
    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    className="hidden xl:flex flex-shrink-0 overflow-hidden"
  >
    {children}
  </motion.div>
);

// ============================================
// SIDEMENU PREMIUM
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ x: '100%', opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.8 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-gradient-to-b from-[#0f0f16] to-[#0a0a0f] border-l border-white/10 overflow-y-auto shadow-2xl"
      >
        {/* Header */}
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
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white border border-transparent hover:border-white/20"
          >
            <X size={24} />
          </motion.button>
        </div>

        <div className="p-5 space-y-5">
          {/* Projeto Atual */}
          <div className="bg-gradient-to-br from-[#c9a962]/20 via-[#c9a962]/8 to-transparent border border-[#c9a962]/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(201,169,98,0.1)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#c9a962]/20 flex items-center justify-center border border-[#c9a962]/30">
                <FolderOpen size={24} className="text-[#c9a962]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#c9a962] font-semibold">Projeto Atual</p>
                <div className="w-8 h-0.5 bg-gradient-to-r from-[#c9a962] to-transparent mt-1" />
              </div>
            </div>
            <p className="text-white font-bold text-xl truncate">{currentProject?.name || 'Novo Projeto'}</p>
            <p className="text-sm text-white/50 mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a962]" />
              {currentProject?.settings?.unit === 'meters' ? 'Sistema Métrico' : 'Imperial'}
            </p>
          </div>

          {/* Inteligência AI */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setOpenAI(!openAI)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 flex items-center justify-center border border-violet-500/30">
                  <Sparkles size={20} className="text-violet-400" />
                </div>
                <div className="text-left">
                  <span className="text-white font-semibold block">Inteligência AI</span>
                  <span className="text-xs text-white/40">Assistente inteligente</span>
                </div>
              </div>
              <div className={`p-2 rounded-lg bg-white/5 transition-transform ${openAI ? 'rotate-180' : ''}`}>
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
                    <MenuItem
                      icon={<Lightbulb size={18} className="text-amber-400" />}
                      label="Sugestões"
                      description="Ideias de design"
                      onClick={() => { setShowDesignSuggestions(true); onClose(); }}
                    />
                    <MenuItem
                      icon={<Sparkles size={18} className="text-[#c9a962]" />}
                      label="Assistente IA"
                      description="Chat inteligente"
                      onClick={() => { setPanel('ai', true); onClose(); }}
                    />
                    <MenuItem
                      icon={<Wand2 size={18} className="text-violet-400" />}
                      label="Gerar com IA"
                      description="Criação automática"
                      onClick={() => { setShowAIGenerationModal(true); onClose(); }}
                    />
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
              <ToolButton
                icon="🛋️"
                label="Móveis"
                description="Biblioteca de móveis"
                active={panels.furniture}
                onClick={() => { setPanel('furniture', !panels.furniture); onClose(); }}
              />
              <ToolButton
                icon={<Settings size={20} />}
                label="Propriedades"
                description="Configurações do projeto"
                active={panels.properties}
                onClick={() => { setPanel('properties', !panels.properties); onClose(); }}
              />
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
              <ActionButton
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                }
                label="Salvar Projeto"
                onClick={() => { handleSave(); onClose(); }}
              />
              <ActionButton
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
                label="Exportar"
                onClick={onClose}
              />
            </div>
          </div>

          {/* Voltar para Home */}
          <div className="pt-4 border-t border-white/10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { onBackToWelcome(); onClose(); }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-[#c9a962] via-[#b8944f] to-[#a08040] hover:from-[#d4b76a] hover:via-[#c9a962] hover:to-[#b08d4a] transition-all text-[#0a0a0f] font-bold shadow-xl shadow-[#c9a962]/30 border border-[#c9a962]/60"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0a0a0f]/20 flex items-center justify-center">
                <Home size={20} className="text-[#0a0a0f]" />
              </div>
              <span className="text-lg">Voltar para Home</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}> = ({ icon, label, description, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#c9a962]/30 transition-all group"
  >
    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#c9a962]/10 transition-colors">
      {icon}
    </div>
    <div className="text-left">
      <span className="text-white/90 font-medium block group-hover:text-white">{label}</span>
      <span className="text-xs text-white/40">{description}</span>
    </div>
  </motion.button>
);

const ToolButton: React.FC<{
  icon: React.ReactNode | string;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, description, active, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all ${
      active 
        ? 'bg-[#c9a962]/10 border-[#c9a962]/40 shadow-[0_0_20px_rgba(201,169,98,0.1)]' 
        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
    }`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${active ? 'bg-[#c9a962]/20' : 'bg-white/5'}`}>
      {typeof icon === 'string' ? icon : icon}
    </div>
    <div className="text-left">
      <span className={`font-semibold block ${active ? 'text-[#c9a962]' : 'text-white/90'}`}>{label}</span>
      <span className="text-xs text-white/40">{description}</span>
    </div>
    {active && <div className="ml-auto w-2 h-2 rounded-full bg-[#c9a962]" />}
  </motion.button>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30 transition-all group"
  >
    <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#c9a962]/30 group-hover:bg-[#c9a962]/10 transition-all text-white/50 group-hover:text-[#c9a962]">
      {icon}
    </div>
    <div className="text-left">
      <span className="text-white/90 font-semibold block group-hover:text-white">{label}</span>
    </div>
  </motion.button>
);

// ============================================
// APP COMPONENT
// ============================================
function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentProject, createProject, clearCurrentProject } = useProjectStore();
  const { loadTemplates, loadStyles } = useTemplateStore();
  const { loadPlans, initialize } = useUserStore();

  useEffect(() => {
    loadTemplates();
    loadStyles();
    loadPlans();
    initialize();
  }, [loadTemplates, loadStyles, loadPlans, initialize]);

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
      <>
        <div className="bg-[#0a0a0f] min-h-screen overflow-y-auto touch-pan-y">
          <WelcomeScreen 
            onCreateProject={() => setShowCreateModal(true)}
            onOpenProjects={() => setShowCreateModal(true)}
            onExploreTemplates={() => setShowCreateModal(true)}
            onSubscribePro={() => alert('Assinatura Pro - Em breve!')}
          />
        </div>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          onClick={() => {
            if (!currentProject) createProject('Projeto Teste', 'Projeto temporário');
            setShowWelcome(false);
          }}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#c9a962] via-[#b8944f] to-[#a08040] hover:from-[#d4b76a] hover:via-[#c9a962] hover:to-[#b08d4a] transition-all text-[#0a0a0f] font-bold rounded-2xl shadow-2xl shadow-[#c9a962]/40 border border-[#c9a962]/70"
        >
          <Compass size={22} />
          <span>Ir para Canvas</span>
          <ChevronRight size={20} />
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
