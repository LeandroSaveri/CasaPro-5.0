// ============================================
// ARQUIVO 9: src/components/panels/DesignSuggestionsPanel.tsx
// ============================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Sparkles, Palette, Layout, ArrowRight } from 'lucide-react';

interface DesignSuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestions = [
  {
    id: '1',
    type: 'layout',
    title: 'Otimizar fluxo de circulação',
    description: 'Reduzir corredores e integrar espaços sociais para melhorar a mobilidade',
    confidence: 92,
    icon: <Layout className="w-4 h-4" />,
  },
  {
    id: '2',
    type: 'lighting',
    title: 'Aumentar iluminação natural',
    description: 'Adicionar janelas na fachada norte para aproveitar a luz do dia',
    confidence: 88,
    icon: <Lightbulb className="w-4 h-4" />,
  },
  {
    id: '3',
    type: 'color',
    title: 'Paleta neutra com acentos',
    description: 'Usar tons claros nas paredes e móveis escuros para contraste',
    confidence: 85,
    icon: <Palette className="w-4 h-4" />,
  },
  {
    id: '4',
    type: 'furniture',
    title: 'Móveis multifuncionais',
    description: 'Sofá-cama na sala de estar para otimizar espaços pequenos',
    confidence: 79,
    icon: <Sparkles className="w-4 h-4" />,
  },
];

export const DesignSuggestionsPanel: React.FC<DesignSuggestionsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed right-0 top-0 h-full w-96 bg-[#0a0a0f]/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Sugestões de Design</h2>
              <p className="text-xs text-white/50">Powered by AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400">{suggestion.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white text-sm group-hover:text-amber-400 transition-colors">
                      {suggestion.title}
                    </h3>
                  </div>
                  <p className="text-xs text-white/50 mb-2 line-clamp-2">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                          style={{ width: `${suggestion.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40">{suggestion.confidence}%</span>
                    </div>
                    <button className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      Aplicar
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-400 font-medium hover:bg-amber-500/30 transition-all">
            Gerar mais sugestões
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DesignSuggestionsPanel;
