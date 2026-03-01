// ============================================
// ARQUIVO 8: src/components/modals/ExportModal.tsx
// ============================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Image, Box, Loader2, Check } from 'lucide-react';
import type { Project, ExportFormat, ExportOptions } from '@/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const exportFormats: { id: ExportFormat; name: string; icon: React.ReactNode; description: string }[] = [
  { id: 'pdf', name: 'PDF', icon: <FileText className="w-5 h-5" />, description: 'Documento com plantas e medidas' },
  { id: 'png', name: 'PNG', icon: <Image className="w-5 h-5" />, description: 'Imagem de alta qualidade' },
  { id: 'jpg', name: 'JPG', icon: <Image className="w-5 h-5" />, description: 'Imagem compacta' },
  { id: 'dwg', name: 'DWG', icon: <FileText className="w-5 h-5" />, description: 'AutoCAD compatível' },
  { id: 'obj', name: 'OBJ', icon: <Box className="w-5 h-5" />, description: 'Modelo 3D universal' },
  { id: 'fbx', name: 'FBX', icon: <Box className="w-5 h-5" />, description: 'Modelo 3D avançado' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Simula exportação - substituir por lógica real
    setTimeout(() => {
      setIsExporting(false);
      setIsComplete(true);
      setTimeout(() => {
        setIsComplete(false);
        onClose();
      }, 1500);
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
              <div className="w-10 h-10 rounded-xl bg-[#c9a962]/20 flex items-center justify-center border border-[#c9a962]/30">
                <Download className="w-5 h-5 text-[#c9a962]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Exportar Projeto</h2>
                <p className="text-sm text-white/60">{project.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                Formato de Exportação
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {exportFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedFormat === format.id
                        ? 'border-[#c9a962] bg-[#c9a962]/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className={`mb-2 ${selectedFormat === format.id ? 'text-[#c9a962]' : 'text-white/60'}`}>
                      {format.icon}
                    </div>
                    <div className="font-medium text-white text-sm">{format.name}</div>
                    <div className="text-xs text-white/50 mt-1">{format.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-[#c9a962]/20 flex items-center justify-center">
                <span className="text-lg">📐</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Incluir dimensões</div>
                <div className="text-xs text-white/50">Medidas e cotas no export</div>
              </div>
              <div className="ml-auto">
                <div className="w-5 h-5 rounded border border-[#c9a962] bg-[#c9a962] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#0a0a0f]" />
                </div>
              </div>
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
              onClick={handleExport}
              disabled={isExporting || isComplete}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#c9a962] text-[#0a0a0f] font-medium hover:bg-[#d4b56a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isComplete ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Concluído!</span>
                </>
              ) : isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExportModal;
