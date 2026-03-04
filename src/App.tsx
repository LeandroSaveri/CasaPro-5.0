/**
 * FILE: App.tsx
 *
 * O que este arquivo faz:
 * Arquivo principal do aplicativo CasaPro.
 *
 * Responsabilidade:
 * Decidir qual tela mostrar:
 * - WelcomeScreen (tela inicial)
 * - EditorView (editor completo do projeto)
 */

import React, { useState, useEffect } from 'react';

import EditorView from '@/features/editor/EditorView';

import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/userStore';

import WelcomeScreen from '@/components/welcome/WelcomeScreen';

import ProjectModal from '@/components/modals/ProjectModal';
import TemplatesModal from '@/components/modals/TemplatesModal';
import SubscriptionModal from '@/components/modals/SubscriptionModal';

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

  return <EditorView />;
};

export default App;
