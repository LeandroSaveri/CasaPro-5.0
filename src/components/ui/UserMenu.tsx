import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { 
  User, 
  Settings, 
  CreditCard, 
  LogOut, 
  Crown,
  ChevronDown,
  Cloud
} from 'lucide-react';

const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, currentPlan, logout } = useUserStore();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="px-4 py-2 rounded-xl bg-[#c9a962] text-[#0a0a0f] font-semibold text-sm hover:bg-[#d4b76d] transition-colors"
      >
        Entrar
      </motion.button>
    );
  }

  const isPro = currentPlan?.id === 'pro' || currentPlan?.id === 'enterprise';

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all
          ${isOpen 
            ? 'bg-white/10 text-white' 
            : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
          }
        `}
      >
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
          ${isPro 
            ? 'bg-gradient-to-br from-[#c9a962] to-[#b8984f] text-[#0a0a0f]' 
            : 'bg-white/10 text-white'
          }
        `}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium leading-tight">{user?.name?.split(' ')[0]}</div>
          <div className="text-[10px] text-white/50 leading-tight">
            {isPro ? 'Pro' : 'Gratuito'}
          </div>
        </div>

        <ChevronDown 
          size={14} 
          className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a1f] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
            >
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold
                    ${isPro 
                      ? 'bg-gradient-to-br from-[#c9a962] to-[#b8984f] text-[#0a0a0f]' 
                      : 'bg-white/10 text-white'
                    }
                  `}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{user?.name}</div>
                    <div className="text-xs text-white/50 truncate">{user?.email}</div>
                  </div>
                </div>
                
                {isPro && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-[#c9a962]/10 border border-[#c9a962]/30 rounded-lg">
                    <Crown size={14} className="text-[#c9a962]" />
                    <span className="text-xs font-medium text-[#c9a962]">
                      Plano {currentPlan?.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2">
                <MenuItem icon={<User size={16} />} label="Meu Perfil" />
                <MenuItem icon={<Cloud size={16} />} label="Meus Projetos" />
                <MenuItem icon={<CreditCard size={16} />} label="Assinatura" />
                <MenuItem icon={<Settings size={16} />} label="Configurações" />
                
                <div className="border-t border-white/10 my-2" />
                
                <MenuItem 
                  icon={<LogOut size={16} />} 
                  label="Sair" 
                  danger 
                  onClick={handleLogout}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, danger, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
      ${danger 
        ? 'text-red-400 hover:bg-red-500/10' 
        : 'text-white/70 hover:bg-white/5 hover:text-white'
      }
    `}
  >
    <span className={danger ? 'text-red-400' : 'text-white/50'}>{icon}</span>
    {label}
  </motion.button>
);

export default UserMenu;
