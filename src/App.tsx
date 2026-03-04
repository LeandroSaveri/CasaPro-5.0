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
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project, ProjectTemplate } from '@/types';

interface EditorHeaderProps {
  projectName: string;
  viewMode: '2d' | '3d';
  onViewModeChange: (mode: '2d' | '3d') => void;
  onSave: () => void;
  onBack: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isMobile: boolean;
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
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <header className="h-16 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isMobile && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSidebar}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all hidden sm:flex"
        >
          <ChevronLeft size={20} />
        </motion.button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#b8984f] flex items-center justify-center flex-shrink-0">
            <Grid3X3 size={16} className="text-[#0a0a0f]" />
          </div>
          <h1 className="text-white font-semibold truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">
            {projectName || 'Novo Projeto'}
          </h1>
        </div>
      </div>

      {!isMobile && (
        <div className="absolute left-1/2 -translate-x-1/2">
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
              <span className="hidden sm:inline">2D</span>
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
              <span className="hidden sm:inline">3D</span>
            </motion.button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isMobile && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9a962]/10 border border-[#c9a962]/30 text-[#c9a962] hover:bg-[#c9a962]/20 transition-all text-sm font-medium"
            >
              <Save size={16} />
              <span className="hidden md:inline">Salvar</span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
            >
              <Share2 size={16} />
              <span className="hidden md:inline">Compartilhar</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
            >
              <Download size={16} />
              <span className="hidden md:inline">Exportar</span>
            </motion.button>
          </>
        )}

        {isMobile && (
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowActions(!showActions)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all"
            >
              <MoreVertical size={20} />
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
      {!isMobile && (
        <aside className="w-72 flex-shrink-0 border-r border-white/10 bg-[#0a0a0f]">
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-16 bottom-0 w-72 bg-[#0a0a0f] border-r border-white/10 z-50 overflow-y-auto"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden bg-[#0a0a0f]">
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { 
    currentProject, 
    viewMode, 
    setViewMode, 
    saveProject, 
    createProject, 
    loadProject
  } = useProjectStore();

  const { initialize } = useUserStore();

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

  const handleCreateProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: 'Novo Projeto',
      description: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      rooms: [],
      furniture: [],
      settings: {
        gridSize: 50,
        snapToGrid: true,
        unit: 'meters',
        wallHeight: 2.8,
        wallThickness: 0.15
      }
    };
    createProject(newProject);
    setCurrentView('editor');
    setIsSidebarOpen(false);
  };

  const handleCreateProjectFromTemplate = (template: ProjectTemplate) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: template.name,
      description: template.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      rooms: template.rooms || [],
      furniture: template.furniture || [],
      settings: {
        gridSize: 50,
        snapToGrid: true,
        unit: 'meters',
        wallHeight: 2.8,
        wallThickness: 0.15
      }
    };
    createProject(newProject);
    setCurrentView('editor');
    setIsSidebarOpen(false);
  };

  const handleOpenProjects = () => {
    setShowProjectModal(true);
  };

  const handleLoadProject = (projectId: string) => {
    loadProject(projectId);
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
          onSelectTemplate={handleCreateProjectFromTemplate}
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
      />

      <MainLayout
        sidebar={<Toolbar />}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        isMobile={isMobile}
      >
        <div className="h-full w-full relative">
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
        onSelectTemplate={handleCreateProjectFromTemplate}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
};

export default App;
