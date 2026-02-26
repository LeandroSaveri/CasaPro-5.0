import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wand2, Lightbulb, Check } from 'lucide-react';
import { aiService, predefinedPrompts, type AIGenerationRequest } from '@/services/aiService';
import { useProjectStore } from '@/store/projectStore';
import { toast } from 'sonner';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const budgetOptions = [
  { value: 'low', label: 'Econômico', description: 'Materiais acessíveis' },
  { value: 'medium', label: 'Padrão', description: 'Custo-benefício' },
  { value: 'high', label: 'Premium', description: 'Materiais de qualidade' },
  { value: 'luxury', label: 'Luxo', description: 'Acabamentos sofisticados' },
];

const roomOptions = [
  { id: 'living', label: 'Sala de Estar', icon: '🛋️' },
  { id: 'kitchen', label: 'Cozinha', icon: '🍳' },
  { id: 'bedroom', label: 'Quartos', icon: '🛏️' },
  { id: 'bathroom', label: 'Banheiros', icon: '🚿' },
  { id: 'dining', label: 'Sala de Jantar', icon: '🍽️' },
  { id: 'office', label: 'Escritório', icon: '💼' },
  { id: 'outdoor', label: 'Área Externa', icon: '🌳' },
];

export default function AIGenerationModal({ isOpen, onClose }: AIGenerationModalProps) {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [budget, setBudget] = useState<'low' | 'medium' | 'high' | 'luxury'>('medium');
  const [selectedRooms, setSelectedRooms] = useState<string[]>(['living', 'kitchen', 'bedroom', 'bathroom']);
  const [preferences, setPreferences] = useState({
    naturalLight: true,
    openConcept: false,
    accessibility: false,
    sustainability: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const { currentProject, updateProject, addRoom, addWall } = useProjectStore();

  const handlePromptSelect = (promptData: typeof predefinedPrompts[0]) => {
    setPrompt(promptData.prompt);
    setSelectedPrompt(promptData.id);
  };

  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev =>
      prev.includes(roomId)
        ? prev.filter(r => r !== roomId)
        : [...prev, roomId]
    );
  };

  const handleGenerate = async () => {
    if (!currentProject) {
      toast.error('Nenhum projeto ativo');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Descreva o que você deseja gerar');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simular progresso
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      // Usar dimensões padrão ou do projeto
      const terrainWidth = 10;
      const terrainDepth = 10;
      
      const request: AIGenerationRequest = {
        prompt,
        terrainWidth,
        terrainDepth,
        budget,
        rooms: selectedRooms,
        preferences,
      };

      const response = await aiService.generateProject(request);

      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Aplicar projeto gerado
      if (response.project.rooms) {
        response.project.rooms.forEach(room => {
          addRoom(room);
        });
      }
      if (response.project.walls) {
        response.project.walls.forEach(wall => {
          addWall(wall);
        });
      }

      updateProject({
        description: response.project.description || prompt,
      });

      toast.success('Projeto gerado com sucesso!', {
        description: `Custo estimado: R$ ${response.estimatedCost.toLocaleString()}`,
      });

      // Fechar modal após breve delay
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1000);
    } catch (error) {
      clearInterval(progressInterval);
      toast.error('Erro ao gerar projeto', {
        description: 'Tente novamente com uma descrição diferente',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setPrompt('');
    setSelectedPrompt(null);
    setBudget('medium');
    setSelectedRooms(['living', 'kitchen', 'bedroom', 'bathroom']);
    setPreferences({
      naturalLight: true,
      openConcept: false,
      accessibility: false,
      sustainability: false,
    });
    setGenerationProgress(0);
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Gerar com IA</h2>
                  <p className="text-white/80 text-sm">Deixe a inteligência artificial criar seu projeto</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isGenerating}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      step >= s ? 'bg-white text-violet-600' : 'bg-white/20 text-white/60'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-12 h-0.5 transition-colors ${
                        step > s ? 'bg-white' : 'bg-white/20'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {isGenerating ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-6"
                >
                  <Wand2 className="w-16 h-16 text-violet-600" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Gerando seu projeto...
                </h3>
                <p className="text-gray-500 mb-6">
                  A IA está analisando suas preferências e criando o layout ideal
                </p>
                <div className="max-w-md mx-auto">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-600 to-purple-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {Math.round(generationProgress)}% concluído
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Step 1: Prompt */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descreva o que você deseja
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Uma casa moderna com sala integrada, 3 quartos, cozinha americana e área de lazer..."
                        className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Ou escolha uma sugestão
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {predefinedPrompts.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handlePromptSelect(p)}
                            className={`p-4 text-left border rounded-xl transition-all ${
                              selectedPrompt === p.id
                                ? 'border-violet-500 bg-violet-50'
                                : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
                            }`}
                          >
                            <p className="font-medium text-gray-900">{p.label}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.prompt}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Budget & Rooms */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Orçamento
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {budgetOptions.map((b) => (
                          <button
                            key={b.value}
                            onClick={() => setBudget(b.value as typeof budget)}
                            className={`p-4 border rounded-xl text-left transition-all ${
                              budget === b.value
                                ? 'border-violet-500 bg-violet-50'
                                : 'border-gray-200 hover:border-violet-300'
                            }`}
                          >
                            <p className="font-medium text-gray-900">{b.label}</p>
                            <p className="text-xs text-gray-500">{b.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Cômodos Desejados
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {roomOptions.map((room) => (
                          <button
                            key={room.id}
                            onClick={() => toggleRoom(room.id)}
                            className={`px-4 py-2 rounded-full border transition-all flex items-center gap-2 ${
                              selectedRooms.includes(room.id)
                                ? 'border-violet-500 bg-violet-50 text-violet-700'
                                : 'border-gray-200 hover:border-violet-300'
                            }`}
                          >
                            <span>{room.icon}</span>
                            <span className="text-sm">{room.label}</span>
                            {selectedRooms.includes(room.id) && (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Preferences */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Preferências Adicionais
                      </label>
                      <div className="space-y-3">
                        {[
                          { key: 'naturalLight', label: 'Máxima luz natural', icon: '☀️' },
                          { key: 'openConcept', label: 'Conceito aberto', icon: '🚪' },
                          { key: 'accessibility', label: 'Acessibilidade', icon: '♿' },
                          { key: 'sustainability', label: 'Sustentabilidade', icon: '🌱' },
                        ].map((pref) => (
                          <button
                            key={pref.key}
                            onClick={() => setPreferences(p => ({ ...p, [pref.key]: !p[pref.key as keyof typeof p] }))}
                            className={`w-full p-4 border rounded-xl flex items-center gap-3 transition-all ${
                              preferences[pref.key as keyof typeof preferences]
                                ? 'border-violet-500 bg-violet-50'
                                : 'border-gray-200 hover:border-violet-300'
                            }`}
                          >
                            <span className="text-2xl">{pref.icon}</span>
                            <span className="flex-1 text-left">{pref.label}</span>
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                preferences[pref.key as keyof typeof preferences]
                                  ? 'border-violet-500 bg-violet-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {preferences[pref.key as keyof typeof preferences] && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                      <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Dica</p>
                        <p className="text-sm text-amber-700">
                          Quanto mais detalhes você fornecer, melhor será o resultado. 
                          Inclua informações sobre estilo, cores preferidas e necessidades específicas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!isGenerating && (
            <div className="p-6 border-t border-gray-200 flex justify-between">
              {step > 1 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Voltar
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-3">
                {step < 3 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={step === 1 && !prompt.trim()}
                    className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Gerar Projeto
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
