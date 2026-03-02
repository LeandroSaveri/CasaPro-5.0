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
import CameraSettingsModal from '@/components/modals/CameraSettingsModal';
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
  FolderOpen,
  ChevronLeft,
  SlidersHorizontal,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Interface principal do editor
const EditorInterface: React.FC<{
  onCloseProject: () => void;
}> = ({ onCloseProject }) => {
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
  } = useUIStore();

  const { 
    isAuthenticated, 
    user, 
    logout, 
    isSyncing, 
    lastSync, 
    syncAll,
    syncProject 
  } = useUserStore();

  // Estados para modais
  const [showAIGenerationModal, setShowAIGenerationModal] = useState(false);
  const [showDesignSuggestions, setShowDesignSuggestions] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showCameraSettings, setShowCameraSettings] = useState(false);

  // Estado para o menu lateral principal
  const [showMainMenu, setShowMainMenu] = useState(false);

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

  // Handler para fechar projeto
  const handleCloseProject = () => {
    if (currentProject && isAuthenticated) {
      syncProject(currentProject);
    }
    setShowMainMenu(false);
    onCloseProject();
  };

  // Handler para salvar
  const handleSave = async () => {
    if (currentProject) {
      useProjectStore.getState().updateProject({ updatedAt: new Date() });
    }
    setShowMainMenu(false);
  };

  // Handler para sync
  const handleSync = async () => {
    await syncAll();
    setShowMainMenu(false);
  };

  // Handler para logout
  const handleLogout = async () => {
    await logout();
    setShowMainMenu(false);
  };

  return (
    <div className="h-screen w-screen flex bg-[#0a0a0f] overflow-hidden">
      {/* Toolbar - Sempre visível (escondida em mobile) */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden sm:block flex-shrink-0"
          >
            <Toolbar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Área principal do canvas */}
      <div className="flex-1 relative">
        {/* Header Premium */}
        <div className="relative h-16 px-4 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between h-full">
            {/* Esquerda: Toggle + Configurações da Câmera */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                title="Toggle Sidebar"
              >
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                  <div className="w-full h-0.5 bg-white/60" />
                  <div className="w-3/4 h-0.5 bg-white/60" />
                  <div className="w-full h-0.5 bg-white/60" />
                </div>
              </button>

              {/* Ícone de Configurações da Câmera - FUNCIONAL */}
              <button
                onClick={() => setShowCameraSettings(true)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#c9a962]/10 hover:bg-[#c9a962]/20 border border-[#c9a962]/30 transition-all"
                title="Configurações da Câmera"
              >
                <Camera size={18} className="text-[#c9a962]" />
              </button>
            </div>

            {/* Centro: Nome do Projeto - Absolutamente Centralizado */}
            <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <div className="text-white font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-[400px]">
                {currentProject?.name}
              </div>
              <div className="text-xs text-white/50">
                {viewMode === '2d' ? 'Planta 2D' : 'Visualização 3D'} • 
                {currentProject?.settings.unit === 'meters' ? ' Metros' : ' Pés'}
              </div>
            </div>

            {/* Direita: Menu */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMainMenu(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <Menu size={18} className="text-white/70" />
                <span className="text-sm font-medium text-white/80">Menu</span>
              </button>
            </div>
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

      {/* Menu Lateral Premium - Organizado sem duplicações */}
      <AnimatePresence>
        {showMainMenu && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setShowMainMenu(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[380px] bg-[#0f1118] border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              {/* Header do Menu */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Menu</h2>
                <button
                  onClick={() => setShowMainMenu(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <X size={20} className="text-white/70" />
                </button>
              </div>

              {/* Conteúdo Scrollável */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Seção: Projeto Atual */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#c9a962]/10 to-[#c9a962]/5 border border-[#c9a962]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen size={16} className="text-[#c9a962]" />
                    <span className="text-xs font-medium text-[#c9a962] uppercase tracking-wider">Projeto Atual</span>
                  </div>
                  <p className="text-white font-semibold truncate">
                    {currentProject?.name || 'Sem projeto'}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    {currentProject?.settings.unit === 'meters' ? 'Metros (m)' : 'Pés (ft)'}
                  </p>
                </div>

                {/* Seção: Inteligência (sem duplicação de IA) */}
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">
                    Inteligência
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setShowDesignSuggestions(true);
                        setShowMainMenu(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                        <Lightbulb size={20} className="text-amber-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">Sugestões</p>
                        <p className="text-xs text-white/40">Ideias de design</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowAIGenerationModal(true);
                        setShowMainMenu(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                        <Wand2 size={20} className="text-violet-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">Gerar com IA</p>
                        <p className="text-xs text-white/40">Criar projeto automaticamente</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setPanel('ai', !panels.ai);
                        setShowMainMenu(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        panels.ai 
                          ? 'bg-[#c9a962]/10 border border-[#c9a962]/30' 
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <div className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                        panels.ai ? 'bg-[#c9a962]/20' : 'bg-white/5'
                      }`}>
                        <Sparkles size={20} className={panels.ai ? 'text-[#c9a962]' : 'text-white/60'} />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`font-medium ${panels.ai ? 'text-[#c9a962]' : 'text-white'}`}>
                          Assistente IA
                        </p>
                        <p className="text-xs text-white/40">Chat inteligente</p>
                      </div>
                      {panels.ai && <div className="w-2 h-2 rounded-full bg-[#c9a962]" />}
                    </button>
                  </div>
                </div>

                {/* Seção: Painéis */}
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">
                    Painéis
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setPanel('furniture', !panels.furniture);
                        setShowMainMenu(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        panels.furniture 
                          ? 'bg-[#c9a962]/10 border border-[#c9a962]/30' 
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <div className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                        panels.furniture ? 'bg-[#c9a962]/20' : 'bg-white/5'
                      }`}>
                        <span className={panels.furniture ? 'text-[#c9a962]' : 'text-white/60'}>🛋️</span>
                      </div>
                      <div className="text-left flex-1">
                        <p className={`font-medium ${panels.furniture ? 'text-[#c9a962]' : 'text-white'}`}>
                          Móveis
                        </p>
                        <p className="text-xs text-white/40">Catálogo</p>
                      </div>
                      {panels.furniture && <div className="w-2 h-2 rounded-full bg-[#c9a962]" />}
                    </button>

                    <button
                      onClick={() => {
                        setPanel('properties', !panels.properties);
                        setShowMainMenu(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        panels.properties 
                          ? 'bg-[#c9a962]/10 border border-[#c9a962]/30' 
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <div className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                        panels.properties ? 'bg-[#c9a962]/20' : 'bg-white/5'
                      }`}>
                        <SlidersHorizontal size={20} className={panels.properties ? 'text-[#c9a962]' : 'text-white/60'} />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`font-medium ${panels.properties ? 'text-[#c9a962]' : 'text-white'}`}>
                          Propriedades
                        </p>
                        <p className="text-xs text-white/40">Configurações</p>
                      </div>
                      {panels.properties && <div className="w-2 h-2 rounded-full bg-[#c9a962]" />}
                    </button>
                  </div>
                </div>

                {/* Seção: Ações */}
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">
                    Ações
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleSave}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5">
                        <Save size={20} className="text-white/60" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">Salvar</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowExportModal(true);
                        setShowMainMenu(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5">
                        <Download size={20} className="text-white/60" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">Exportar</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Seção: Conta (Entrar/Sair) */}
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">
                    Conta
                  </h3>
                  {isAuthenticated && user ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{user.name}</p>
                          <p className="text-xs text-white/50 truncate">{user.email}</p>
                        </div>
                        {isSyncing ? (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : lastSync ? (
                          <Cloud className="w-4 h-4 text-green-400" />
                        ) : (
                          <CloudOff className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      
                      <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
                      >
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5">
                          {isSyncing ? (
                            <Loader2 size={20} className="text-white/60 animate-spin" />
                          ) : (
                            <Cloud size={20} className="text-white/60" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">Sincronizar</p>
                        </div>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-all"
                      >
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10">
                          <LogOut size={20} className="text-red-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-red-400 font-medium">Sair</p>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        setShowMainMenu(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#c9a962]/10 hover:bg-[#c9a962]/20 border border-[#c9a962]/30 transition-all"
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#c9a962]/20">
                        <User size={20} className="text-[#c9a962]" />
                      </div>
                      <div className="text-left">
                        <p className="text-[#c9a962] font-medium">Entrar</p>
                        <p className="text-xs text-[#c9a962]/60">Acesse sua conta</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Footer: Fechar Projeto */}
              <div className="p-4 sm:p-6 border-t border-white/10">
                <button
                  onClick={handleCloseProject}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-all"
                >
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10">
                    <ChevronLeft size={20} className="text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-red-400 font-medium">Fechar Projeto</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <CameraSettingsModal
        isOpen={showCameraSettings}
        onClose={() => setShowCameraSettings(false)}
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

// Componente principal
function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { currentProject, createProject } = useProjectStore();
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

  const handleCreateProject = (config: ProjectConfig) => {
    createProject(config.name, config.description);
    if (config.template) {}
    if (config.style) {}
    setShowCreateModal(false);
    setShowWelcome(false);
  };

  const handleOpenProjects = () => setShowCreateModal(true);
  const handleExploreTemplates = () => setShowCreateModal(true);
  const handleSubscribePro = () => alert('Assinatura Pro - Em breve!');

  const handleCloseProject = () => setShowWelcome(true);

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

  return <EditorInterface onCloseProject={handleCloseProject} />;
}

export default App;
