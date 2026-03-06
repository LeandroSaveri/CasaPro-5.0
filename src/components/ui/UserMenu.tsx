import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut, Crown } from "lucide-react";

const UserMenu: React.FC = () => {

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = () => setOpen(!open);

  const close = () => setOpen(false);

  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close();
      }
    };

    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", esc);

    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", esc);
    };

  }, []);

  return (
    <div ref={ref} className="relative">

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition"
      >
        <User size={18}/>
      </motion.button>

      <AnimatePresence>

        {open && (

          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
          >

            <div className="px-4 py-3 border-b border-slate-700">

              <p className="text-sm font-medium text-white">
                Usuário
              </p>

              <p className="text-xs text-slate-400">
                conta@casapro.app
              </p>

            </div>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 transition text-sm">

              <User size={16}/>
              Perfil

            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 transition text-sm">

              <Settings size={16}/>
              Configurações

            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-amber-400 hover:bg-slate-800 transition text-sm">

              <Crown size={16}/>
              CasaPro Premium

            </button>

            <div className="border-t border-slate-700"/>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 transition text-sm">

              <LogOut size={16}/>
              Sair

            </button>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  );

};

export default UserMenu;
