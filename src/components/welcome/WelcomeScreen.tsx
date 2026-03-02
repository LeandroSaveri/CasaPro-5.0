import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useTemplateStore } from '@/store/templateStore';
import { Sparkles, Plus, FolderOpen, Layout, Crown, ArrowRight, Star, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeScreenProps {
  onCreateProject: () => void;
  onOpenProjects: () => void;
  onExploreTemplates: () => void;
  onSubscribePro: () => void;
}

const stats = [
  { icon: <Layout size={20} />, value: '50K+', label: 'Projetos Criados' },
  { icon: <Users size={20} />, value: '25K+', label: 'Usuários Ativos' },
  { icon: <Star size={20} />, value: '4.9', label: 'Avaliação Média' },
];

const features = [
  {
    icon: '📐',
    title: 'Planta 2D Profissional',
    description: 'Desenhe com precisão milimétrica, snap inteligente e medidas automáticas.',
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: '🏠',
    title: 'Visualização 3D Realista',
    description: 'Renderize com iluminação dinâmica, materiais PBR e sombras suaves.',
    color: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: '🛋️',
    title: 'Biblioteca Premium',
    description: 'Mais de 300 móveis e objetos com texturas realistas e materiais PBR.',
    color: 'from-amber-500/20 to-orange-500/20',
  },
  {
    icon: '🤖',
    title: 'IA Inteligente',
    description: 'Gere projetos completos com um comando ou melhore seu design automaticamente.',
    color: 'from-emerald-500/20 to-teal-500/20',
  },
];

const testimonials = [
  {
    name: 'Carlos Silva',
    role: 'Arquiteto',
    content: 'O CasaPro AI revolucionou meu workflow. Consigo apresentar projetos em 3D para clientes em minutos.',
    avatar: '👨‍💼',
  },
  {
    name: 'Maria Santos',
    role: 'Designer de Interiores',
    content: 'A biblioteca de móveis é incrível e a IA me ajuda a encontrar o estilo perfeito para cada cliente.',
    avatar: '👩‍🎨',
  },
  {
    name: 'João Pereira',
    role: 'Engenheiro Civil',
    content: 'Precisão técnica excelente. As medidas são exatas e a exportação PDF é perfeita para aprovações.',
    avatar: '👷',
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c9a962]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-[#0a0a0f]/80 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#c9a962] to-[#b8984f] rounded-xl flex items-center justify-center shadow-lg shadow-[#c9a962]/20">
                <Sparkles className="text-[#0a0a0f]" size={20} />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  CasaPro
                </span>
                <span className="text-xs text-[#c9a962] ml-1 font-medium">AI</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'home', label: 'Início' },
                { id: 'templates', label: 'Templates' },
                { id: 'pricing', label: 'Preços' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/60">Olá, {user?.name?.split(' ')[0]}</span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a962] to-[#b8984f] flex items-center justify-center text-sm font-bold text-[#0a0a0f]">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <button className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10"
          >
            {/* Hero Section */}
            <section className="pt-16 pb-24 px-6">
              <div className="max-w-6xl mx-auto text-center">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a962]/10 border border-[#c9a962]/30 rounded-full mb-8"
                >
                  <Sparkles className="text-[#c9a962]" size={16} />
                  <span className="text-[#c9a962] text-sm font-medium">
                    Design Residencial com Inteligência Artificial
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                >
                  Crie Projetos
                  <br />
                  <span className="bg-gradient-to-r from-[#c9a962] via-[#e8d5a3] to-[#c9a962] bg-clip-text text-transparent">
                    Extraordinários
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl text-white/60 mb-10 max-w-2xl mx-auto"
                >
                  Planta 2D precisa, visualização 3D realista e assistente IA em uma única plataforma profissional.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                >
                  <button
                    onClick={onCreateProject}
                    className="group relative px-8 py-4 bg-gradient-to-r from-[#c9a962] to-[#b8984f] text-[#0a0a0f] rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:shadow-[#c9a962]/30 hover:scale-105"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Plus size={22} />
                      Novo Projeto
                    </span>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button
                    onClick={onOpenProjects}
                    className="px-8 py-4 bg-white/5 border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white/30 transition-all"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <FolderOpen size={22} />
                      Meus Projetos
                    </span>
                  </button>

                  <button
                    onClick={onExploreTemplates}
                    className="px-8 py-4 bg-white/5 border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white/30 transition-all"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Layout size={22} />
                      Templates
                    </span>
                  </button>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap justify-center gap-8"
                >
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-3 text-white/60">
                      <div className="p-2 bg-white/5 rounded-lg">{stat.icon}</div>
                      <div className="text-left">
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-sm">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6 border-t border-white/5">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Tudo que você precisa para{' '}
                    <span className="text-[#c9a962]">projetar</span>
                  </h2>
                  <p className="text-white/60 max-w-xl mx-auto">
                    Ferramentas profissionais de forma simples e intuitiva
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className={`group relative p-6 rounded-2xl bg-gradient-to-br ${feature.color} border border-white/10 hover:border-white/20 transition-all hover:scale-105`}
                    >
                      <div className="text-4xl mb-4">{feature.icon}</div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-white/60">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Pro CTA Section */}
            <section className="py-24 px-6 border-t border-white/5">
              <div className="max-w-4xl mx-auto">
                <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#c9a962]/20 via-[#c9a962]/10 to-transparent border border-[#c9a962]/30 overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a962]/20 rounded-full blur-[80px]" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c9a962]/20 rounded-full mb-4">
                        <Crown size={14} className="text-[#c9a962]" />
                        <span className="text-[#c9a962] text-sm font-medium">Plano Pro</span>
                      </div>
                      <h2 className="text-3xl font-bold mb-3">
                        Desbloqueie todo o potencial
                      </h2>
                      <p className="text-white/60 mb-6">
                        Acesso ilimitado à biblioteca completa, exportação profissional, 
                        renderização em alta qualidade e IA avançada.
                      </p>
                      <button
                        onClick={onSubscribePro}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#c9a962] text-[#0a0a0f] rounded-xl font-semibold hover:bg-[#d4b76d] transition-colors"
                      >
                        Assinar Pro
                        <ArrowRight size={18} />
                      </button>
                    </div>
                    
                    <div className="flex gap-4">
                      {[
                        { label: 'Projetos', value: '∞' },
                        { label: 'Móveis', value: '300+' },
                        { label: 'Renders', value: '100/mês' },
                      ].map((item, i) => (
                        <div key={i} className="text-center p-4 bg-white/5 rounded-xl">
                          <div className="text-2xl font-bold text-[#c9a962]">{item.value}</div>
                          <div className="text-xs text-white/60">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 px-6 border-t border-white/5">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">O que nossos usuários dizem</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {testimonials.map((testimonial, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 bg-white/5 border border-white/10 rounded-2xl"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-3xl">{testimonial.avatar}</div>
                        <div>
                          <div className="font-semibold">{testimonial.name}</div>
                          <div className="text-sm text-white/60">{testimonial.role}</div>
                        </div>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed">
                        "{testimonial.content}"
                      </p>
                      <div className="flex gap-1 mt-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className="text-[#c9a962] fill-[#c9a962]" />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#c9a962] to-[#b8984f] rounded-lg flex items-center justify-center">
                      <Sparkles className="text-[#0a0a0f]" size={16} />
                    </div>
                    <span className="font-bold">CasaPro AI</span>
                  </div>
                  <p className="text-white/40 text-sm">
                    © 2024 CasaPro AI. Todos os direitos reservados.
                  </p>
                  <div className="flex gap-6 text-sm text-white/40">
                    <a href="#" className="hover:text-white transition-colors">Termos</a>
                    <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                    <a href="#" className="hover:text-white transition-colors">Suporte</a>
                  </div>
                </div>
              </div>
            </footer>
          </motion.main>
        )}

        {activeTab === 'templates' && (
          <motion.main
            key="templates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 py-16 px-6"
          >
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Templates Prontos</h2>
                <p className="text-white/60 max-w-xl mx-auto">
                  Comece com um projeto pré-configurado e personalize conforme suas necessidades
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#c9a962]/50 transition-all cursor-pointer"
                    onClick={onCreateProject}
                  >
                    <div className="aspect-video bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                      <Layout size={48} className="text-white/30" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          template.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                          template.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {template.difficulty === 'beginner' ? 'Iniciante' :
                           template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-white/60 mb-4">{template.description}</p>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>{template.terrainSize.x}m × {template.terrainSize.y}m</span>
                        <span>{template.rooms.length} cômodos</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-[#c9a962]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.main>
        )}

        {activeTab === 'pricing' && (
          <motion.main
            key="pricing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 py-16 px-6"
          >
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Escolha seu plano</h2>
                <p className="text-white/60 max-w-xl mx-auto">
                  Comece gratuitamente e evolua conforme suas necessidades
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Gratuito',
                    price: 'R$ 0',
                    period: '/mês',
                    description: 'Perfeito para começar',
                    features: [
                      'Até 3 projetos',
                      'Biblioteca básica (50 móveis)',
                      'Exportação PNG',
                      'Visualização 2D e 3D',
                      '5 solicitações IA/mês',
                    ],
                    cta: 'Começar Grátis',
                    highlighted: false,
                  },
                  {
                    name: 'Pro',
                    price: 'R$ 49,90',
                    period: '/mês',
                    description: 'Para profissionais',
                    features: [
                      'Projetos ilimitados',
                      'Biblioteca completa (300+ móveis)',
                      'Exportação PDF técnico',
                      'Renderização alta qualidade',
                      'IA completa (100/mês)',
                      'Materiais PBR',
                      'Suporte prioritário',
                    ],
                    cta: 'Assinar Pro',
                    highlighted: true,
                  },
                  {
                    name: 'Empresarial',
                    price: 'R$ 199,90',
                    period: '/mês',
                    description: 'Para escritórios',
                    features: [
                      'Tudo do Pro',
                      'Múltiplos usuários',
                      'API de integração',
                      'White label',
                      'Treinamento dedicado',
                      'Suporte 24/7',
                    ],
                    cta: 'Falar com Vendas',
                    highlighted: false,
                  },
                ].map((plan, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative p-6 rounded-2xl ${
                      plan.highlighted
                        ? 'bg-gradient-to-br from-[#c9a962]/20 to-[#c9a962]/5 border-2 border-[#c9a962]'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#c9a962] text-[#0a0a0f] text-xs font-bold rounded-full">
                        MAIS POPULAR
                      </div>
                    )}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-white/60">{plan.description}</p>
                    </div>
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-white/60">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full bg-[#c9a962]/20 flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-[#c9a962]" />
                          </div>
                          <span className="text-white/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={plan.highlighted ? onSubscribePro : onCreateProject}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        plan.highlighted
                          ? 'bg-[#c9a962] text-[#0a0a0f] hover:bg-[#d4b76d]'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {plan.cta}
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

