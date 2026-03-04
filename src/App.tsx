import React, { useState, useEffect } from 'react';
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
  Crown,
  Maximize2,
  Minimize2,
  Plus,
  FolderOpen,
  LayoutTemplate
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// HEADER PREMIUM - RESPONSIVO
// ============================================

interface EditorHeaderProps {
  projectName: string;
  viewMode: '2d' | '3d';
  onViewModeChange: (mode: '2d' | '3d') => void;
  onSave: () => void;
  onBack: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isMobile: boolean;
  onNewProject: () => void;
  onOpenTemplates: () => void;
  onSubscribe: () => void;
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
  onNewProject,
  onOpenTemplates,
  onSubscribe,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <header className="h-16 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-50 touch-none">
      {/* Esquerda - Logo e Navegação */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {isMobile && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleSidebar}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 active:bg-white/15 transition-all"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 active:bg-white/15 transition-all hidden sm:flex"
        >
          <ChevronLeft size={20} />
        </motion.button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#b8984f] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#c9a962]/20">
            <Grid3X3 size={16} className="text-[#0a0a0f]" />
          </div>
          <div className="hidden sm:block min-w-0">
            <h1 className="text-white font-semibold text-sm leading-tight truncate">
              {projectName || 'Novo Projeto'}
            </h1>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Premium</p>
          </div>
        </div>
      </div>

      {/* Centro - View Toggle (Desktop) / Logo (Mobile) */}
      <div className="flex items-center justify-center">
        {!isMobile ? (
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange('2d')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${viewMode === '2d' 
                  ? 'bg-[#c9a962] text-[#0a0a0f] shadow-lg shadow-[#c9a962]/30' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Grid3X3 size={16} />
              <span className="hidden md:inline">2D</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange('3d')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${viewMode === '3d' 
                  ? 'bg-[#c9a962] text-[#0a0a0f] shadow-lg shadow-[#c9a962]/30' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Box size={16} />
              <span className="hidden md:inline">3D</span>
            </motion.button>
          </div>
        ) : (
          <span className="text-white/60 text-sm font-medium sm:hidden">
            {projectName || 'CasaPro'}
          </span>
        )}
      </div>

      {/* Direita - Ações */}
      <div className="flex items-center gap-1 sm:gap-2">
        {!isMobile ? (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onNewProject}
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#c9a962]/10 border border-[#c9a962]/30 text-[#c9a962] hover:bg-[#c9a962]/20 transition-all text-sm font-medium"
            >
              <Plus size={16} />
              Novo
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenTemplates}
              className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all text-sm font-medium"
            >
              <LayoutTemplate size={16} />
              Templates
            </motion.button>

            <div className="w-px h-6 bg-white/10 mx-1 hidden lg:block" />

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSave}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#c9a962]/10 border border-[#c9a962]/30 text-[#c9a962] hover:bg-[#c9a962]/20 transition-all text-sm font-medium"
            >
              <Save size={16} />
              <span className="hidden md:inline">Salvar</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="hidden sm:flex w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center text-white/80 hover:bg-white/10 transition-all"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSubscribe}
              className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 transition-all text-sm font-medium"
            >
              <Crown size={16} />
              Premium
            </motion.button>
          </>
        ) : (
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowActions(!showActions)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 active:bg-white/15 transition-all"
            >
              <MoreVertical size={20} />
            </motion.button>

            <AnimatePresence>
              {showActions && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowActions(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1f] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                  >
                    <div className="p-2">
                      <button
                        onClick={() => { onNewProject(); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                      >
                        <Plus size={18} className="text-[#c9a962]" />
                        Novo Projeto
                      </button>
                      <button
                        onClick={() => { onOpenTemplates(); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                      >
                        <LayoutTemplate size={18} />
                        Templates
                      </button>
                      <button
                        onClick={() => { onSave(); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                      >
                        <Save size={18} className="text-emerald-400" />
                        Salvar
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                      >
                        <Share2 size={18} />
                        Compartilhar
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                      >
                        <Download size={18} />
                        Exportar
                      </button>
                    </div>
                    <div className="border-t border-white/10 p-2">
                      <button
                        onClick={() => { onViewModeChange(viewMode === '2d' ? '3d' : '2d'); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm"
                      >
                        {viewMode === '2d' ? <Box size={18} /> : <Grid3X3 size={18} />}
                        <span>Mudar para {viewMode === '2d' ? '3D' : '2D'}</span>
                      </button>
                    </div>
                    <div className="border-t border-white/10 p-2">
                      <button
                        onClick={() => { onSubscribe(); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-colors text-sm font-medium"
                      >
                        <Crown size={18} />
                        Assinar Premium
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        <UserMenu />
      </div>
    </header>
  );
};

// ============================================
// MAIN LAYOUT - COM SCROLL OTIMIZADO
// ============================================

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
    <div className="flex-1 flex overflow-hidden relative bg-[#0a0a0f] touch-pan-y">
      {!isMobile && (
        <aside className="w-72 flex-shrink-0 border-r border-white/10 bg-[#0a0a0f] overflow-y-auto">
          {sidebar}
        </aside>
      )}

      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseSidebar}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 touch-none"
            />
            
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-16 bottom-0 w-72 bg-[#0a0a0f] border-r border-white/10 z-50 overflow-y-auto touch-pan-y"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden relative touch-pan-y">
        {children}
      </main>
    </div>
  );
};

// ============================================
// APP PRINCIPAL
// ============================================

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'welcome' | 'editor'>('welcome');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
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

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isSidebarOpen]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleCreateProject = () => {
    createProject('Novo Projeto', '');
    setCurrentView('editor');
    setIsSidebarOpen(false);
  };

  const handleOpenProjects = () => {
    setShowProjectModal(true);
  };

  const handleLoadProject = () => {
    setCurrentView('editor');
    setShowProjectModal(false);
    setIsSidebarOpen(false);
  };

  const handleBackToWelcome = () => {
    setCurrentView('welcome');
    setIsSidebarOpen(false);
  };

  const handleSaveProject = () => {
    if (currentProject) {
      saveProject();
    }
  };

  if (currentView === 'welcome') {
    return (
      <>
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
      </>
    );
  }

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
        onNewProject={handleCreateProject}
        onOpenTemplates={() => setShowTemplatesModal(true)}
        onSubscribe={() => setShowSubscriptionModal(true)}
      />

      <MainLayout
        sidebar={<Toolbar />}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        isMobile={isMobile}
      >
        <div className="h-full w-full relative touch-pan-y">
          <AnimatePresence mode="wait">
            {viewMode === '2d' ? (
              <motion.div
                key="2d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 touch-pan-y"
              >
                <Canvas2D />
              </motion.div>
            ) : (
              <motion.div
                key="3d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 touch-pan-y"
              >
                <Canvas3D />
              </motion.div>
            )}
          </AnimatePresence>
          
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
    </div>
  );
};

export default App;
