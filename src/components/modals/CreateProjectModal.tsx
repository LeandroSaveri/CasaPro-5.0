import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Ruler, Building2, Palette, Sparkles } from 'lucide-react';
import { useTemplateStore } from '@/store/templateStore';
import { useUserStore } from '@/store/userStore';
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
  const { canCreateProject: _canCreateProject, currentPlan: _currentPlan } = useUserStore();
  
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
    // Reset state
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
        return true; // Template is optional
      case 1:
        return config.name.trim().length > 0;
      case 2:
        return true; // Style is optional
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
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a1a1f] border border-white/10 rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold">Novo Projeto</h2>
              <p className="text-sm text-white/60">Configure seu novo projeto residencial</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 p-4 border-b border-white/10">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                    index === currentStep
                      ? 'bg-[#c9a962]/20 text-[#c9a962]'
                      : index < currentStep
                      ? 'text-white/60'
                      : 'text-white/30'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    index === currentStep
                      ? 'bg-[#c9a962] text-[#0a0a0f]'
                      : index < currentStep
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-white/50'
                  }`}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-px ${
                    index < currentStep ? 'bg-white/30' : 'bg-white/10'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {/* Step 1: Template */}
            {currentStep === 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold mb-4">Escolha um template (opcional)</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Blank option */}
                  <button
                    onClick={() => setConfig({ ...config, template: null })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      config.template === null
                        ? 'border-[#c9a962] bg-[#c9a962]/10'
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    <div className="text-3xl mb-2">📄</div>
                    <div className="font-semibold">Em branco</div>
                    <div className="text-sm text-white/60">Comece do zero</div>
                  </button>

                  {/* Templates */}
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setConfig({ ...config, template })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        config.template?.id === template.id
                          ? 'border-[#c9a962] bg-[#c9a962]/10'
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">🏠</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          template.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                          template.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {template.difficulty === 'beginner' ? 'Fácil' :
                           template.difficulty === 'intermediate' ? 'Médio' : 'Difícil'}
                        </span>
                      </div>
                      <div className="font-semibold">{template.name}</div>
                      <div className="text-sm text-white/60">{template.description}</div>
                      <div className="flex gap-2 mt-2 text-xs text-white/40">
                        <span>{template.terrainSize.x}m × {template.terrainSize.y}m</span>
                        <span>•</span>
                        <span>{template.rooms.length} cômodos</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Configuration */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do projeto *</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    placeholder="Ex: Minha Casa dos Sonhos"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#c9a962] focus:outline-none transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                  <textarea
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    placeholder="Descreva seu projeto..."
                    rows={2}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#c9a962] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Tamanho do terreno</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                        className={`p-3 rounded-xl border-2 transition-all ${
                          (preset.name !== 'Personalizado' &&
                            config.terrainSize.width === preset.width &&
                            config.terrainSize.depth === preset.depth) ||
                          (preset.name === 'Personalizado' && customTerrain)
                            ? 'border-[#c9a962] bg-[#c9a962]/10'
                            : 'border-white/10 hover:border-white/30 bg-white/5'
                        }`}
                      >
                        <div className="text-2xl mb-1">{preset.icon}</div>
                        <div className="text-sm font-medium">{preset.name}</div>
                        {preset.width > 0 && (
                          <div className="text-xs text-white/50">
                            {preset.width}m × {preset.depth}m
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {customTerrain && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white/60 mb-1">Largura (m)</label>
                        <input
                          type="number"
                          value={config.terrainSize.width}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              terrainSize: {
                                ...config.terrainSize,
                                width: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:border-[#c9a962] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/60 mb-1">Comprimento (m)</label>
                        <input
                          type="number"
                          value={config.terrainSize.depth}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              terrainSize: {
                                ...config.terrainSize,
                                depth: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:border-[#c9a962] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Unidade de medida</label>
                    <select
                      value={config.unit}
                      onChange={(e) => setConfig({ ...config, unit: e.target.value as any })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#c9a962] focus:outline-none"
                    >
                      <option value="meters">Metros (m)</option>
                      <option value="centimeters">Centímetros (cm)</option>
                      <option value="feet">Pés (ft)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Altura padrão das paredes</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={config.wallHeight}
                        onChange={(e) =>
                          setConfig({ ...config, wallHeight: parseFloat(e.target.value) || 2.8 })
                        }
                        step="0.1"
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#c9a962] focus:outline-none"
                      />
                      <span className="text-white/60">m</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Style */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold mb-4">Escolha um estilo (opcional)</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* No style option */}
                  <button
                    onClick={() => setConfig({ ...config, style: null })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      config.style === null
                        ? 'border-[#c9a962] bg-[#c9a962]/10'
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    <div className="text-3xl mb-2">🎨</div>
                    <div className="font-semibold">Sem estilo definido</div>
                    <div className="text-sm text-white/60">Escolha depois</div>
                  </button>

                  {/* Styles */}
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setConfig({ ...config, style })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        config.style?.id === style.id
                          ? 'border-[#c9a962] bg-[#c9a962]/10'
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <div className="text-3xl mb-2">{style.icon}</div>
                      <div className="font-semibold">{style.name}</div>
                      <div className="text-sm text-white/60">{style.description}</div>
                      <div className="flex gap-1 mt-3">
                        {style.materials.floor.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full border border-white/20"
                            style={{ backgroundColor: style.colors[i === 0 ? 'primary' : i === 1 ? 'secondary' : 'accent'] }}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: AI */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#c9a962]/20 rounded-full mb-4">
                    <Sparkles size={32} className="text-[#c9a962]" />
                  </div>
                  <h3 className="text-lg font-semibold">Gerar com Inteligência Artificial?</h3>
                  <p className="text-sm text-white/60">
                    A IA pode criar um layout inicial baseado na sua descrição
                  </p>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={() => setConfig({ ...config, useAI: false })}
                    className={`px-6 py-3 rounded-xl border-2 transition-all ${
                      !config.useAI
                        ? 'border-[#c9a962] bg-[#c9a962]/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    Não, começar manualmente
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, useAI: true })}
                    className={`px-6 py-3 rounded-xl border-2 transition-all ${
                      config.useAI
                        ? 'border-[#c9a962] bg-[#c9a962]/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    Sim, usar IA
                  </button>
                </div>

                {config.useAI && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Descreva o que você quer
                      </label>
                      <textarea
                        value={config.aiPrompt}
                        onChange={(e) => setConfig({ ...config, aiPrompt: e.target.value })}
                        placeholder="Ex: Casa moderna com 3 quartos, suíte master, área gourmet com piscina e cozinha integrada..."
                        rows={4}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:border-[#c9a962] focus:outline-none transition-colors resize-none"
                        autoFocus
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Casa moderna minimalista',
                        'Sobrado contemporâneo',
                        'Casa com área gourmet',
                        'Studio compacto',
                        'Casa rústica aconchegante',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setConfig({ ...config, aiPrompt: suggestion })}
                          className="px-3 py-1.5 text-sm bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 hover:border-white/30 transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentStep === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'hover:bg-white/10'
              }`}
            >
              <ChevronLeft size={18} />
              Voltar
            </button>

            <div className="flex items-center gap-3">
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#c9a962] text-[#0a0a0f] rounded-lg font-semibold hover:bg-[#d4b76d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Próximo
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#c9a962] text-[#0a0a0f] rounded-lg font-semibold hover:bg-[#d4b76d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Sparkles size={18} />
                  Criar Projeto
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateProjectModal;
