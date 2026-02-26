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
  Loader2
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
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
            <span className="text-sm text-white/80">Entrar</span>
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

// Interface principal do editor
const EditorInterface: React.FC = () => {
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
              onClick={() => setPanel('ai', !panels.ai)}
              className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                panels.ai 
                  ? 'bg-[#c9a962]/20 text-[#c9a962] border border-[#c9a962]/30' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
              }`}
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">IA</span>
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
              <span className="hidden sm:inline">Propriedades</span>
            </button>

            <div className="h-6 w-px bg-white/20 mx-1" />

            {/* AI Buttons */}
            <button
              onClick={() => setShowDesignSuggestions(true)}
              className="px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
            >
              <Lightbulb size={16} />
              <span className="hidden sm:inline">Sugestões</span>
            </button>
            
            <button
              onClick={() => setShowAIGenerationModal(true)}
              className="px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90"
            >
              <Wand2 size={16} />
              <span className="hidden sm:inline">Gerar com IA</span>
            </button>

            <div className="h-6 w-px bg-white/20 mx-1" />

            {/* User Menu */}
            <UserMenu
              isOpen={true}
              onClose={() => {}}
              onLogin={() => setShowLoginModal(true)}
              onExport={() => setShowExportModal(true)}
            />
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
