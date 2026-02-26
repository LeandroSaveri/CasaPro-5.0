import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Send, Sparkles, Wand2, Palette, Layout, Lightbulb, Check, X } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  
  const { 
    aiRecommendations, 
    isAILoading, 
    generateAIRecommendations, 
    applyAIRecommendation,
    clearAIRecommendations,
    currentProject,
  } = useProjectStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !currentProject) return;
    
    await generateAIRecommendations(prompt);
  };

  const quickPrompts = [
    { icon: <Layout size={14} />, text: 'Sugerir layout para casa moderna' },
    { icon: <Palette size={14} />, text: 'Paleta de cores minimalista' },
    { icon: <Lightbulb size={14} />, text: 'Melhorar iluminação' },
    { icon: <Wand2 size={14} />, text: 'Decorar sala de estar' },
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case 'layout': return <Layout size={18} />;
      case 'style': return <Palette size={18} />;
      case 'color': return <Sparkles size={18} />;
      case 'furniture': return <Wand2 size={18} />;
      case 'lighting': return <Lightbulb size={18} />;
      default: return <Sparkles size={18} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] border-l border-[#444]">
      {/* Header */}
      <div className="p-4 border-b border-[#444]">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="text-[#c9a962]" size={20} />
          <h2 className="text-white font-semibold">Assistente IA</h2>
        </div>
        <p className="text-[#888] text-xs">
          Descreva o que você quer e a IA vai ajudar no design
        </p>
      </div>

      {/* Input Area */}
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Quero uma casa moderna com 2 quartos e área gourmet..."
              className="w-full h-24 bg-[#2a2a2a] border border-[#444] rounded-lg p-3 pr-10 text-white text-sm placeholder-[#666] resize-none focus:outline-none focus:border-[#c9a962]"
              disabled={isAILoading}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isAILoading || !currentProject}
              className={`
                absolute bottom-3 right-3 p-2 rounded-lg transition-all
                ${prompt.trim() && !isAILoading && currentProject
                  ? 'bg-[#c9a962] text-[#1a1a1a] hover:bg-[#b8984f]' 
                  : 'bg-[#3a3a3a] text-[#666] cursor-not-allowed'
                }
              `}
            >
              {isAILoading ? (
                <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </form>

        {/* Quick Prompts */}
        <div className="mt-3">
          <div className="text-[10px] text-[#888] uppercase tracking-wider mb-2">Sugestões rápidas</div>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((quick, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(quick.text)}
                className="flex items-center gap-1 px-2 py-1 bg-[#2a2a2a] border border-[#444] rounded-md text-[#e0e0e0] text-xs hover:border-[#c9a962] hover:text-[#c9a962] transition-all"
              >
                {quick.icon}
                {quick.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="flex-1 overflow-y-auto p-4">
        {aiRecommendations.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <div className="text-[#c9a962] text-sm font-medium">
              {aiRecommendations.length} sugestões encontradas
            </div>
            <button
              onClick={clearAIRecommendations}
              className="p-1 text-[#888] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="space-y-3">
          {aiRecommendations.map((rec, idx) => (
            <div 
              key={idx} 
              className="bg-[#2a2a2a] border border-[#444] rounded-lg p-3 hover:border-[#c9a962] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#c9a962]/20 rounded-lg text-[#c9a962]">
                  {getIconForType(rec.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-white text-sm font-medium">{rec.title}</h3>
                  <p className="text-[#888] text-xs mt-1">{rec.description}</p>
                  
                  {/* Preview de dados */}
                  {rec.data && (
                    <div className="mt-2 p-2 bg-[#1a1a1a] rounded text-xs text-[#e0e0e0]">
                      {rec.type === 'layout' && rec.data.rooms && (
                        <div className="space-y-1">
                          {rec.data.rooms.map((room: any, ridx: number) => (
                            <div key={ridx} className="flex justify-between">
                              <span>{room.name}</span>
                              <span className="text-[#888]">{room.width}m × {room.depth}m</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {rec.type === 'style' && rec.data.colors && (
                        <div className="flex gap-1">
                          {rec.data.colors.map((color: string, cidx: number) => (
                            <div 
                              key={cidx}
                              className="w-6 h-6 rounded border border-[#444]"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      )}
                      {rec.type === 'furniture' && rec.data.items && (
                        <div className="space-y-1">
                          {rec.data.items.map((item: any, iidx: number) => (
                            <div key={iidx} className="flex items-center gap-2">
                              <span>🪑</span>
                              <span>{item.type} - {item.style}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => applyAIRecommendation(rec)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#c9a962] text-[#1a1a1a] rounded-md text-xs font-medium hover:bg-[#b8984f] transition-colors"
                    >
                      <Check size={12} />
                      Aplicar
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a1a] text-[#e0e0e0] rounded-md text-xs hover:bg-[#3a3a3a] transition-colors"
                    >
                      Ver mais
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {aiRecommendations.length === 0 && !isAILoading && (
          <div className="text-center py-8">
            <Sparkles className="mx-auto text-[#444] mb-3" size={48} />
            <p className="text-[#666] text-sm">
              {currentProject 
                ? 'Descreva seu projeto para receber sugestões da IA'
                : 'Crie um projeto primeiro para usar o assistente de IA'
              }
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="p-4 border-t border-[#444]">
        <div className="text-[10px] text-[#888] uppercase tracking-wider mb-2">Dicas</div>
        <div className="space-y-1 text-xs text-[#888]">
          <p>• Seja específico sobre o estilo desejado</p>
          <p>• Mencione o número de cômodos</p>
          <p>• Inclua preferências de cores</p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
