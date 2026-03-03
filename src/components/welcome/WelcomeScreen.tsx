import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useTemplateStore } from '@/store/templateStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Plus, 
  FolderOpen, 
  Layout, 
  Crown, 
  ArrowRight, 
  Star, 
  Users,
  Zap,
  Shield,
  Globe
} from 'lucide-react';

interface WelcomeScreenProps {
  onCreateProject: () => void;
  onOpenProjects: () => void;
  onExploreTemplates: () => void;
  onSubscribePro: () => void;
}

const stats = [
  { icon: <Layout size={20} strokeWidth={1.5} />, value: '50K+', label: 'Projetos Criados' },
  { icon: <Users size={20} strokeWidth={1.5} />, value: '25K+', label: 'Usuários Ativos' },
  { icon: <Star size={20} strokeWidth={1.5} />, value: '4.9', label: 'Avaliação Média' },
];

const features = [
  {
    icon: <Layout size={24} />,
    title: 'Planta 2D Profissional',
    description: 'Desenhe com precisão milimétrica, snap inteligente e medidas automáticas.',
    gradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
    iconBg: 'bg-blue-500/20 text-blue-400',
  },
  {
    icon: <Globe size={24} />,
    title: 'Visualização 3D Realista',
    description: 'Renderize com iluminação dinâmica, materiais PBR e sombras suaves.',
    gradient: 'from-purple-500/20 via-purple-500/10 to-transparent',
    iconBg: 'bg-purple-500/20 text-purple-400',
  },
  {
    icon: <Zap size={24} />,
    title: 'Biblioteca Premium',
    description: 'Mais de 300 móveis e objetos com texturas realistas e materiais PBR.',
    gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
    iconBg: 'bg-amber-500/20 text-amber-400',
  },
  {
    icon: <Sparkles size={24} />,
    title: 'IA Inteligente',
    description: 'Gere projetos completos com um comando ou melhore seu design automaticamente.',
    gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
];

const testimonials = [
  {
    name: 'Carlos Silva',
    role: 'Arquiteto',
    content: 'O CasaPro AI revolucionou meu workflow. Consigo apresentar projetos em 3D para clientes em minutos.',
    avatar: 'CS',
    color: 'from-blue-400 to-blue-600',
  },
  {
    name: 'Maria Santos',
    role: 'Designer de Interiores',
    content: 'A biblioteca de móveis é incrível e a IA me ajuda a encontrar o estilo perfeito para cada cliente.',
    avatar: 'MS',
    color: 'from-purple-400 to-purple-600',
  },
  {
    name: 'João Pereira',
    role: 'Engenheiro Civil',
    content: 'Precisão técnica excelente. As medidas são exatas e a exportação PDF é perfeita para aprovações.',
    avatar: 'JP',
    color: 'from-emerald-400 to-emerald-600',
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateProject,
  onOpenProjects,
  onExploreTemplates,
  onSubscribePro,
}) => {
  const { isAuthenticated, user } = useUserStore();
  const { templates } = useTemplateStore();
  const [activeTab, setActiveTab] = useState<'home' | 'templates' | 'pricing'>('home');
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#050508] text-white overflow-x-hidden">
      {/* Background Effects Premium */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#c9a962]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Header Premium */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-2xl bg-[#050508]/80 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#c9a962] via-[#d4b76d] to-[#b8984f] rounded-xl flex items-center justify-center shadow-2xl shadow-[#c9a962]/30">
                  <Sparkles className="text-[#050508]" size={24} strokeWidth={2} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-white">CasaPro</span>
                <span className="text-xs text-[#c9a962] ml-1.5 font-bold tracking-wider">AI</span>
              </div>
            </motion.div>

            <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
              {[
                { id: 'home', label: 'Início' },
                { id: 'templates', label: 'Templates' },
                { id: 'pricing', label: 'Preços' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-white/10 text-white shadow-lg'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/50 hidden sm:block">
                    Olá, <span className="text-white font-medium">{user?.name?.split(' ')[0]}</span>
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a962] to-[#b8984f] flex items-center justify-center text-sm font-bold text-[#050508]">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <button className="px-5 py-2.5 text-sm text-white/70 hover:text-white transition-colors font-medium">
                  Entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.main
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            {/* Hero Section */}
            <section className="pt-20 pb-32 px-6">
              <div className="max-w-6xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c9a962]/10 border border-[#c9a962]/30 rounded-full mb-10"
                >
                  <Sparkles className="text-[#c9a962]" size={16} />
                  <span className="text-[#c9a962] text-sm font-semibold">Design com Inteligência Artificial</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
                >
                  Crie Projetos
                  <br />
                  <span className="text-[#c9a962]">Extraordinários</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-white/40 mb-14 max-w-2xl mx-auto"
                >
                  Planta 2D precisa, visualização 3D realista e assistente IA em uma única plataforma.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCreateProject}
                    className="px-10 py-5 bg-gradient-to-r from-[#c9a962] to-[#b8984f] text-[#050508] rounded-2xl font-bold text-lg shadow-2xl shadow-[#c9a962]/30"
                  >
                    <span className="flex items-center justify-center gap-3">
                      <Plus size={24} />
                      Novo Projeto
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenProjects}
                    className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/10"
                  >
                    <span className="flex items-center justify-center gap-3">
                      <FolderOpen size={24} />
                      Meus Projetos
                    </span>
                  </motion.button>
                </motion.div>

                <div className="flex flex-wrap justify-center gap-12">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-4 text-white/40">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">{stat.icon}</div>
                      <div className="text-left">
                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                        <div className="text-sm">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Features */}
            <section className="py-32 px-6 border-t border-white/5">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-20">
                  <h2 className="text-4xl font-bold mb-6">
                    Tudo que você precisa para <span className="text-[#c9a962]">projetar</span>
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      onMouseEnter={() => setHoveredFeature(index)}
                      onMouseLeave={() => setHoveredFeature(null)}
                      className={`p-8 rounded-3xl border transition-all cursor-pointer ${
                        hoveredFeature === index 
                          ? 'bg-white/10 border-white/20 scale-105' 
                          : 'bg-white/[0.02] border-white/5'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.iconBg}`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-white/40">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Pro CTA */}
            <section className="py-32 px-6 border-t border-white/5">
              <div className="max-w-5xl mx-auto">
                <div className="p-10 md:p-16 rounded-[2.5rem] bg-gradient-to-br from-[#c9a962]/10 to-transparent border border-[#c9a962]/20">
                  <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a962]/20 rounded-full mb-6">
                        <Crown size={16} className="text-[#c9a962]" />
                        <span className="text-[#c9a962] text-sm font-bold">PLANO PRO</span>
                      </div>
                      <h2 className="text-4xl font-bold mb-6">
                        Desbloqueie todo o <span className="text-[#c9a962]">potencial</span>
                      </h2>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onSubscribePro}
                        className="px-8 py-4 bg-[#c9a962] text-[#050508] rounded-2xl font-bold text-lg"
                      >
                        Assinar Pro
                        <ArrowRight size={20} className="inline ml-2" />
                      </motion.button>
                    </div>
                    
                    <div className="flex gap-6">
                      {[
                        { label: 'Projetos', value: '∞' },
                        { label: 'Móveis', value: '300+' },
                        { label: 'Renders', value: '100' },
                      ].map((item, i) => (
                        <div key={i} className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                          <div className="text-4xl font-bold text-[#c9a962]">{item.value}</div>
                          <div className="text-sm text-white/60">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="py-32 px-6 border-t border-white/5">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center mb-16">O que nossos usuários dizem</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {testimonials.map((testimonial, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="p-8 bg-white/[0.03] border border-white/10 rounded-3xl"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold`}>
                          {testimonial.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{testimonial.name}</div>
                          <div className="text-sm text-white/40">{testimonial.role}</div>
                        </div>
                      </div>
                      <p className="text-white/60 mb-6">"{testimonial.content}"</p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className="text-[#c9a962] fill-[#c9a962]" />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-6 border-t border-white/5">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a962] to-[#b8984f] flex items-center justify-center">
                    <Sparkles className="text-[#050508]" size={18} />
                  </div>
                  <span className="font-bold text-xl">CasaPro AI</span>
                </div>
                <p className="text-white/30 text-sm">© 2024 CasaPro AI. Todos os direitos reservados.</p>
              </div>
            </footer>
          </motion.main>
        )}

        {activeTab === 'templates' && (
          <motion.main
            key="templates"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 py-20 px-6"
          >
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">Templates Prontos</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden cursor-pointer"
                    onClick={onCreateProject}
                  >
                    <div className="aspect-video bg-white/5 flex items-center justify-center">
                      <Layout size={64} className="text-white/20" />
                    </div>
                    <div className="p-8">
                      <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                      <p className="text-white/40">{template.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.main>
        )}

        {activeTab === 'pricing' && (
          <motion.main
            key="pricing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 py-20 px-6"
          >
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-6">Escolha seu plano</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { name: 'Gratuito', price: 'R$ 0', features: ['Até 3 projetos', 'Biblioteca básica'], highlighted: false },
                  { name: 'Pro', price: 'R$ 49,90', features: ['Projetos ilimitados', 'Biblioteca completa', 'IA avançada'], highlighted: true },
                  { name: 'Empresarial', price: 'R$ 199,90', features: ['Tudo do Pro', 'Múltiplos usuários', 'API'], highlighted: false },
                ].map((plan, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-8 rounded-2xl border ${
                      plan.highlighted 
                        ? 'bg-[#c9a962]/10 border-[#c9a962]' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold mb-6">{plan.price}<span className="text-lg text-white/40">/mês</span></div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-white/60">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#c9a962]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={plan.highlighted ? onSubscribePro : onCreateProject}
                      className={`w-full py-3 rounded-xl font-semibold ${
                        plan.highlighted 
                          ? 'bg-[#c9a962] text-[#050508]' 
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      {plan.highlighted ? 'Assinar Pro' : 'Começar'}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomeScreen;
