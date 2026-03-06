/**
 * FILE: App.tsx
 *
 * O que este arquivo faz:
 * Arquivo principal do aplicativo CasaPro.
 *
 * Responsabilidade:
 * Decidir qual tela mostrar:
 * - WelcomeView (tela inicial)
 * - EditorView (editor completo do projeto)
 */

import React, { useState, useEffect } from 'react';

import EditorView from '@/features/editor/EditorView';
import WelcomeView from '@/features/welcome/WelcomeView';

import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/userStore';

const App: React.FC = () => {

  const [currentView, setCurrentView] = useState<'welcome' | 'editor'>('welcome');

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const { createProject } = useProjectStore();
  const { initialize } = useUserStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleCreateProject = () => {
    createProject('Novo Projeto', '');
    setCurrentView('editor');
  };

  const handleOpenProjects = () => {
    setShowProjectModal(true);
  };

  const handleLoadProject = () => {
    setCurrentView('editor');
    setShowProjectModal(false);
  };

  if (currentView === 'welcome') {
    return (
      <WelcomeView
        handleCreateProject={handleCreateProject}
        handleOpenProjects={handleOpenProjects}
        handleLoadProject={handleLoadProject}
        showProjectModal={showProjectModal}
        setShowProjectModal={setShowProjectModal}
        showTemplatesModal={showTemplatesModal}
        setShowTemplatesModal={setShowTemplatesModal}
        showSubscriptionModal={showSubscriptionModal}
        setShowSubscriptionModal={setShowSubscriptionModal}
      />
    );
  }

  return <EditorView />;
};

export default App;
