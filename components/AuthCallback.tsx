import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { oauthService } from '../services/oauthService';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Processar o callback do OAuth
        const user = await oauthService.handleOAuthCallback();

        if (user) {
          // Redirecionar para dashboard
          navigate('/dashboard');
        } else {
          setError('Falha ao processar autenticação');
        }
      } catch (err) {
        console.error('Erro no callback:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        {isLoading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Processando autenticação...</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro: {error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Voltar ao Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
