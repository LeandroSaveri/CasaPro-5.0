/**
 * FILE: EditorView.tsx
 *
 * O que este arquivo faz:
 * Tela completa do editor do CasaPro.
 *
 * Ele junta:
 * - EditorHeader (barra superior)
 * - EditorLayout (estrutura com sidebar)
 * - Toolbar (ferramentas)
 * - Canvas2D / Canvas3D (área de projeto)
 *
 * Usado por:
 * App.tsx
 *
 * Este arquivo representa toda a interface do editor.
 */

import React, { useState, useEffect } from 'react';

import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/userStore';

import Toolbar from '@/components/ui/Toolbar';
import Canvas2D from '@/components/canvas/Canvas2D';
import Canvas3D from '@/components/canvas/Canvas3D';

import EditorHeader from './EditorHeader';
import MainLayout from './EditorLayout';

const EditorView: React.FC = () => {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const { 
    currentProject, 
    viewMode, 
    setViewMode, 
    saveProject
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

  const handleSaveProject = () => {
    if (currentProject) {
      saveProject();
    }
  };

  const handleBackToWelcome = () => {
    window.location.reload();
  };

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

    </div>
  );
};

export default EditorView;
