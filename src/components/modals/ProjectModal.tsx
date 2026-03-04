import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Plus, X } from "lucide-react";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: () => void;
  onCreateProject: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  onCreateProject
}) => {

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", esc);
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", esc);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18 }}
          >
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">

              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">
                  Projetos
                </h2>

                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">

                <button
                  onClick={onCreateProject}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition"
                >
                  <Plus size={18}/>
                  Criar Novo Projeto
                </button>

                <button
                  onClick={onSelectProject}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition"
                >
                  <FolderOpen size={18}/>
                  Abrir Projeto Existente
                </button>

              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
