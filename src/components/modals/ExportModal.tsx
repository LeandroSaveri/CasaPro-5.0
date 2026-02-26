import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Image,
  Box,
  Code,
  Download,
  Loader2,
  CheckCircle,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cloudService, type ExportOptions } from '../../services/cloudService';
import type { Project } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

type ExportFormat = 'pdf' | 'png' | 'jpg' | 'glb' | 'json';

interface FormatOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
  extension: string;
}

const formats: FormatOption[] = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Relatório completo com medições e especificações',
    icon: <FileText className="w-6 h-6" />,
    extension: 'pdf',
  },
  {
    id: 'png',
    name: 'PNG',
    description: 'Imagem de alta qualidade do projeto 3D',
    icon: <Image className="w-6 h-6" />,
    extension: 'png',
  },
  {
    id: 'jpg',
    name: 'JPG',
    description: 'Imagem compactada do projeto 3D',
    icon: <Image className="w-6 h-6" />,
    extension: 'jpg',
  },
  {
    id: 'glb',
    name: 'GLB',
    description: 'Modelo 3D para importar em outros softwares',
    icon: <Box className="w-6 h-6" />,
    extension: 'glb',
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'Dados do projeto em formato JSON',
    icon: <Code className="w-6 h-6" />,
    extension: 'json',
  },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [showOptions, setShowOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    quality: 'high',
    includeMeasurements: true,
    includeFurniture: true,
  });

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);

    const result = await cloudService.exportProject(project, {
      ...options,
      format: selectedFormat,
    });

    setIsExporting(false);

    if (result.success && result.url) {
      setDownloadUrl(result.url);
      setExportComplete(true);

      // Auto-trigger download
      const link = document.createElement('a');
      link.href = result.url;
      link.download = `${project.name}.${formats.find(f => f.id === selectedFormat)?.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetAndClose = () => {
    setSelectedFormat('pdf');
    setShowOptions(false);
    setIsExporting(false);
    setExportComplete(false);
    setDownloadUrl(null);
    setOptions({
      format: 'pdf',
      quality: 'high',
      includeMeasurements: true,
      includeFurniture: true,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={resetAndClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Exportar Projeto
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {project.name}
              </p>
            </div>
            <button
              onClick={resetAndClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Success State */}
            {exportComplete ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Exportação concluída!
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Seu arquivo foi baixado automaticamente
                </p>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={`${project.name}.${formats.find(f => f.id === selectedFormat)?.extension}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Baixar novamente
                  </a>
                )}
              </motion.div>
            ) : (
              <>
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Formato de exportação
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {formats.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          selectedFormat === format.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          selectedFormat === format.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}>
                          {format.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {format.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format.description}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedFormat === format.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedFormat === format.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div>
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Opções avançadas
                    {showOptions ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showOptions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-4">
                          {/* Quality */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Qualidade
                            </label>
                            <div className="flex gap-2">
                              {(['low', 'medium', 'high'] as const).map((q) => (
                                <button
                                  key={q}
                                  onClick={() => setOptions({ ...options, quality: q })}
                                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                    options.quality === q
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {q === 'low' && 'Baixa'}
                                  {q === 'medium' && 'Média'}
                                  {q === 'high' && 'Alta'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Checkboxes */}
                          <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={options.includeMeasurements}
                                onChange={(e) => setOptions({ ...options, includeMeasurements: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Incluir medições
                              </span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={options.includeFurniture}
                                onChange={(e) => setOptions({ ...options, includeFurniture: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Incluir móveis
                              </span>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Exportar como {formats.find(f => f.id === selectedFormat)?.name}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExportModal;
