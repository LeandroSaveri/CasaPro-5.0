import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  ChevronRight, 
  Layers, 
  Box, 
  Settings, 
  User, 
  LogOut,
  Plus,
  FolderOpen,
  LayoutTemplate,
  Crown,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import Canvas2D from '@/components/canvas/Canvas2D';
import Canvas3D from '@/components/canvas/Canvas3D';
import Toolbar from '@/components/toolbar/Toolbar';
import PropertiesPanel from '@/components/panels/PropertiesPanel';
import LayersPanel from '@/components/panels/LayersPanel';
import projectModal from '@/components/modals/projectModal';
import templatesModal from '@/components/modals/templatesModal';
import subscriptionModal from '@/components/modals/subscriptionModal';
import userMenu from '@/components/ui/userMenu';
import mobileToolbar from '@/components/ui/mobileToolbar';

// ============================================
// TIPOS E INTERFACES
// ============================================

type ViewMode = '2d' | '3d';
type ToolType = 'select' | 'wall' | 'door' | 'window' | 'furniture' | 'measure';

interface Project {
  id: string;
  name: string;
  thumbnail?: string;
  lastModified: Date;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const App: React.FC = () => {
  // Estados principais
  const [currentView, setCurrentView] = useState<ViewMode>('2d');
  const [currentTool, setCurrentTool] = useState<ToolType>('select');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Modais
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Projeto atual
  const { currentProject, setCurrentProject } = useProjectStore();
  
  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
        setRightPanelOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handlers
  const handleNewProject = () => setShowProjectModal(true);
  const handleOpenProject = () => setShowTemplatesModal(true);
  const handleSubscription = () => setShowSubscriptionModal(true);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // Renderização condicional dos modais
  const ProjectModalComponent = projectModal;
  const TemplatesModalComponent = templatesModal;
  const SubscriptionModalComponent = subscriptionModal;
  const UserMenuComponent = userMenu;
  const MobileToolbarComponent = mobileToolbar;

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col">
      {/* ============================================
          HEADER PREMIUM
      ============================================ */}
      <header className="h-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 shrink-0 z-50">
        {/* Logo e Brand */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers size={20} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight">CasaPro</h1>
              <p className="text-xs text-slate-400">5.0 Premium</p>
            </div>
          </div>
        </div>
        
        {/* Centro - Nome do Projeto e View Toggle */}
        <div className="flex items-center gap-4">
          {currentProject && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <FolderOpen size={16} className="text-indigo-400" />
              <span className="text-sm font-medium truncate max-w-[200px]">
                {currentProject.name}
              </span>
            </div>
          )}
          
          {/* Toggle 2D/3D */}
          <div className="flex items-center bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView('2d')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === '2d'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers size={16} />
                2D
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView('3d')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === '3d'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Box size={16} />
                3D
              </span>
            </motion.button>
          </div>
        </div>
        
        {/* Ações direitas */}
        <div className="flex items-center gap-2">
          {/* Fullscreen */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </motion.button>
          
          {/* Premium */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubscription}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 transition-all"
          >
            <Crown size={16} />
            <span className="text-sm font-medium">Premium</span>
          </motion.button>
          
          {/* User Menu */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors relative"
          >
            <User size={20} />
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl py-2 z-50">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800 flex items-center gap-2">
                  <Settings size={16} />
                  Configurações
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800 flex items-center gap-2 text-red-400">
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            )}
          </motion.button>
        </div>
      </header>

      {/* ============================================
          ÁREA PRINCIPAL
      ============================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Esquerda */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-[280px] bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col shrink-0 z-40"
            >
              {/* Toolbar de Ferramentas */}
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Ferramentas
                </h3>
                <Toolbar 
                  currentTool={currentTool}
                  onToolChange={setCurrentTool}
                />
              </div>
              
              {/* Painel de Camadas */}
              <div className="flex-1 overflow-hidden">
                <LayersPanel />
              </div>
              
              {/* Ações de Projeto */}
              <div className="p-4 border-t border-slate-800 space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNewProject}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-all"
                >
                  <Plus size={18} />
                  <span className="font-medium">Novo Projeto</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOpenProject}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-all"
                >
                  <LayoutTemplate size={18} />
                  <span className="font-medium">Templates</span>
                </motion.button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Área do Canvas */}
        <main className="flex-1 relative bg-slate-950">
          <AnimatePresence mode="wait">
            {currentView === '2d' ? (
              <motion.div
                key="2d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Canvas2D 
                  currentTool={currentTool}
                  isMobile={isMobile}
                />
              </motion.div>
            ) : (
              <motion.div
                key="3d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Canvas3D />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Mobile Toolbar */}
          {isMobile && <MobileToolbarComponent />}
        </main>

        {/* Painel Direito - Propriedades */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-[320px] bg-slate-900/50 backdrop-blur-xl border-l border-slate-800 flex flex-col shrink-0 z-40"
            >
              <PropertiesPanel />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================
          MODAIS
      ============================================ */}
      <AnimatePresence>
        {showProjectModal && (
          <ProjectModalComponent 
            onClose={() => setShowProjectModal(false)}
            onCreateProject={(name: string) => {
              setCurrentProject({ id: Date.now().toString(), name, lastModified: new Date() });
              setShowProjectModal(false);
            }}
          />
        )}
        
        {showTemplatesModal && (
          <TemplatesModalComponent 
            onClose={() => setShowTemplatesModal(false)}
            onSelectTemplate={(template: any) => {
              console.log('Template selecionado:', template);
              setShowTemplatesModal(false);
            }}
          />
        )}
        
        {showSubscriptionModal && (
          <SubscriptionModalComponent 
            onClose={() => setShowSubscriptionModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
