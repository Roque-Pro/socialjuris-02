import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useApp } from '../store';

interface PasswordResetProps {
  onBack: () => void;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ onBack }) => {
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword } = useApp();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor, insira um e-mail válido');
      return;
    }

    setLoading(true);
    try {
      // Enviar email de recuperação - o Supabase faz isso automaticamente
      await resetPassword(email);
      setStep('sent');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao enviar e-mail de recuperação';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* Left Side - Visual / Branding */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full bg-indigo-600 overflow-hidden z-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 text-white max-w-lg space-y-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 mb-8">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold leading-tight">Recupere seu acesso com segurança.</h2>
          <p className="text-lg text-indigo-100">
            Siga os passos simples para redefinir sua senha e retomar o acesso à sua conta.
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
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="flex items-center text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar ao Login
            </button>
          </div>

          {step === 'email' && (
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Recuperar Senha</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Digite seu e-mail para receber instruções de recuperação
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleEmailSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-600/20 transition flex items-center justify-center"
                >
                  {loading ? 'Enviando...' : 'Enviar Instruções'}
                </button>
              </form>
            </div>
          )}

          {step === 'sent' && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Email Enviado!</h1>
                <p className="mt-4 text-sm text-gray-600">
                  Verifique sua caixa de entrada. Enviamos um link para você redefinir sua senha.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  O link expira em 24 horas. Não encontrou o email? Verifique a pasta de spam.
                </p>
              </div>

              <button
                onClick={onBack}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-600/20 transition"
              >
                Voltar ao Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
