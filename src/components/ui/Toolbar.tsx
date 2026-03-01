import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import type { ToolMode } from '@/types';
import { 
  MousePointer2, 
  PenTool, 
  Square, 
  DoorOpen, 
  AppWindow, 
  Armchair, 
  Ruler, 
  Eraser,
  Undo2,
  Redo2,
  Save,
  Download,
  Share2,
  Settings,
} from 'lucide-react';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, isActive, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all duration-200 flex-shrink-0
      ${isActive 
        ? 'bg-[#c9a962] text-[#1a1a1a]' 
        : 'bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
    title={label}
  >
    {icon}
    <span className="text-[10px] mt-1">{label}</span>
  </button>
);

const Toolbar: React.FC = () => {
  const { 
    toolMode, 
    setToolMode, 
    undo, 
    redo, 
    historyIndex, 
    history,
    currentProject,
    saveProject,
  } = useProjectStore();

  const tools: { mode: ToolMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'select', icon: <MousePointer2 size={20} />, label: 'Selecionar' },
    { mode: 'wall', icon: <PenTool size={20} />, label: 'Parede' },
    { mode: 'room', icon: <Square size={20} />, label: 'Cômodo' },
    { mode: 'door', icon: <DoorOpen size={20} />, label: 'Porta' },
    { mode: 'window', icon: <AppWindow size={20} />, label: 'Janela' },
    { mode: 'furniture', icon: <Armchair size={20} />, label: 'Móvel' },
    { mode: 'measure', icon: <Ruler size={20} />, label: 'Medir' },
    { mode: 'eraser', icon: <Eraser size={20} />, label: 'Apagar' },
  ];

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex flex-col bg-[#1a1a1a] border-r border-[#444] p-2 gap-2 overflow-y-auto min-h-0">
      {/* Logo */}
      <div className="flex items-center justify-center py-4 border-b border-[#444] flex-shrink-0">
        <div className="text-[#c9a962] font-bold text-lg">CasaPro</div>
      </div>

      {/* Ferramentas - Container com scroll se necessário */}
      <div className="flex flex-col gap-1 min-h-0 flex-1">
        <div className="text-[10px] text-[#888] uppercase tracking-wider px-1 flex-shrink-0">Ferramentas</div>
        <div className="flex flex-col gap-1 overflow-y-auto min-h-0">
          {tools.map((tool) => (
            <ToolButton
              key={tool.mode}
              icon={tool.icon}
              label={tool.label}
              isActive={toolMode === tool.mode}
              onClick={() => setToolMode(tool.mode)}
            />
          ))}
        </div>
      </div>

      {/* Undo/Redo - Sempre visível */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`
            flex-1 flex items-center justify-center py-3 rounded-lg transition-all
            ${canUndo 
              ? 'bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]' 
              : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
            }
          `}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`
            flex-1 flex items-center justify-center py-3 rounded-lg transition-all
            ${canRedo 
              ? 'bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]' 
              : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
            }
          `}
          title="Refazer (Ctrl+Y)"
        >
          <Redo2 size={18} />
        </button>
      </div>

      {/* Ações - Sempre visível no final */}
      <div className="flex flex-col gap-1 flex-shrink-0 border-t border-[#444] pt-2">
        <div className="text-[10px] text-[#888] uppercase tracking-wider px-1">Ações</div>
        
        <button
          onClick={saveProject}
          disabled={!currentProject}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm
            ${currentProject 
              ? 'bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]' 
              : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
            }
          `}
        >
          <Save size={16} />
          <span className="hidden lg:inline">Salvar</span>
        </button>
        
        <button
          disabled={!currentProject}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm
            ${currentProject 
              ? 'bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]' 
              : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
            }
          `}
        >
          <Download size={16} />
          <span className="hidden lg:inline">Exportar</span>
        </button>
        
        <button
          disabled={!currentProject}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm
            ${currentProject 
              ? 'bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]' 
              : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
            }
          `}
        >
          <Share2 size={16} />
          <span className="hidden lg:inline">Compartilhar</span>
        </button>
        
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]"
        >
          <Settings size={16} />
          <span className="hidden lg:inline">Configurações</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
