import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplateStore } from '@/store/templateStore';
import { X, Layout, ArrowRight } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: () => void;
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const { templates } = useTemplateStore();

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
          className="w-full max-w-5xl max-h-[80vh] bg-[#1a1a1f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Templates Prontos</h2>
                <p className="text-white/50 text-sm">Comece com um projeto pré-configurado</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#c9a962]/30 transition-all cursor-pointer"
                  onClick={onSelectTemplate}
                >
                  <div className="aspect-video bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
                    <Layout size={48} className="text-white/20" />
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        template.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                        template.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {template.difficulty === 'beginner' ? 'Iniciante' :
                         template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                    <p className="text-sm text-white/50 mb-3">{template.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>{template.terrainSize.x}m × {template.terrainSize.y}m</span>
                      <span>{template.rooms.length} cômodos</span>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-[#c9a962]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-4 py-2 bg-[#c9a962] text-[#0a0a0f] rounded-xl font-semibold flex items-center gap-2">
                      Usar Template
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TemplatesModal;
