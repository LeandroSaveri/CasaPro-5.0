import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { authService, type AuthCredentials, type RegisterData } from '../../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ViewMode = 'login' | 'register' | 'forgot';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [view, setView] = useState<ViewMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [loginData, setLoginData] = useState<AuthCredentials>({
    email: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
  });

  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await authService.login(loginData);

    setIsLoading(false);

    if (result.success && result.user) {
      setSuccessMessage('Login realizado com sucesso!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccessMessage(null);
      }, 1000);
    } else {
      setError(result.error || 'Erro ao fazer login');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (registerData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    const result = await authService.register(registerData);

    setIsLoading(false);

    if (result.success && result.user) {
      setSuccessMessage('Conta criada com sucesso!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccessMessage(null);
      }, 1000);
    } else {
      setError(result.error || 'Erro ao criar conta');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await authService.resetPassword(forgotEmail);

    setIsLoading(false);

    if (result.success) {
      setSuccessMessage('Email de recuperação enviado!');
      setTimeout(() => {
        setView('login');
        setSuccessMessage(null);
      }, 2000);
    } else {
      setError(result.error || 'Erro ao enviar email');
    }
  };

  const resetForm = () => {
    setError(null);
    setSuccessMessage(null);
    setLoginData({ email: '', password: '' });
    setRegisterData({ email: '', password: '', name: '' });
    setForgotEmail('');
  };

  const switchView = (newView: ViewMode) => {
    setView(newView);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-4 right-4">
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute bottom-4 left-6">
              <h2 className="text-2xl font-bold text-white">
                {view === 'login' && 'Bem-vindo de volta'}
                {view === 'register' && 'Criar conta'}
                {view === 'forgot' && 'Recuperar senha'}
              </h2>
              <p className="text-white/80 text-sm">
                {view === 'login' && 'Entre para acessar seus projetos'}
                {view === 'register' && 'Comece sua jornada no CasaPro AI'}
                {view === 'forgot' && 'Enviaremos um link de recuperação'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-600 dark:text-green-400 text-sm"
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">Lembrar-me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => switchView('forgot')}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Criar conta
                  </button>
                </p>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Demo: Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">demo@casapro.ai</code> / <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">123456</code>
                  </p>
                </div>
              </form>
            )}

            {/* Register Form */}
            {view === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={registerData.name}
                      onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerData.password}
                      onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" required />
                  <span className="text-gray-600 dark:text-gray-400">
                    Concordo com os{' '}
                    <a href="#" className="text-blue-600 hover:underline">Termos de Uso</a>
                    {' '}e{' '}
                    <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Criar conta
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Entrar
                  </button>
                </p>
              </form>
            )}

            {/* Forgot Password Form */}
            {view === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Enviar link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Voltar para login
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoginModal;
