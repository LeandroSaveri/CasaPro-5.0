import React, { useState } from 'react';
import { 
  Menu,
  X,
  ChevronLeft,
  Grid3X3,
  Box,
  Save,
  Share2,
  Download,
  MoreVertical,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserMenu from '@/components/ui/UserMenu';

interface EditorHeaderProps {
  projectName: string;
  viewMode: '2d' | '3d';
  onViewModeChange: (mode: '2d' | '3d') => void;
  onSave: () => void;
  onBack: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isMobile: boolean;
  onOpenSettings?: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  projectName,
  viewMode,
  onViewModeChange,
  onSave,
  onBack,
  onToggleSidebar,
  isSidebarOpen,
  isMobile,
  onOpenSettings
}) => {

  const [showActions, setShowActions] = useState(false);

  return (
    <header className="h-14 sm:h-16 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-50">

      {/* LEFT */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">

        {isMobile && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSidebar}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            {isSidebarOpen ? <X size={18}/> : <Menu size={18}/>}
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all"
          title="Voltar"
        >
          <ChevronLeft size={18}/>
        </motion.button>

        <div className="flex items-center gap-2 ml-1">

          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#c9a962] to-[#b8984f] flex items-center justify-center">
            <Grid3X3 size={14} className="text-[#0a0a0f]" />
          </div>

          <h1 className="text-white font-semibold truncate max-w-[120px] sm:max-w-[200px] text-sm sm:text-base">
            {projectName || 'Novo Projeto'}
          </h1>

        </div>
      </div>


      {/* CENTER */}
      <div className="flex items-center justify-center">

        {!isMobile ? (

          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange('2d')}
              className={`
                flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${viewMode === '2d'
                  ? 'bg-[#c9a962] text-[#0a0a0f]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Grid3X3 size={16}/>
              2D
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange('3d')}
              className={`
                flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${viewMode === '3d'
                  ? 'bg-[#c9a962] text-[#0a0a0f]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Box size={16}/>
              3D
            </motion.button>

          </div>

        ) : (

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <Settings size={18}/>
          </motion.button>

        )}

      </div>


      {/* RIGHT */}
      <div className="flex items-center gap-2">

        {!isMobile && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSave}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#c9a962]/10 border border-[#c9a962]/30 text-[#c9a962] hover:bg-[#c9a962]/20 transition-all text-sm font-medium"
            >
              <Save size={16}/>
              Salvar
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
            >
              <Share2 size={16}/>
              Compartilhar
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
            >
              <Download size={16}/>
              Exportar
            </motion.button>
          </>
        )}


        {isMobile && (

          <div className="relative">

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowActions(!showActions)}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80"
            >
              <MoreVertical size={18}/>
            </motion.button>

            <AnimatePresence>

              {showActions && (

                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >

                  <button
                    onClick={() => {
                      onSave()
                      setShowActions(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/5 text-sm"
                  >
                    <Save size={16}/>
                    Salvar
                  </button>

                  <button className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/5 text-sm">
                    <Share2 size={16}/>
                    Compartilhar
                  </button>

                  <button className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/5 text-sm">
                    <Download size={16}/>
                    Exportar
                  </button>

                  <div className="border-t border-white/10"/>

                  <button
                    onClick={() => {
                      onViewModeChange(viewMode === '2d' ? '3d' : '2d')
                      setShowActions(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/5 text-sm"
                  >
                    {viewMode === '2d'
                      ? <Box size={16}/>
                      : <Grid3X3 size={16}/>
                    }

                    {viewMode === '2d'
                      ? 'Ver 3D'
                      : 'Ver 2D'
                    }

                  </button>

                </motion.div>

              )}

            </AnimatePresence>

          </div>

        )}

        <UserMenu />

      </div>

    </header>
  );
};

export default EditorHeader;
