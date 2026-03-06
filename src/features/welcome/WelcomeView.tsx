/**
 * FILE: WelcomeView.tsx
 *
 * O que este arquivo faz:
 * Tela inicial do aplicativo CasaPro.
 *
 * Responsabilidade:
 * Renderizar a tela de boas-vindas e os modais
 * relacionados a criação e abertura de projetos.
 *
 * Usado por:
 * App.tsx
 */

import React from 'react';

import WelcomeScreen from './WelcomeScreen';

import ProjectModal from '@/components/modals/ProjectModal';
import TemplatesModal from '@/components/modals/TemplatesModal';
import SubscriptionModal from '@/components/modals/SubscriptionModal';

interface WelcomeViewProps {
  handleCreateProject: () => void
  handleOpenProjects: () => void
  handleLoadProject: () => void
  showProjectModal: boolean
  setShowProjectModal: (value: boolean) => void
  showTemplatesModal: boolean
  setShowTemplatesModal: (value: boolean) => void
  showSubscriptionModal: boolean
  setShowSubscriptionModal: (value: boolean) => void
}

const WelcomeView: React.FC<WelcomeViewProps> = ({
  handleCreateProject,
  handleOpenProjects,
  handleLoadProject,
  showProjectModal,
  setShowProjectModal,
  showTemplatesModal,
  setShowTemplatesModal,
  showSubscriptionModal,
  setShowSubscriptionModal
}) => {

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
};

export default WelcomeView;
