import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { X, Plus, Search, Folder, Clock, Star } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  onCreateProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'all'>('recent');
  
  const { userProjects, deleteProject } = useUserStore();

  const filteredProjects = userProjects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentProjects = filteredProjects.slice(0, 5);

  const displayProjects = activeTab === 'recent' ? recentProjects : filteredProjects;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[80vh] bg-[#1a1a1f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Meus Projetos</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="text"
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#c9a962]/50"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateProject}
                className="flex items-center gap-2 px-6 py-3 bg-[#c9a962] text-[#0a0a0f] rounded-xl font-semibold hover:bg-[#d4b76d] transition-colors"
              >
                <Plus size={18} />
                Novo
              </motion.button>
            </div>
          </div>

          <div className="flex items-center gap-1 px-6 py-3 border-b border-white/10">
            {[
              { id: 'recent', label: 'Recentes', icon: <Clock size={16} /> },
              { id: 'all', label: 'Todos', icon: <Folder size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {displayProjects.length === 0 ? (
              <div className="text-center py-12">
                <Folder size={48} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/40">Nenhum projeto encontrado</p>
                <button
                  onClick={onCreateProject}
                  className="mt-4 text-[#c9a962] hover:underline"
                >
                  Criar novo projeto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-[#c9a962]/30 hover:bg-white/[0.07] transition-all cursor-pointer"
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="aspect-video bg-gradient-to-br from-white/10 to-transparent rounded-xl mb-3 flex items-center justify-center">
                      <Folder size={32} className="text-white/30" />
                    </div>
                    
                    <h3 className="font-semibold truncate mb-1">{project.name}</h3>
                    <p className="text-xs text-white/40">
                      {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-xs">×</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectModal;
