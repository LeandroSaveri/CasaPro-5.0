import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X
} from 'lucide-react';

const MobileToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toolMode, setToolMode } = useProjectStore();

  const tools: { mode: ToolMode; icon: React.ReactNode; label: string; color: string }[] = [
    { mode: 'select', icon: <MousePointer2 size={20} />, label: 'Selecionar', color: '#3b82f6' },
    { mode: 'wall', icon: <PenTool size={20} />, label: 'Parede', color: '#c9a962' },
    { mode: 'room', icon: <Square size={20} />, label: 'Cômodo', color: '#10b981' },
    { mode: 'door', icon: <DoorOpen size={20} />, label: 'Porta', color: '#f59e0b' },
    { mode: 'window', icon: <AppWindow size={20} />, label: 'Janela', color: '#06b6d4' },
    { mode: 'furniture', icon: <Armchair size={20} />, label: 'Móvel', color: '#8b5cf6' },
    { mode: 'measure', icon: <Ruler size={20} />, label: 'Medir', color: '#ec4899' },
    { mode: 'eraser', icon: <Eraser size={20} />, label: 'Apagar', color: '#ef4444' },
  ];

  const currentTool = tools.find(t => t.mode === toolMode) || tools[0];

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-40
          ${isOpen 
            ? 'bg-white/10 backdrop-blur-xl border border-white/20' 
            : 'bg-gradient-to-br from-[#c9a962] to-[#b8984f]'
          }
        `}
        style={{
          boxShadow: isOpen 
            ? '0 8px 32px rgba(0,0,0,0.4)' 
            : `0 8px 32px ${currentTool.color}40`
        }}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <div className="text-[#0a0a0f]">
            {currentTool.icon}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed bottom-24 right-6 z-40"
            >
              <div className="grid grid-cols-3 gap-3 p-4 bg-[#1a1a1f]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                {tools.map((tool, index) => (
                  <motion.button
                    key={tool.mode}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setToolMode(tool.mode);
                      setIsOpen(false);
                    }}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-xl transition-all
                      ${toolMode === tool.mode 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        backgroundColor: `${tool.color}20`,
                        color: tool.color 
                      }}
                    >
                      {tool.icon}
                    </div>
                    <span className="text-[10px] font-medium whitespace-nowrap">
                      {tool.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed bottom-6 right-24 z-30"
        >
          <div 
            className="px-3 py-2 rounded-full text-xs font-medium backdrop-blur-xl border"
            style={{ 
              backgroundColor: `${currentTool.color}15`,
              borderColor: `${currentTool.color}30`,
              color: currentTool.color
            }}
          >
            {currentTool.label}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default MobileToolbar;
