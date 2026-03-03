import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { X, Crown, Check } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { plans, currentPlan, subscribeToPlan } = useUserStore();

  const handleSubscribe = async (planId: string) => {
    const success = await subscribeToPlan(planId);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const planFeatures: Record<string, string[]> = {
    free: [
      'Até 3 projetos',
      'Biblioteca básica (50 móveis)',
      'Exportação PNG',
      'Visualização 2D e 3D',
      '5 solicitações IA/mês',
    ],
    pro: [
      'Projetos ilimitados',
      'Biblioteca completa (300+ móveis)',
      'Exportação PDF técnico',
      'Renderização alta qualidade',
      'IA completa (100/mês)',
      'Materiais PBR',
      'Suporte prioritário',
    ],
    enterprise: [
      'Tudo do plano Pro',
      'Múltiplos usuários',
      'API de integração',
      'White label',
      'Treinamento dedicado',
      'Suporte 24/7',
    ],
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] bg-[#1a1a1f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-white/10 text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a962]/10 border border-[#c9a962]/30 rounded-full mb-4">
              <Crown size={16} className="text-[#c9a962]" />
              <span className="text-[#c9a962] text-sm font-semibold">Escolha seu plano</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Desbloqueie todo o potencial</h2>
            <p className="text-white/50">Comece gratuitamente e evolua conforme suas necessidades</p>
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => {
                const isCurrentPlan = currentPlan?.id === plan.id;
                const isPro = plan.id === 'pro';
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      relative p-6 rounded-2xl border transition-all
                      ${isPro 
                        ? 'bg-gradient-to-br from-[#c9a962]/20 to-[#c9a962]/5 border-[#c9a962] scale-105' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                      }
                      ${isCurrentPlan ? 'ring-2 ring-[#c9a962]' : ''}
                    `}
                  >
                    {isPro && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#c9a962] text-[#0a0a0f] text-xs font-bold rounded-full">
                        MAIS POPULAR
                      </div>
                    )}
                    
                    {isCurrentPlan && (
                      <div className="absolute -top-3 right-4 px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full border border-white/20">
                        Atual
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-white/50">{plan.description}</p>
                    </div>

                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                      </span>
                      {plan.price > 0 && <span className="text-white/50">/mês</span>}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {(planFeatures[plan.id] || plan.features).map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <div className={`
                            w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                            ${isPro ? 'bg-[#c9a962]/20' : 'bg-white/10'}
                          `}>
                            <Check size={12} className={isPro ? 'text-[#c9a962]' : 'text-white/60'} />
                          </div>
                          <span className="text-white/80">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isCurrentPlan}
                      className={`
                        w-full py-3 rounded-xl font-semibold transition-all
                        ${isCurrentPlan
                          ? 'bg-white/10 text-white/40 cursor-not-allowed'
                          : isPro
                            ? 'bg-[#c9a962] text-[#0a0a0f] hover:bg-[#d4b76d]'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }
                      `}
                    >
                      {isCurrentPlan ? 'Plano Atual' : plan.price === 0 ? 'Começar Grátis' : 'Assinar'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubscriptionModal;
