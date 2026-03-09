import React, { useState } from 'react';
import { X, Lock, Loader2 } from 'lucide-react';

interface ChangePasswordModalProps {
    userId: string;
    userName: string;
    userEmail: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    userId,
    userName,
    userEmail,
    isOpen,
    onClose,
    onSuccess
}) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      // Validações
      if (!newPassword) {
        setError('Por favor, informe uma nova senha');
        return;
      }

      if (newPassword.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('As senhas não conferem');
        return;
      }

      setLoading(true);
      try {
        // Chamar endpoint de admin reset para mudar a senha direto
        const response = await fetch('/api/auth/admin-reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: userEmail,
            newPassword: newPassword
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao alterar senha');
        }

        alert(`Senha alterada com sucesso para ${userEmail}!`);
        onSuccess?.();
        onClose();
      } catch (err: any) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao alterar senha';
        setError(errorMsg);
        console.error('Password change error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <Lock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Alterar Senha</h2>
                            <p className="text-sm text-slate-500">{userName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-900 mb-2">Erro ao resetar senha</p>
                        <p className="text-sm text-red-700 mb-2">{error}</p>
                        {error.includes("Email") && (
                          <p className="text-xs text-red-600 mt-2 italic">
                            💡 Se o email do usuário está incorreto no banco de dados, você precisa corrigi-lo primeiro antes de resetar a senha.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Digite a nova senha"
                                disabled={loading}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Confirmar Senha
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            disabled={loading}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50"
                        />
                    </div>

                    <label className="flex items-center space-x-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                            disabled={loading}
                            className="rounded border-slate-300"
                        />
                        <span>Mostrar Senha</span>
                    </label>

                    <div className="pt-2 border-t border-slate-100 flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-lg transition disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Processando...</span>
                                </>
                            ) : (
                                <span>Alterar Senha</span>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 text-center pt-2">
                        Um email de confirmação será enviado para o usuário com instruções para definir a nova senha.
                    </p>
                </form>
            </div>
        </div>
    );
};
