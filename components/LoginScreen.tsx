import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Github } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { LoginStatus, User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>(LoginStatus.IDLE);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'E-mail é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Digite um e-mail válido';
    
    if (!password) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'A senha deve ter no mínimo 6 caracteres';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validate()) return;

    setStatus(LoginStatus.LOADING);

    // Mock API call simulation
    setTimeout(() => {
      // Mock validation logic
      if (email === 'erro@exemplo.com') {
        setStatus(LoginStatus.ERROR);
        setErrors({ general: 'Credenciais inválidas. Tente novamente.' });
      } else {
        setStatus(LoginStatus.SUCCESS);
        onLoginSuccess({
          email,
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) // Generate name from email
        });
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* Left Side - Visual / Branding */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center p-12">
         {/* Abstract shapes background */}
        <div className="absolute top-0 left-0 w-full h-full bg-indigo-600 overflow-hidden z-0">
           <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
           <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
           <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 text-white max-w-lg space-y-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 mb-8">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold leading-tight">Segurança simplificada para sua empresa.</h2>
            <p className="text-lg text-indigo-100">
              Gerencie seus projetos, equipes e tarefas em um só lugar com nossa plataforma segura e intuitiva.
            </p>
            
            <div className="pt-8 flex -space-x-2 overflow-hidden">
               {[1,2,3,4].map(i => (
                 <img key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-indigo-600 object-cover" src={`https://picsum.photos/100/100?random=${i}`} alt="" />
               ))}
               <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-indigo-600 bg-white/10 text-xs backdrop-blur-sm">
                 +2k
               </div>
            </div>
            <p className="text-sm text-indigo-200 font-medium">Junte-se a mais de 2.000 usuários ativos.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bem-vindo de volta!</h1>
            <p className="mt-2 text-sm text-gray-600">
              Não tem uma conta?{' '}
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Crie gratuitamente por 14 dias
              </a>
            </p>
          </div>

          <div className="mt-10">
            {/* Social Login - HIDDEN */}
            <div className="grid grid-cols-2 gap-3 mb-6 hidden">
              <button className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all">
                <Github className="h-5 w-5 mr-2 text-gray-900"/>
                GitHub
              </button>
            </div>

            <div className="relative hidden">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-500">Ou continue com e-mail</span>
              </div>
            </div>

            <form className="space-y-6 mt-6" onSubmit={handleSubmit}>
               {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.general}
                </div>
              )}

              <Input
                label="E-mail"
                type="email"
                placeholder="seunome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                icon={<Mail size={20} />}
                autoComplete="email"
              />

              <div className="space-y-1">
                <Input
                  label="Senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  icon={<Lock size={20} />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-indigo-600 focus:outline-none focus:text-indigo-600 transition-colors"
                      tabIndex={-1} // Prevent tabbing to this specifically if desired, or keep for accessibility
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                  autoComplete="current-password"
                />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                      Lembrar-me
                    </label>
                  </div>
                  <div className="text-sm">
                    <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                      Esqueceu a senha?
                    </a>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                isLoading={status === LoginStatus.LOADING}
                className="shadow-lg shadow-indigo-500/30 py-3"
              >
                {status === LoginStatus.LOADING ? 'Entrando...' : 'Entrar na Plataforma'}
                {!status && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>

            <div className="mt-8 text-center text-xs text-gray-400">
              <p>Protegido por reCAPTCHA e sujeito à <a href="#" className="underline hover:text-gray-500">Política de Privacidade</a> e <a href="#" className="underline hover:text-gray-500">Termos de Serviço</a> do Google.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};