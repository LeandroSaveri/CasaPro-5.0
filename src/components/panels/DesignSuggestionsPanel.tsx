import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Layout, Sofa, Palette, Lamp, Layers, Sparkles } from 'lucide-react';
import { aiService, type DesignSuggestion } from '@/services/aiService';
import { useProjectStore } from '@/store/projectStore';
import { toast } from 'sonner';

interface DesignSuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, typeof Layout> = {
  layout: Layout,
  furniture: Sofa,
  color: Palette,
  lighting: Lamp,
  material: Layers,
};

const typeLabels: Record<string, string> = {
  layout: 'Layout',
  furniture: 'Mobiliário',
  color: 'Cores',
  lighting: 'Iluminação',
  material: 'Materiais',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

const priorityLabels: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export default function DesignSuggestionsPanel({ isOpen, onClose }: DesignSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_selectedSuggestion] = useState<DesignSuggestion | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);

  const { currentProject } = useProjectStore();

  useEffect(() => {
    if (isOpen && currentProject) {
      loadSuggestions();
    }
  }, [isOpen, currentProject]);

  const loadSuggestions = async () => {
    if (!currentProject) return;

    setIsLoading(true);
    try {
      const result = await aiService.improveDesign(currentProject);
      setSuggestions(result);
    } catch (error) {
      toast.error('Erro ao carregar sugestões');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: DesignSuggestion) => {
    setAppliedSuggestions(prev => [...prev, suggestion.title]);
    toast.success('Sugestão aplicada!', {
      description: suggestion.title,
    });
  };

  const handleDismissSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const getImpactScore = (suggestion: DesignSuggestion) => {
    const impactScores: Record<string, number> = {
      major: 3,
      minor: 1,
    };
    const priorityScores: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };
    return (impactScores[suggestion.impact] || 1) * (priorityScores[suggestion.priority] || 1);
  };

  // Ordenar sugestões por impacto
  const sortedSuggestions = [...suggestions].sort((a, b) => getImpactScore(b) - getImpactScore(a));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold">Sugestões de Design</h2>
                <p className="text-white/80 text-xs">Melhore seu projeto com IA</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-10 h-10 text-amber-500" />
              </motion.div>
              <p className="text-gray-500 mt-4 text-sm">Analisando seu projeto...</p>
            </div>
          ) : sortedSuggestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhuma sugestão no momento</p>
              <button
                onClick={loadSuggestions}
                className="mt-4 text-amber-600 hover:text-amber-700 text-sm font-medium"
              >
                Analisar novamente
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSuggestions.map((suggestion, index) => {
                const Icon = typeIcons[suggestion.type] || Lightbulb;
                const isApplied = appliedSuggestions.includes(suggestion.title);

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-xl p-4 transition-all ${
                      isApplied
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 hover:border-amber-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isApplied ? 'bg-green-100' : 'bg-amber-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          isApplied ? 'text-green-600' : 'text-amber-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            {typeLabels[suggestion.type]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            priorityColors[suggestion.priority]
                          }`}>
                            {priorityLabels[suggestion.priority]}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 text-sm">
                          {suggestion.title}
                        </h3>
                        <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                          {suggestion.description}
                        </p>

                        {!isApplied && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleApplySuggestion(suggestion)}
                              className="flex-1 px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors"
                            >
                              Aplicar
                            </button>
                            <button
                              onClick={() => handleDismissSuggestion(index)}
                              className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700 transition-colors"
                            >
                              Ignorar
                            </button>
                          </div>
                        )}

                        {isApplied && (
                          <div className="flex items-center gap-2 mt-3 text-green-600 text-xs">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Aplicada</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={loadSuggestions}
            disabled={isLoading}
            className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Gerar Novas Sugestões
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
