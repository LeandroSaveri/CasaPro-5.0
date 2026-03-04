import React, { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/userStore';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';
import Toolbar from '@/components/ui/Toolbar';
import Canvas2D from '@/components/canvas/Canvas2D';
import Canvas3D from '@/components/canvas/Canvas3D';
import ProjectModal from '@/modals/ProjectModal'
import TemplatesModal from '@/modals/TemplatesModal'
import SubscriptionModal from '@/modals/SubscriptionModal'
import EditorHeader from '@/features/editor/EditorHeader'
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
        <aside className="w-64 lg:w-72 flex-shrink-0 border-r border-white/10 bg-[#0a0a0f]">
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
              className="fixed left-0 top-14 sm:top-16 bottom-0 w-72 bg-[#0a0a0f] border-r border-white/10 z-50 overflow-y-auto"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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
    createProject('Novo Projeto', '');
    setCurrentView('editor');
    setIsSidebarOpen(false);
  };

  const handleEnterEditor = () => {
    if (!currentProject) {
      createProject('Novo Projeto', '');
    }
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
          onEnterEditor={handleEnterEditor}
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
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      <MainLayout
        sidebar={<Toolbar />}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        isMobile={isMobile}
      >
        <div className="h-full w-full relative">
          {viewMode === '2d' ? <Canvas2D /> : <Canvas3D />}
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
