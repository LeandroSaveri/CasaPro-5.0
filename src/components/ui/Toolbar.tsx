import React from 'react';
import { useProjectStore } from '@/store/projectStore';
import type { ToolMode } from '@/types';
import { motion } from 'framer-motion';
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
  Grid3X3,
  Box,
  Save,
  Download,
  Share2,
  Settings,
  Layers,
  Wand2
} from 'lucide-react';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ 
  icon, 
  label, 
  isActive, 
  onClick, 
  disabled,
  shortcut 
}) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={`
      group relative flex flex-col items-center justify-center w-full p-3 rounded-xl transition-all duration-200
      ${isActive 
        ? 'bg-gradient-to-br from-[#c9a962] to-[#b8984f] text-[#0a0a0f] shadow-lg shadow-[#c9a962]/30' 
        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
      }
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <div className={`
      p-2 rounded-lg transition-all
      ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}
    `}>
      {icon}
    </div>
    <span className="text-[11px] mt-1.5 font-medium">{label}</span>
    
    {shortcut && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-white/10 rounded text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {shortcut}
      </span>
    )}
  </motion.button>
);

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 px-1 mb-3">
    <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
    <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
      {children}
    </span>
    <div className="h-px flex-1 bg-gradient-to-l from-white/20 to-transparent" />
  </div>
);

const Toolbar: React.FC = () => {
  const { 
    toolMode, 
    viewMode, 
    setToolMode, 
    setViewMode, 
    undo, 
    redo, 
    historyIndex, 
    history,
    currentProject,
    saveProject,
  } = useProjectStore();

  const tools: { mode: ToolMode; icon: React.ReactNode; label: string; shortcut?: string }[] = [
    { mode: 'select', icon: <MousePointer2 size={20} strokeWidth={1.5} />, label: 'Selecionar', shortcut: 'V' },
    { mode: 'wall', icon: <PenTool size={20} strokeWidth={1.5} />, label: 'Parede', shortcut: 'W' },
    { mode: 'room', icon: <Square size={20} strokeWidth={1.5} />, label: 'Cômodo', shortcut: 'R' },
    { mode: 'door', icon: <DoorOpen size={20} strokeWidth={1.5} />, label: 'Porta', shortcut: 'D' },
    { mode: 'window', icon: <AppWindow size={20} strokeWidth={1.5} />, label: 'Janela', shortcut: 'J' },
    { mode: 'furniture', icon: <Armchair size={20} strokeWidth={1.5} />, label: 'Móvel', shortcut: 'M' },
    { mode: 'measure', icon: <Ruler size={20} strokeWidth={1.5} />, label: 'Medir', shortcut: 'E' },
    { mode: 'eraser', icon: <Eraser size={20} strokeWidth={1.5} />, label: 'Apagar', shortcut: 'X' },
  ];

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] p-3 gap-4 overflow-y-auto">
      <div className="flex items-center justify-center py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a962] to-[#b8984f] flex items-center justify-center shadow-lg shadow-[#c9a962]/20">
            <Layers size={20} className="text-[#0a0a0f]" />
          </div>
          <div>
            <div className="text-[#c9a962] font-bold text-lg leading-none">CasaPro</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">AI Studio</div>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader>Visualização</SectionHeader>
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('2d')}
            className={`
              flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all
              ${viewMode === '2d' 
                ? 'bg-[#c9a962] text-[#0a0a0f] shadow-lg shadow-[#c9a962]/30' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <Grid3X3 size={18} strokeWidth={1.5} />
            <span className="text-[11px] font-medium">2D Planta</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('3d')}
            className={`
              flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all
              ${viewMode === '3d' 
                ? 'bg-[#c9a962] text-[#0a0a0f] shadow-lg shadow-[#c9a962]/30' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <Box size={18} strokeWidth={1.5} />
            <span className="text-[11px] font-medium">3D Vista</span>
          </motion.button>
        </div>
      </div>

      <div className="flex-1">
        <SectionHeader>Ferramentas</SectionHeader>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => (
            <ToolButton
              key={tool.mode}
              icon={tool.icon}
              label={tool.label}
              isActive={toolMode === tool.mode}
              onClick={() => setToolMode(tool.mode)}
              shortcut={tool.shortcut}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionHeader>Histórico</SectionHeader>
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: canUndo ? 0.95 : 1 }}
            onClick={undo}
            disabled={!canUndo}
            className={`
              flex items-center justify-center gap-2 py-3 rounded-xl transition-all
              ${canUndo 
                ? 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
              }
            `}
          >
            <Undo2 size={18} strokeWidth={1.5} />
            <span className="text-xs">Desfazer</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: canRedo ? 0.95 : 1 }}
            onClick={redo}
            disabled={!canRedo}
            className={`
              flex items-center justify-center gap-2 py-3 rounded-xl transition-all
              ${canRedo 
                ? 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
              }
            `}
          >
            <Redo2 size={18} strokeWidth={1.5} />
            <span className="text-xs">Refazer</span>
          </motion.button>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <SectionHeader>Ações</SectionHeader>
        <div className="flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: currentProject ? 0.98 : 1 }}
            onClick={saveProject}
            disabled={!currentProject}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm
              ${currentProject 
                ? 'bg-[#c9a962]/10 border border-[#c9a962]/30 text-[#c9a962] hover:bg-[#c9a962]/20' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
              }
            `}
          >
            <Save size={18} strokeWidth={1.5} />
            <span className="font-medium">Salvar Projeto</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: currentProject ? 0.98 : 1 }}
            disabled={!currentProject}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm
              ${currentProject 
                ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
              }
            `}
          >
            <Download size={18} strokeWidth={1.5} />
            <span>Exportar</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: currentProject ? 0.98 : 1 }}
            disabled={!currentProject}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm
              ${currentProject 
                ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
              }
            `}
          >
            <Share2 size={18} strokeWidth={1.5} />
            <span>Compartilhar</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm"
          >
            <Wand2 size={18} strokeWidth={1.5} />
            <span>Assistente IA</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm"
          >
            <Settings size={18} strokeWidth={1.5} />
            <span>Configurações</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
