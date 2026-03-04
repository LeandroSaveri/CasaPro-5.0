import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/userStore';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';
import Toolbar from '@/components/ui/Toolbar';
import Canvas2D from '@/components/canvas/Canvas2D';
import Canvas3D from '@/components/canvas/Canvas3D';

// ============================================
// HEADER PREMIUM
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

  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Logo e Brand */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isMobile && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSidebar}
            className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all hidden sm:flex"
        >
          <ChevronLeft size={20} />
        </motion.button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Grid3X3 size={20} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg text-white leading-tight">CasaPro</h1>
            <p className="text-xs text-slate-400">5.0 Premium</p>
          </div>
        </div>

        {projectName && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50 ml-4">
            <Box size={16} className="text-indigo-400" />
            <span className="text-sm font-medium text-slate-200 truncate max-w-[150px]">
              {projectName}
            </span>
          </div>
        )}
      </div>

      {/* Centro - View Toggle */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewModeChange('2d')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${viewMode === '2d' 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }
            `}
          >
            <Grid3X3 size={16} />
            <span className="hidden sm:inline">2D</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewModeChange('3d')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${viewMode === '3d' 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }
            `}
          >
            <Box size={16} />
            <span className="hidden sm:inline">3D</span>
          </motion.button>
        </div>
      </div>

      {/* Ações Direita */}
      <div className="flex items-center gap-2">
        {!isMobile && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewProject}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition-all text-sm font-medium"
            >
              <Box size={16} />
              Novo
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenTemplates}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all text-sm font-medium"
            >
              <Grid3X3 size={16} />
              Templates
            </motion.button>

            <div className="w-px h-6 bg-slate-700/50 mx-1 hidden lg:block" />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-medium"
            >
              <Save size={16} />
              <span className="hidden md:inline">Salvar</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all text-sm font-medium"
            >
              <Share2 size={16} />
              <span className="hidden lg:inline">Compartilhar</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSubscribe}
              className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 transition-all text-sm font-medium"
            >
              <Box size={16} />
              Premium
            </motion.button>
          </>
        )}

        {isMobile && (
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowActions(!showActions)}
              className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
            >
              <MoreVertical size={20} />
            </motion.button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                  <button
                    onClick={() => { onNewProject(); setShowActions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm"
                  >
                    <Box size={16} className="text-indigo-400" />
                    Novo Projeto
                  </button>
                  <button
                    onClick={() => { onOpenTemplates(); setShowActions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm"
                  >
                    <Grid3X3 size={16} />
                    Templates
                  </button>
                  <button
                    onClick={() => { onSave(); setShowActions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm"
                  >
                    <Save size={16} className="text-emerald-400" />
                    Salvar
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm"
                  >
                    <Share2 size={16} />
                    Compartilhar
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm"
                  >
                    <Download size={16} />
                    Exportar
                  </button>
                  <div className="border-t border-slate-700" />
                  <button
                    onClick={() => { onViewModeChange(viewMode === '2d' ? '3d' : '2d'); setShowActions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm"
                  >
                    {viewMode === '2d' ? <Box size={16} /> : <Grid3X3 size={16} />}
                    Mudar para {viewMode === '2d' ? '3D' : '2D'}
                  </button>
                  <div className="border-t border-slate-700" />
                  <button
                    onClick={() => { onSubscribe(); setShowActions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-amber-400 hover:bg-slate-800 transition-colors text-sm"
                  >
                    <Box size={16} />
                    Premium
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Placeholder para UserMenu */}
        <div className="w-10 h-10 rounded-full bg-slate-700/50 border border-slate-600/50 flex items-center justify-center text-slate-400">
          <Box size={20} />
        </div>
      </div>
    </header>
  );
};

// ============================================
// MAIN LAYOUT
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
    <div className="flex-1 flex overflow-hidden relative bg-slate-950">
      {!isMobile && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-72 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl"
        >
          {sidebar}
        </motion.aside>
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
              className="fixed left-0 top-16 bottom-0 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 z-50 overflow-y-auto"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-hidden relative">
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
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
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
      <WelcomeScreen
        onCreateProject={handleCreateProject}
        onOpenProjects={() => {}}
        onExploreTemplates={() => {}}
        onSubscribePro={() => {}}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
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
        onOpenTemplates={() => {}}
        onSubscribe={() => {}}
      />

      <MainLayout
        sidebar={<Toolbar />}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        isMobile={isMobile}
      >
        <div className="h-full w-full relative">
          <AnimatePresence mode="wait">
            {viewMode === '2d' ? (
              <motion.div
                key="2d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Canvas2D />
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
        </div>
      </MainLayout>
    </div>
  );
};

export default App;
