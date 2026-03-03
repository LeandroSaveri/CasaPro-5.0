import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';
import { useTemplateStore } from '@/store/templateStore';
import Toolbar from '@/components/ui/Toolbar';
import Canvas2D from '@/components/canvas/Canvas2D';
import Canvas3D from '@/components/canvas/Canvas3D';
import FurniturePanel from '@/components/ui/FurniturePanel';
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
  Home,
  Menu,
  X,
  Compass,
  Save,
  Download,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const EditorInterface: React.FC<{
  onBackToWelcome: () => void;
}> = ({ onBackToWelcome }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { viewMode, currentProject, selectedElement } = useProjectStore();
  const { panels, setPanel, sidebarOpen, toggleSidebar, setViewMode } = useUIStore();
  const { isAuthenticated, syncProject } = useUserStore();

  const [showAIGenerationModal, setShowAIGenerationModal] = useState(false);
  const [showDesignSuggestions, setShowDesignSuggestions] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

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
    <div className="h-screen w-screen flex bg-[#0a0a0f] overflow-hidden">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 hidden md:block h-full"
          >
            <Toolbar />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="flex-shrink-0 z-10 flex items-center justify-between px-3 sm:px-6 py-3 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2.5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20"
            >
              <Menu size={20} className="text-[#c9a962]" />
            </button>
            
            <div className="hidden sm:block h-6 w-px bg-white/20" />
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#c9a962]" />
                <span className="text-white font-semibold text-sm sm:text-base truncate">
                  {currentProject?.name}
                </span>
              </div>
              <div className="text-xs text-white/40 hidden sm:block">
                {viewMode === '2d' ? 'Planta 2D' : 'Visualização 3D'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center bg-[#1a1a24] border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('2d')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === '2d'
                    ? 'bg-[#c9a962] text-[#0a0a0f]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === '3d'
                    ? 'bg-[#c9a962] text-[#0a0a0f]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                3D
              </button>
            </div>

            <div className="hidden lg:block h-6 w-px bg-white/20 mx-1" />

            <button
              onClick={() => setPanel('furniture', !panels.furniture)}
              className={`hidden lg:flex px-3 py-2 rounded-lg text-sm transition-all items-center gap-2 ${
                panels.furniture 
                  ? 'bg-[#c9a962]/20 text-[#c9a962] border border-[#c9a962]/30' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }`}
            >
              <Box size={16} />
              <span className="hidden xl:inline">Móveis</span>
            </button>
            
            <button
              onClick={() => setPanel('properties', !panels.properties)}
              className={`hidden lg:flex px-3 py-2 rounded-lg text-sm transition-all items-center gap-2 ${
                panels.properties 
                  ? 'bg-[#c9a962]/20 text-[#c9a962] border border-[#c9a962]/30' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }`}
            >
              <Settings size={16} />
              <span className="hidden xl:inline">Propriedades</span>
            </button>

            <button 
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a962] hover:bg-[#d4b76a] transition-all text-[#0a0a0f] font-semibold"
            >
              <Menu size={18} />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>

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

      <AnimatePresence>
        {panels.furniture && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden xl:block flex-shrink-0 h-full"
          >
            <FurniturePanel />
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
            className="hidden xl:block flex-shrink-0 h-full"
          >
            <PropertiesPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <AIGenerationModal isOpen={showAIGenerationModal} onClose={() => setShowAIGenerationModal(false)} />
      <DesignSuggestionsPanel isOpen={showDesignSuggestions} onClose={() => setShowDesignSuggestions(false)} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      {currentProject && <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} project={currentProject} />}
      <AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} />

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
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#0f0f16] border-l border-white/10 overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#0f0f16] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c9a962] flex items-center justify-center">
              <span className="text-[#0a0a0f] font-bold text-lg">C</span>
            </div>
            <div>
              <p className="text-white font-semibold">CasaPro</p>
              <p className="text-xs text-[#c9a962]">Menu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/60">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-[#c9a962]/10 border border-[#c9a962]/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen size={20} className="text-[#c9a962]" />
              <p className="text-xs uppercase text-[#c9a962] font-medium">Projeto Atual</p>
            </div>
            <p className="text-white font-semibold truncate">{currentProject?.name || 'Novo Projeto'}</p>
          </div>

          <div className="bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setOpenAI(!openAI)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Sparkles size={18} className="text-violet-400" />
                </div>
                <span className="text-white font-medium">Inteligência AI</span>
              </div>
              <ChevronDown size={20} className={`text-white/50 transition-transform ${openAI ? 'rotate-180' : ''}`} />
            </button>

            {openAI && (
              <div className="p-3 pt-0 space-y-2">
                <button
                  onClick={() => { setShowDesignSuggestions(true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-all"
                >
                  <Lightbulb size={18} className="text-amber-400" />
                  <span className="text-white/80">Sugestões</span>
                </button>
                <button
                  onClick={() => { setShowAIGenerationModal(true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-all"
                >
                  <Wand2 size={18} className="text-violet-400" />
                  <span className="text-white/80">Gerar com IA</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase text-white/40 font-medium mb-2 ml-1">Ferramentas</p>
            <button
              onClick={() => { setPanel('furniture', !panels.furniture); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all mb-2 ${
                panels.furniture 
                  ? 'bg-[#c9a962]/10 border-[#c9a962]/30 text-[#c9a962]' 
                  : 'bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.06]'
              }`}
            >
              <Box size={20} />
              <span className="font-medium">Móveis</span>
            </button>

            <button
              onClick={() => { setPanel('properties', !panels.properties); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                panels.properties 
                  ? 'bg-[#c9a962]/10 border-[#c9a962]/30 text-[#c9a962]' 
                  : 'bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.06]'
              }`}
            >
              <Settings size={20} />
              <span className="font-medium">Propriedades</span>
            </button>
          </div>

          <div>
            <p className="text-xs uppercase text-white/40 font-medium mb-2 ml-1">Ações</p>
            <button
              onClick={() => { handleSave(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all mb-2 text-white/80"
            >
              <Save size={20} />
              <span className="font-medium">Salvar</span>
            </button>

            <button
              onClick={() => { onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all text-white/80"
            >
              <Download size={20} />
              <span className="font-medium">Exportar</span>
            </button>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => { onBackToWelcome(); onClose(); }}
              className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-[#c9a962] hover:bg-[#d4b76a] transition-all text-[#0a0a0f] font-semibold"
            >
              <Home size={20} />
              <span>Voltar para Home</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

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

  useEffect(() => {
    if (currentProject) setShowWelcome(false);
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
          onSubscribePro={() => alert('Em breve!')}
        />
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => setShowWelcome(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-[#c9a962] hover:bg-[#d4b76a] transition-all text-[#0a0a0f] font-semibold rounded-xl shadow-lg"
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
