import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X } from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose
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
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">

              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">
                  CasaPro Premium
                </h2>

                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X size={20}/>
                </button>
              </div>

              <div className="p-6 text-center space-y-4">

                <Crown size={40} className="mx-auto text-amber-400"/>

                <p className="text-slate-300">
                  Desbloqueie todos os recursos avançados do CasaPro.
                </p>

                <button className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition">
                  Assinar Premium
                </button>

              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
