/**
 * FILE: EditorHeader.tsx
 * FEATURE: Editor
 *
 * Função:
 * Cabeçalho do editor principal do aplicativo.
 *
 * Responsabilidades:
 * - Mostrar nome do projeto
 * - Alternar visualização 2D / 3D
 * - Botão salvar
 * - Botões compartilhar/exportar
 * - Controle do menu lateral no mobile
 *
 * Usado por:
 * App.tsx
 *
 * Não controla:
 * - Canvas
 * - Sidebar
 * - Layout do editor
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface EditorLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  isSidebarOpen: boolean
  onCloseSidebar: () => void
  isMobile: boolean
}

const EditorLayout: React.FC<EditorLayoutProps> = ({
  children,
  sidebar,
  isSidebarOpen,
  onCloseSidebar,
  isMobile
}) => {

  return (
    <div className="flex-1 flex overflow-hidden relative">

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 lg:w-72 flex-shrink-0 border-r border-white/10 bg-[#0a0a0f]">
          {sidebar}
        </aside>
      )}

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseSidebar}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-14 sm:top-16 bottom-0 w-72 bg-[#0a0a0f] border-r border-white/10 z-50 overflow-y-auto"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Canvas Area */}
      <main className="flex-1 overflow-hidden bg-[#0a0a0f] relative">
        {children}
      </main>

    </div>
  )
}

export default EditorLayout
