import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate, X } from "lucide-react";

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: () => void;
}

const templates = [
  { id: 1, name: "Sala Moderna" },
  { id: 2, name: "Quarto Minimalista" },
  { id: 3, name: "Cozinha Planejada" },
  { id: 4, name: "Escritório Compacto" }
];

const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", esc);
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", esc);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
          >
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">

              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">
                  Templates
                </h2>

                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X size={20}/>
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4">

                {templates.map(template => (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onSelectTemplate}
                    className="p-6 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition text-left"
                  >
                    <LayoutTemplate className="text-indigo-400 mb-3" size={22}/>
                    <p className="text-white font-medium">
                      {template.name}
                    </p>
                  </motion.button>
                ))}

              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TemplatesModal;
