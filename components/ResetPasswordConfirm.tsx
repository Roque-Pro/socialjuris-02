import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../store';

export const ResetPasswordConfirm: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [code, setCode] = useState<string | null>(null);
  const { resetPasswordWithCode } = useApp();

  useEffect(() => {
    // Capturar erro da URL (vem como hash fragment do Supabase)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // Remove o '#'
    
    const errorFromUrl = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (errorFromUrl) {
      let errorMsg = 'Erro ao processar o link de recuperação';
      if (errorDescription) {
        errorMsg = decodeURIComponent(errorDescription);
      }
      setError(errorMsg);
      setStatus('error');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      // O Supabase já autenticou o usuário via email link
      // Agora só precisamos atualizar a senha
      await resetPasswordWithCode(newPassword);
      setStatus('success');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar senha';
      setError(errorMsg);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'error' && !code) {
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
            <h2 className="text-4xl font-bold leading-tight">Recuperação de Senha</h2>
            <p className="text-lg text-indigo-100">
              Se você tiver dúvidas, entre em contato com nosso suporte.
            </p>
          </div>
        </div>

        {/* Right Side - Error Message */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Link Expirado</h1>
              <p className="mt-4 text-sm text-gray-600">
                {error}
              </p>
            </div>

            <a
              href="/"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-600/20 transition text-center block"
            >
              Voltar ao Login
            </a>
          </div>
        </div>
      </div>
    );
  }

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
          <h2 className="text-4xl font-bold leading-tight">Defina uma nova senha com segurança.</h2>
          <p className="text-lg text-indigo-100">
            Sua senha será criptografada e protegida pelos mais altos padrões de segurança.
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
          {status === 'form' && (
            <>
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Definir Nova Senha</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Digite sua nova senha para recuperar o acesso à sua conta
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="show-password"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="show-password" className="ml-2 text-sm text-gray-600">
                    Mostrar Senha
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-600/20 transition flex items-center justify-center"
                >
                  {loading ? 'Atualizando...' : 'Atualizar Senha'}
                </button>
              </form>
            </>
          )}

          {status === 'success' && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Senha Atualizada!</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Sua senha foi alterada com sucesso. Você pode fazer login com sua nova senha.
                </p>
              </div>

              <a
                href="/"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-600/20 transition text-center block"
              >
                Voltar ao Login
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
