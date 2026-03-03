// ============================================
// APP.tsx - CasaPro AI Premium
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
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
  PanelLeft,
  Save,
  Download,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// ============================================
// EDITOR INTERFACE - Premium Responsivo
// ============================================
const EditorInterface: React.FC<{
  onBackToWelcome: () => void;
}> = ({ onBackToWelcome }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
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

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    if (selectedElement && !isMobile) {
      setPanel('properties', true);
    }
  }, [selectedElement, setPanel, isMobile]);

  // Handler para painéis mobile
  const toggleMobilePanel = (panelName: string) => {
    if (activeMobilePanel === panelName) {
      setActiveMobilePanel(null);
    } else {
      setActiveMobilePanel(panelName);
    }
  };

  return (
    <div className="w-full h-screen flex bg-[#0a0a0f] overflow-hidden touch-none">
      
      {/* SIDEBAR - Desktop apenas */}
      {!isMobile && (
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 72, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 z-20 border-r border-white/5"
            >
              <Toolbar />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER PREMIUM - Ultra compacto no mobile */}
        <header className="flex-shrink-0 z-50 bg-[#0a0a0f] border-b border-white/10">
          
          {/* LINHA ÚNICA - Desktop e Mobile */}
          <div className="flex items-center justify-between px-3 h-14">
            
            {/* ESQUERDA: Logo/Projeto */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Toggle Sidebar - Desktop */}
              {!isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <PanelLeft size={18} className="text-white/60" />
                </button>
              )}
              
              {/* Logo + Nome */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#a08040] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#0a0a0f] font-bold text-sm">C</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-white font-semibold text-sm truncate max-w-[120px] sm:max-w-[200px]">
                    {currentProject?.name || 'Projeto'}
                  </h1>
                  <p className="text-[10px] text-white/40 hidden sm:block">
                    {viewMode === '2d' ? '2D' : '3D'}
                  </p>
                </div>
              </div>
            </div>

            {/* CENTRO: View Mode */}
            <div className="flex items-center justify-center">
              <div className="flex items-center bg-[#1a1a24] border border-white/10 rounded-xl p-0.5">
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
            <div className="flex items-center gap-1 flex-shrink-0">
              
              {/* Botão Menu Principal - Sempre visível */}
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#c9a962] to-[#a08040] text-[#0a0a0f] font-semibold text-sm shadow-lg shadow-[#c9a962]/20"
              >
                <Menu size={16} />
                <span className="hidden sm:inline">Menu</span>
              </button>
            </div>
          </div>
        </header>

        {/* CANVAS AREA - Com touch habilitado */}
        <div className="relative flex-1 overflow-hidden bg-[#0a0a0f] touch-pan-y">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              {viewMode === '2d' ? <Canvas2D /> : <Canvas3D />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* BARRA INFERIOR MOBILE - Ferramentas rápidas */}
        {isMobile && (
          <div className="flex-shrink-0 bg-[#0a0a0f] border-t border-white/10 px-2 py-2">
            <div className="flex items-center justify-around gap-1">
              <MobileActionButton
                icon={<BoxIcon size={20} />}
                label="Móveis"
                active={activeMobilePanel === 'furniture'}
                onClick={() => toggleMobilePanel('furniture')}
              />
              <MobileActionButton
                icon={<Sparkles size={20} />}
                label="IA"
                active={activeMobilePanel === 'ai'}
                onClick={() => toggleMobilePanel('ai')}
              />
              <MobileActionButton
                icon={<SlidersHorizontal size={20} />}
                label="Propriedades"
                active={activeMobilePanel === 'properties'}
                onClick={() => toggleMobilePanel('properties')}
              />
              <MobileActionButton
                icon={<Maximize2 size={20} />}
                label="Tela Cheia"
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
        )}
      </div>

      {/* PAINÉIS LATERAIS - Desktop */}
      {!isMobile && (
        <>
          <AnimatePresence>
            {panels.furniture && (
              <PanelWrapper width={300}>
                <FurniturePanel />
              </PanelWrapper>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {panels.ai && (
              <PanelWrapper width={300}>
                <AIAssistant />
              </PanelWrapper>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {panels.properties && (
              <PanelWrapper width={280}>
                <PropertiesPanel />
              </PanelWrapper>
            )}
          </AnimatePresence>
        </>
      )}

      {/* PAINÉIS MOBILE - Bottom Sheet */}
      <AnimatePresence>
        {isMobile && activeMobilePanel && (
          <MobilePanel
            title={activeMobilePanel === 'furniture' ? 'Móveis' : activeMobilePanel === 'ai' ? 'Assistente IA' : 'Propriedades'}
            onClose={() => setActiveMobilePanel(null)}
          >
            {activeMobilePanel === 'furniture' && <FurniturePanel />}
            {activeMobilePanel === 'ai' && <AIAssistant />}
            {activeMobilePanel === 'properties' && <PropertiesPanel />}
          </MobilePanel>
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
            setShowExportModal={setShowExportModal}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const ViewModeButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
}> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
      active
        ? 'bg-gradient-to-br from-[#c9a962] to-[#a08040] text-[#0a0a0f]'
        : 'text-white/50 hover:text-white hover:bg-white/5'
    }`}
  >
    {label}
  </button>
);

const MobileActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px] ${
      active
        ? 'bg-[#c9a962]/20 text-[#c9a962]'
        : 'text-white/60 hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const PanelWrapper: React.FC<{
  width: number;
  children: React.ReactNode;
}> = ({ width, children }) => (
  <motion.div
    initial={{ width: 0, opacity: 0 }}
    animate={{ width, opacity: 1 }}
    exit={{ width: 0, opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="flex-shrink-0 overflow-hidden border-l border-white/5 bg-[#0a0a0f]"
  >
    {children}
  </motion.div>
);

// ============================================
// MOBILE PANEL - Bottom Sheet
// ============================================
const MobilePanel: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-40"
      onClick={onClose}
    />
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f16] border-t border-white/10 rounded-t-2xl max-h-[70vh] flex flex-col"
    >
      {/* Header do painel */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-semibold">{title}</h3>
        <button 
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 text-white/60"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto p-4 touch-pan-y">
        {children}
      </div>
    </motion.div>
  </>
);

// ============================================
// SIDEMENU PREMIUM - Simplificado
// ============================================
const SideMenu: React.FC<{
  onClose: () => void;
  onBackToWelcome: () => void;
  setShowDesignSuggestions: (value: boolean) => void;
  setShowAIGenerationModal: (value: boolean) => void;
  setShowExportModal: (value: boolean) => void;
  isMobile: boolean;
}> = ({ onClose, onBackToWelcome, setShowDesignSuggestions, setShowAIGenerationModal, setShowExportModal, isMobile }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const { currentProject } = useProjectStore();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`absolute right-0 top-0 bottom-0 bg-[#0a0a0f] border-l border-white/10 overflow-y-auto ${
          isMobile ? 'w-full' : 'w-96'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#0a0a0f] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a962] to-[#a08040] flex items-center justify-center">
              <span className="text-[#0a0a0f] font-bold text-lg">C</span>
            </div>
            <div>
              <p className="text-white font-bold">CasaPro</p>
              <p className="text-xs text-[#c9a962]">Menu</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-lg text-white/60"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Projeto Atual */}
          <div className="bg-gradient-to-br from-[#c9a962]/10 to-transparent border border-[#c9a962]/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <FolderOpen size={20} className="text-[#c9a962]" />
              <span className="text-xs uppercase text-[#c9a962] font-medium">Projeto Atual</span>
            </div>
            <p className="text-white font-semibold truncate">{currentProject?.name || 'Novo Projeto'}</p>
          </div>

          {/* Seções do Menu */}
          <div className="space-y-2">
            {/* IA Section */}
            <MenuSection
              title="Inteligência AI"
              icon={<Sparkles size={18} className="text-violet-400" />}
              isOpen={openSection === 'ai'}
              onToggle={() => toggleSection('ai')}
            >
              <MenuItem
                icon={<Lightbulb size={16} />}
                label="Sugestões de Design"
                onClick={() => { setShowDesignSuggestions(true); onClose(); }}
              />
              <MenuItem
                icon={<Wand2 size={16} />}
                label="Gerar com IA"
                onClick={() => { setShowAIGenerationModal(true); onClose(); }}
              />
            </MenuSection>

            {/* Ferramentas */}
            <MenuSection
              title="Ferramentas"
              icon={<Settings size={18} className="text-[#c9a962]" />}
              isOpen={openSection === 'tools'}
              onToggle={() => toggleSection('tools')}
            >
              <MenuItem
                icon={<BoxIcon size={16} />}
                label="Biblioteca de Móveis"
                onClick={onClose}
              />
              <MenuItem
                icon={<LayoutGrid size={16} />}
                label="Camadas"
                onClick={onClose}
              />
            </MenuSection>

            {/* Ações */}
            <MenuSection
              title="Ações"
              icon={<Save size={18} className="text-emerald-400" />}
              isOpen={openSection === 'actions'}
              onToggle={() => toggleSection('actions')}
            >
              <MenuItem
                icon={<Save size={16} />}
                label="Salvar Projeto"
                onClick={onClose}
              />
              <MenuItem
                icon={<Download size={16} />}
                label="Exportar"
                onClick={() => { setShowExportModal(true); onClose(); }}
              />
            </MenuSection>
          </div>

          {/* Voltar para Home */}
          <button
            onClick={() => { onBackToWelcome(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#c9a962] to-[#a08040] text-[#0a0a0f] font-semibold mt-6"
          >
            <Home size={18} />
            <span>Voltar para Home</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const MenuSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, children }) => (
  <div className="bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-white font-medium text-sm">{title}</span>
      </div>
      <ChevronDown 
        size={18} 
        className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
      />
    </button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="overflow-hidden"
        >
          <div className="p-2 pt-0 space-y-1">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-all text-left"
  >
    <span className="text-white/60">{icon}</span>
    <span className="text-white/80 text-sm">{label}</span>
  </button>
);

// ============================================
// WELCOME SCREEN - Premium Simplificado
// ============================================
const WelcomeScreen: React.FC<{
  onCreateProject: () => void;
  onOpenProjects: () => void;
  onExploreTemplates: () => void;
}> = ({ onCreateProject, onOpenProjects, onExploreTemplates }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d12] to-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a962] to-[#a08040] flex items-center justify-center">
            <span className="text-[#0a0a0f] font-bold text-xl">C</span>
          </div>
          <span className="text-white font-bold text-xl">CasaPro</span>
        </div>
        <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm font-medium transition-all">
          Entrar
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Design de Interiores{' '}
            <span className="bg-gradient-to-r from-[#c9a962] to-[#e8d5a3] bg-clip-text text-transparent">
              Inteligente
            </span>
          </h1>
          
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            Crie plantas baixas profissionais em 2D e visualize em 3D com auxílio de IA
          </p>

          {/* Botões Principais */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateProject}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#c9a962] to-[#a08040] text-[#0a0a0f] font-bold text-lg shadow-xl shadow-[#c9a962]/20"
            >
              <Compass size={22} />
              <span>Criar Projeto</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenProjects}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all"
            >
              <FolderOpen size={22} />
              <span>Meus Projetos</span>
            </motion.button>
          </div>

          {/* Templates */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16"
          >
            <p className="text-white/40 text-sm mb-6 uppercase tracking-wider">Templates Populares</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Sala', 'Cozinha', 'Quarto', 'Escritório'].map((room, i) => (
                <button
                  key={room}
                  onClick={onExploreTemplates}
                  className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#c9a962]/30 transition-all group"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-white/5 group-hover:bg-[#c9a962]/10 flex items-center justify-center text-2xl">
                    {['🛋️', '🍳', '🛏️', '💼'][i]}
                  </div>
                  <span className="text-white/70 text-sm font-medium group-hover:text-white">{room}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-white/5 text-center">
        <p className="text-white/30 text-sm">
          CasaPro AI © 2024 - Design inteligente para todos
        </p>
      </footer>
    </div>
  );
};

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
        <WelcomeScreen 
          onCreateProject={() => setShowCreateModal(true)}
          onOpenProjects={() => setShowCreateModal(true)}
          onExploreTemplates={() => setShowCreateModal(true)}
        />
        
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
