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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Interface principal do editor
const EditorInterface: React.FC = () => {
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
      {/* Toolbar - Sempre visível */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <Toolbar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Área principal do canvas */}
      <div className="flex-1 relative">
        {/* Header do projeto */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Toggle Sidebar"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1">
                <div className="w-full h-0.5 bg-white/60" />
                <div className="w-3/4 h-0.5 bg-white/60" />
                <div className="w-full h-0.5 bg-white/60" />
              </div>
            </button>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <div className="text-white font-semibold">{currentProject?.name}</div>
              <div className="text-xs text-white/50">
                {viewMode === '2d' ? 'Planta 2D' : 'Visualização 3D'} • 
                {currentProject?.settings.unit === 'meters' ? ' Metros' : ' Pés'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('2d')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === '2d'
                    ? 'bg-[#c9a962] text-[#0a0a0f]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === '3d'
                    ? 'bg-[#c9a962] text-[#0a0a0f]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                3D
              </button>
            </div>

            <div className="h-6 w-px bg-white/20 mx-1" />

            {/* Panel Toggles */}
            <button
              onClick={() => setPanel('furniture', !panels.furniture)}
              className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                panels.furniture 
                  ? 'bg-[#c9a962]/20 text-[#c9a962] border border-[#c9a962]/30' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
              }`}
            >
              <span>🛋️</span>
              <span className="hidden sm:inline">Móveis</span>
            </button>
            
            <button
              onClick={() => setPanel('properties', !panels.properties)}
              className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                panels.properties 
                  ? 'bg-[#c9a962]/20 text-[#c9a962] border border-[#c9a962]/30' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
              }`}
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Propriedades</span>
            </button>

            <div className="h-6 w-px bg-white/20 mx-1" />

            {/* Menu Button */}
            <button onClick={() => setIsMenuOpen(true)}>
              Menu
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="h-full pt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
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
            className="flex-shrink-0 overflow-hidden"
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
            className="flex-shrink-0 overflow-hidden"
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
            className="flex-shrink-0 overflow-hidden"
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

      {/* Admin Panel - Hidden, accessible via Ctrl+Shift+A */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      <AnimatePresence>
        {isMenuOpen && (
          <SideMenu
            onClose={() => setIsMenuOpen(false)}
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

// SideMenu Component
const SideMenu: React.FC<{
  onClose: () => void;
  setShowDesignSuggestions: (value: boolean) => void;
  setShowAIGenerationModal: (value: boolean) => void;
  setPanel: (key: string, value: boolean) => void;
  panels: any;
}> = ({ onClose, setShowDesignSuggestions, setShowAIGenerationModal, setPanel, panels }) => {
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
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-80 bg-[#0f0f16] border-r border-white/10 h-full overflow-y-auto"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
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
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Projeto Atual */}
          <div className="mb-6 bg-gradient-to-br from-[#c9a962]/20 via-[#c9a962]/5 to-transparent border border-[#c9a962]/40 rounded-2xl p-5 shadow-lg shadow-[#c9a962]/5">
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

          {/* Inteligência AI */}
          <div className="mb-6">
            <button
              onClick={() => setOpenAI(!openAI)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/10 flex items-center justify-center border border-violet-500/20 group-hover:border-violet-500/40 transition-colors">
                  <Sparkles size={18} className="text-violet-400" />
                </div>
                <span className="text-white/90 font-medium group-hover:text-white transition-colors">Inteligência AI</span>
              </div>
              {openAI ? (
                <ChevronDown size={20} className="text-white/50" />
              ) : (
                <ChevronRight size={20} className="text-white/50" />
              )}
            </button>

            {openAI && (
              <div className="mt-2 space-y-1 pl-4">
                <button
                  onClick={() => {
                    setShowDesignSuggestions(true);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[#c9a962]/20 transition-all text-white/80 hover:text-white"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Lightbulb size={16} className="text-amber-400" />
                  </div>
                  <span>Sugestões</span>
                </button>

                <button
                  onClick={() => {
                    setPanel('ai', true);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[#c9a962]/20 transition-all text-white/80 hover:text-white"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#c9a962]/10 flex items-center justify-center">
                    <Sparkles size={16} className="text-[#c9a962]" />
                  </div>
                  <span>IA</span>
                </button>

                <button
                  onClick={() => {
                    setPanel('ai', true);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[#c9a962]/20 transition-all text-white/80 hover:text-white"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Wand2 size={16} className="text-violet-400" />
                  </div>
                  <span>Inteligência Artificial</span>
                </button>

                <button
                  onClick={() => {
                    setShowAIGenerationModal(true);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[#c9a962]/20 transition-all text-white/80 hover:text-white"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/10 flex items-center justify-center">
                    <Wand2 size={16} className="text-violet-400" />
                  </div>
                  <span>Gerar com IA</span>
                </button>
              </div>
            )}
          </div>

          {/* Ferramentas */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-white/30 font-medium mb-3 ml-1">
              Ferramentas
            </p>
            <button
              onClick={() => {
                setPanel('properties', !panels.properties);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border transition-all ${
                panels.properties 
                  ? 'bg-[#c9a962]/10 border-[#c9a962]/40' 
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                panels.properties 
                  ? 'bg-[#c9a962]/20 border-[#c9a962]/40' 
                  : 'bg-white/5 border-white/10'
              }`}>
                <Settings size={18} className={panels.properties ? 'text-[#c9a962]' : 'text-white/60'} />
              </div>
              <span className={`font-medium ${panels.properties ? 'text-[#c9a962]' : 'text-white/90'}`}>
                Propriedades
              </span>
            </button>
          </div>

          {/* Ações */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-white/30 font-medium mb-3 ml-1">
              Ações
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  handleSave();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#c9a962]/30 transition-colors">
                  <svg className="w-5 h-5 text-white/60 group-hover:text-[#c9a962] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <span className="text-white/90 font-medium group-hover:text-white transition-colors">Salvar</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-[#c9a962]/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#c9a962]/30 transition-colors">
                  <svg className="w-5 h-5 text-white/60 group-hover:text-[#c9a962] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <span className="text-white/90 font-medium group-hover:text-white transition-colors">Exportar</span>
              </button>
            </div>
          </div>

          {/* Fechar Projeto */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => {
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
        </div>
      </motion.div>
      <div className="flex-1 bg-black/50" onClick={onClose} />
    </div>
  );
};

// Componente principal
function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentProject, createProject } = useProjectStore();
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
    // Create project with configuration
    createProject(config.name, config.description);
    
    // Apply template if selected
    if (config.template) {
      // TODO: Apply template rooms and settings
    }
    
    // Apply style if selected
    if (config.style) {
      // TODO: Apply style colors and materials
    }
    
    // Close modal and show editor
    setShowCreateModal(false);
    setShowWelcome(false);
  };

  const handleOpenProjects = () => {
    // TODO: Implement projects list view
    setShowCreateModal(true);
  };

  const handleExploreTemplates = () => {
    // TODO: Navigate to templates tab
    setShowCreateModal(true);
  };

  const handleSubscribePro = () => {
    // TODO: Navigate to pricing
    alert('Assinatura Pro - Em breve!');
  };

  if (showWelcome) {
    return (
      <>
        <WelcomeScreen 
          onCreateProject={() => setShowCreateModal(true)}
          onOpenProjects={handleOpenProjects}
          onExploreTemplates={handleExploreTemplates}
          onSubscribePro={handleSubscribePro}
        />
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      </>
    );
  }

  return <EditorInterface />;
}

export default App;
