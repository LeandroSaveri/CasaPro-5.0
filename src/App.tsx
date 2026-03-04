import React, { useState, useEffect, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/userStore';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';
import Toolbar from '@/components/ui/Toolbar';
import Canvas2D from '@/components/canvas/Canvas2D';
import Canvas3D from '@/components/canvas/Canvas3D';
import ProjectModal from '@/components/modals/ProjectModal';
import TemplatesModal from '@/components/modals/TemplatesModal';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import UserMenu from '@/components/ui/UserMenu';
import MobileToolbar from '@/components/ui/MobileToolbar';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  Grid3X3, 
  Box, 
  Save, 
  Share2, 
  Download,
  MoreVertical,
  Settings,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorHeaderProps {
  projectName: string;
  viewMode: '2d' | '3d';
  onViewModeChange: (mode: '2d' | '3d') => void;
  onSave: () => void;
  onBack: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isMobile: boolean;
  onOpenSettings?: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  projectName,
  viewMode,
  onViewModeChange,
  onSave,
  onBack,
  onToggleSidebar,
  isSidebarOpen,
  isMobile,
  onOpenSettings,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <header className="h-14 sm:h-16 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-50">
      {/* ESQUERDA: Logo + Navegação */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Menu Mobile */}
        {isMobile && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSidebar}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </motion.button>
        )}

        {/* Botão Voltar - Desktop */}
        {!isMobile && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <ChevronLeft size={20} />
          </motion.button>
        )}

        {/* Logo + Nome do Projeto */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#b8984f] flex items-center justify-center flex-shrink-0">
            <Grid3X3 size={14} className="text-[#0a0a0f] sm:hidden" />
            <Grid3X3 size={16} className="text-[#0a0a0f] hidden sm:block" />
          </div>
          <h1 className="text-white font-semibold text-sm sm:text-base truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px]">
            {projectName || 'Novo Projeto'}
          </h1>
        </div>
      </div>

      {/* CENTRO: Toggle 2D/3D - Desktop */}
      {!isMobile && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange('2d')}
              className={`
                flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${viewMode === '2d' 
                  ? 'bg-[#c9a962] text-[#0a0a0f] shadow-lg shadow-[#c9a962]/30' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Grid3X3 size={16} />
              <span className="hidden sm:inline">2D</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange('3d')}
              className={`
                flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${viewMode === '3d' 
                  ? 'bg-[#c9a962] text-[#0a0a0f] shadow-lg shadow-[#c9a962]/30' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Box size={16} />
              <span className="hidden sm:inline">3D</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* DIREITA: Ações */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Botão Configurações - Desktop (canto superior direito) */}
        {!isMobile && onOpenSettings && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Configurações da Câmera"
          >
            <Settings size={18} />
          </motion.button>
        )}

        {/* Ações Desktop */}
        {!isMobile && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSave}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#c9a962]/10 border border-[#c9a962]/30 text-[#c9a962] hover:bg-[#c9a962]/20 transition-all text-sm font-medium"
            >
              <Save size={16} />
              <span className="hidden md:inline">Salvar</span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
            >
              <Share2 size={16} />
              <span className="hidden md:inline">Compartilhar</span>
            </motion.button>
          </>
        )}

        {/* Menu Mobile de Ações */}
        {isMobile && (
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowActions(!showActions)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all"
            >
              <MoreVertical size={18} />
            </motion.button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                  <button
                    onClick={() => { onSave(); setShowActions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                  >
                    <Save size={16} className="text-[#c9a962]" />
                    Salvar
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                  >
                    <Share2 size={16} />
                    Compartilhar
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                  >
                    <Download size={16} />
                    Exportar
                  </button>
                  {onOpenSettings && (
                    <>
                      <div className="border-t border-white/10" />
                      <button
                        onClick={() => { onOpenSettings(); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                      >
                        <Settings size={16} />
                        Config. Câmera
                      </button>
                    </>
                  )}
                  <div className="border-t border-white/10" />
                  <button
                    onClick={() => { onViewModeChange(viewMode === '2d' ? '3d' : '2d'); setShowActions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                  >
                    {viewMode === '2d' ? <Box size={16} /> : <Grid3X3 size={16} />}
                    Mudar para {viewMode === '2d' ? '3D' : '2D'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <UserMenu />
      </div>
    </header>
  );
};

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  isMobile: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  sidebar,
  isSidebarOpen,
  onCloseSidebar,
  isMobile,
}) => {
  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Sidebar Desktop - Sempre visível */}
      {!isMobile && (
        <aside className="w-64 lg:w-72 flex-shrink-0 border-r border-white/10 bg-[#0a0a0f] overflow-y-auto">
          {sidebar}
        </aside>
      )}

      {/* Sidebar Mobile - Drawer */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseSidebar}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-14 sm:top-16 bottom-0 w-[280px] bg-[#0a0a0f] border-r border-white/10 z-50 overflow-y-auto"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Área Principal */}
      <main className="flex-1 overflow-hidden bg-[#0a0a0f] relative">
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'welcome' | 'editor'>('welcome');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { 
    currentProject, 
    viewMode, 
    setViewMode, 
    saveProject, 
    createProject
  } = useProjectStore();

  const { initialize } = useUserStore();

  // Detectar mobile com breakpoint mais preciso
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleCreateProject = useCallback(() => {
    createProject('Novo Projeto', '');
    setCurrentView('editor');
    setIsSidebarOpen(false);
  }, [createProject]);

  const handleOpenProjects = useCallback(() => {
    setShowProjectModal(true);
  }, []);

  const handleLoadProject = useCallback(() => {
    setCurrentView('editor');
    setShowProjectModal(false);
    setIsSidebarOpen(false);
  }, []);

  const handleBackToWelcome = useCallback(() => {
    setCurrentView('welcome');
    setIsSidebarOpen(false);
  }, []);

  const handleSaveProject = useCallback(() => {
    if (currentProject) {
      saveProject();
    }
  }, [currentProject, saveProject]);

  // TELA DE BOAS-VINDAS
  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0f]">
        <WelcomeScreen
          onCreateProject={handleCreateProject}
          onOpenProjects={handleOpenProjects}
          onExploreTemplates={() => setShowTemplatesModal(true)}
          onSubscribePro={() => setShowSubscriptionModal(true)}
        />
        
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          onSelectProject={handleLoadProject}
          onCreateProject={handleCreateProject}
        />

        <TemplatesModal
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
          onSelectTemplate={() => {
            handleCreateProject();
            setShowTemplatesModal(false);
          }}
        />

        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
        />
      </div>
    );
  }

  // TELA DO EDITOR
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
      <EditorHeader
        projectName={currentProject?.name || ''}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSave={handleSaveProject}
        onBack={handleBackToWelcome}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        isMobile={isMobile}
        onOpenSettings={() => setShowCameraSettings(true)}
      />

      <MainLayout
        sidebar={<Toolbar />}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        isMobile={isMobile}
      >
        <div className="h-full w-full relative touch-none">
          {viewMode === '2d' ? <Canvas2D /> : <Canvas3D />}
          
          {isMobile && <MobileToolbar />}
        </div>
      </MainLayout>

      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSelectProject={handleLoadProject}
        onCreateProject={handleCreateProject}
      />

      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={() => {
          handleCreateProject();
          setShowTemplatesModal(false);
        }}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Modal de Configurações da Câmera */}
      <AnimatePresence>
        {showCameraSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCameraSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">Configurações da Câmera</h3>
                <button 
                  onClick={() => setShowCameraSettings(false)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/60"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-white/60 text-sm">
                Ajustes de câmera serão implementados aqui.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
