// ============================================
// ARQUIVO 3: src/components/modals/CreateProjectModal.tsx
// ============================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Ruler, Building2, Palette, Sparkles } from 'lucide-react';
import { useTemplateStore } from '@/store/templateStore';
import type { ProjectTemplate, DesignStyle } from '@/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: ProjectConfig) => void;
}

export interface ProjectConfig {
  name: string;
  description: string;
  template: ProjectTemplate | null;
  style: DesignStyle | null;
  terrainSize: { width: number; depth: number };
  unit: 'meters' | 'centimeters' | 'feet';
  wallHeight: number;
  wallThickness: number;
  useAI: boolean;
  aiPrompt?: string;
}

const steps = [
  { id: 'template', title: 'Template', icon: <Building2 size={18} /> },
  { id: 'config', title: 'Configurações', icon: <Ruler size={18} /> },
  { id: 'style', title: 'Estilo', icon: <Palette size={18} /> },
  { id: 'ai', title: 'IA', icon: <Sparkles size={18} /> },
];

const terrainPresets = [
  { name: 'Pequeno', width: 8, depth: 10, icon: '🏠' },
  { name: 'Médio', width: 12, depth: 15, icon: '🏡' },
  { name: 'Grande', width: 20, depth: 25, icon: '🏰' },
  { name: 'Personalizado', width: 0, depth: 0, icon: '⚙️' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { templates, styles } = useTemplateStore();
  
  const [config, setConfig] = useState<ProjectConfig>({
    name: '',
    description: '',
    template: null,
    style: null,
    terrainSize: { width: 12, depth: 15 },
    unit: 'meters',
    wallHeight: 2.8,
    wallThickness: 0.15,
    useAI: false,
    aiPrompt: '',
  });

  const [customTerrain, setCustomTerrain] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    if (!config.name.trim()) return;
    onCreate(config);
    onClose();
    setCurrentStep(0);
    setConfig({
      name: '',
      description: '',
      template: null,
      style: null,
      terrainSize: { width: 12, depth: 15 },
      unit: 'meters',
      wallHeight: 2.8,
      wallThickness: 0.15,
      useAI: false,
      aiPrompt: '',
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return config.name.trim().length > 0;
      case 2:
        return true;
      case 3:
        return !config.useAI || (config.useAI && (config.aiPrompt?.trim().length || 0) > 0);
      default:
        return true;
    }
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
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a1a1f] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Novo Projeto</h2>
              <p className="text-sm text-white/60">Configure seu novo projeto residencial</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center justify-center gap-2 p-4 border-b border-white/10 flex-shrink-0">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    index === currentStep
                      ? 'bg-[#c9a962]/20 text-[#c9a962] border border-[#c9a962]/30'
                      : index < currentStep
                      ? 'bg-white/5 text-white/60'
                      : 'text-white/30'
                  }`}
                >
                  {step.icon}
                  <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight size={16} className="text-white/20" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Template Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Escolha um Template</h3>
                  <p className="text-sm text-white/60">Selecione um template para começar ou comece do zero</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Empty Project Option */}
                  <button
                    onClick={() => setConfig({ ...config, template: null })}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      config.template === null
                        ? 'border-[#c9a962] bg-[#c9a962]/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                      <span className="text-2xl">📄</span>
                    </div>
                    <h4 className="font-semibold text-white mb-1">Projeto em Branco</h4>
                    <p className="text-sm text-white/50">Comece do zero com configurações padrão</p>
                  </button>

                  {/* Template Options */}
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setConfig({ ...config, template })}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        config.template?.id === template.id
                          ? 'border-[#c9a962] bg-[#c9a962]/10'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                        <span className="text-2xl">{template.icon || '🏠'}</span>
                      </div>
                      <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                      <p className="text-sm text-white/50 mb-2">{template.description}</p>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span>{template.rooms} cômodos</span>
                        <span>•</span>
                        <span>{template.area}m²</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Configuration */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Configurações do Projeto</h3>
                  <p className="text-sm text-white/60">Defina as informações básicas do projeto</p>
                </div>

                <div className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Nome do Projeto *
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      placeholder="Ex: Minha Casa dos Sonhos"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#c9a962]/50 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={config.description}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      placeholder="Descreva seu projeto..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#c9a962]/50 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Unit Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Unidade de Medida
                    </label>
                    <div className="flex gap-2">
                      {(['meters', 'centimeters', 'feet'] as const).map((unit) => (
                        <button
                          key={unit}
                          onClick={() => setConfig({ ...config, unit })}
                          className={`px-4 py-2 rounded-lg border transition-all ${
                            config.unit === unit
                              ? 'border-[#c9a962] bg-[#c9a962]/20 text-[#c9a962]'
                              : 'border-white/10 hover:border-white/20 text-white/60'
                          }`}
                        >
                          {unit === 'meters' ? 'Metros' : unit === 'centimeters' ? 'Centímetros' : 'Pés'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terrain Size */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Tamanho do Terreno
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {terrainPresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            if (preset.name === 'Personalizado') {
                              setCustomTerrain(true);
                            } else {
                              setCustomTerrain(false);
                              setConfig({
                                ...config,
                                terrainSize: { width: preset.width, depth: preset.depth },
                              });
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all ${
                            config.terrainSize.width === preset.width && config.terrainSize.depth === preset.depth && !customTerrain
                              ? 'border-[#c9a962] bg-[#c9a962]/10'
                              : preset.name === 'Personalizado' && customTerrain
                              ? 'border-[#c9a962] bg-[#c9a962]/10'
                              : 'border-white/10 hover:border-white/20 bg-white/5'
                          }`}
                        >
                          <div className="text-2xl mb-1">{preset.icon}</div>
                          <div className="text-sm font-medium text-white">{preset.name}</div>
                          {preset.width > 0 && (
                            <div className="text-xs text-white/50">
                              {preset.width}m × {preset.depth}m
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {(customTerrain || config.terrainSize.width !== 0) && (
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs text-white/50 mb-1">Largura (m)</label>
                          <input
                            type="number"
                            value={config.terrainSize.width}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                terrainSize: { ...config.terrainSize, width: parseFloat(e.target.value) || 0 },
                              })
                            }
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#c9a962]/50 focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-white/50 mb-1">Profundidade (m)</label>
                          <input
                            type="number"
                            value={config.terrainSize.depth}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                terrainSize: { ...config.terrainSize, depth: parseFloat(e.target.value) || 0 },
                              })
                            }
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#c9a962]/50 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Wall Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Altura da Parede (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.wallHeight}
                        onChange={(e) => setConfig({ ...config, wallHeight: parseFloat(e.target.value) || 2.8 })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#c9a962]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Espessura da Parede (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.wallThickness}
                        onChange={(e) => setConfig({ ...config, wallThickness: parseFloat(e.target.value) || 0.15 })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#c9a962]/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Style Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Estilo de Design</h3>
                  <p className="text-sm text-white/60">Escolha um estilo para seu projeto</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* No Style Option */}
                  <button
                    onClick={() => setConfig({ ...config, style: null })}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      config.style === null
                        ? 'border-[#c9a962] bg-[#c9a962]/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                      <span className="text-2xl">🎨</span>
                    </div>
                    <h4 className="font-semibold text-white mb-1">Sem Estilo Definido</h4>
                    <p className="text-sm text-white/50">Escolha depois durante o projeto</p>
                  </button>

                  {/* Style Options */}
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setConfig({ ...config, style })}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        config.style?.id === style.id
                          ? 'border-[#c9a962] bg-[#c9a962]/10'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                        <span className="text-2xl">{style.icon || '🏛️'}</span>
                      </div>
                      <h4 className="font-semibold text-white mb-1">{style.name}</h4>
                      <p className="text-sm text-white/50 mb-2">{style.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {style.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: AI Generation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Geração com IA</h3>
                  <p className="text-sm text-white/60">Use inteligência artificial para gerar seu projeto</p>
                </div>

                <div className="space-y-4">
                  {/* AI Toggle */}
                  <button
                    onClick={() => setConfig({ ...config, useAI: !config.useAI })}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      config.useAI
                        ? 'border-[#c9a962] bg-[#c9a962]/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        config.useAI ? 'bg-[#c9a962]/20' : 'bg-white/10'
                      }`}>
                        <Sparkles size={24} className={config.useAI ? 'text-[#c9a962]' : 'text-white/60'} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">Gerar com IA</h4>
                        <p className="text-sm text-white/50">
                          Descreva o que você quer e nossa IA criará o projeto para você
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        config.useAI ? 'border-[#c9a962] bg-[#c9a962]' : 'border-white/30'
                      }`}>
                        {config.useAI && <span className="text-[#0a0a0f] text-xs">✓</span>}
                      </div>
                    </div>
                  </button>

                  {/* AI Prompt */}
                  {config.useAI && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <label className="block text-sm font-medium text-white/80">
                        Descrição do Projeto *
                      </label>
                      <textarea
                        value={config.aiPrompt}
                        onChange={(e) => setConfig({ ...config, aiPrompt: e.target.value })}
                        placeholder="Ex: Uma casa moderna com 3 quartos, sala ampla, cozinha integrada e área de lazer com piscina..."
                        rows={5}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#c9a962]/50 focus:outline-none transition-colors resize-none"
                      />
                      <p className="text-xs text-white/40">
                        Seja específico sobre cômodos, estilo e características desejadas
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10 flex-shrink-0">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              <span>Voltar</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#c9a962] text-[#0a0a0f] font-medium hover:bg-[#d4b56a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{currentStep === steps.length - 1 ? 'Criar Projeto' : 'Próximo'}</span>
                {currentStep < steps.length - 1 && <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateProjectModal;
