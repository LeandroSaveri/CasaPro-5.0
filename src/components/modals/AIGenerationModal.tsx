// ============================================
// ARQUIVO 6: src/components/modals/AIGenerationModal.tsx
// ============================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Wand2 } from 'lucide-react';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIGenerationModal: React.FC<AIGenerationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // Simula geração - substituir por chamada real à API
    setTimeout(() => {
      setIsGenerating(false);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#1a1a1f] border border-white/10 rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/30">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Gerar com IA</h2>
                <p className="text-sm text-white/60">Descreva o projeto dos seus sonhos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Descrição do Projeto
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Uma casa moderna com 3 quartos, sala ampla com pé direito duplo, cozinha integrada com ilha central, área de lazer com piscina e churrasqueira..."
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {['Casa moderna', 'Apartamento', 'Escritório', 'Cozinha gourmet', 'Quarto infantil'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm text-white/60 hover:text-white transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Gerar Projeto</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIGenerationModal;
