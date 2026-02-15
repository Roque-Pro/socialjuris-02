import React, { useEffect, useState } from 'react';
import { googleAuthService } from '../services/googleAuthService';

interface GoogleLoginProps {
  onSuccess: (userData: { email: string; name: string; avatar: string; verified: boolean }) => void;
  onError?: (error: string) => void;
}

export const GoogleLogin: React.FC<GoogleLoginProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Carregar script do Google
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error('VITE_GOOGLE_CLIENT_ID não configurado');
        return;
      }

      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      (window as any).google.accounts.id.renderButton(
        document.getElementById('google-login-btn'),
        {
          theme: 'outline',
          size: 'large',
          width: '375',
          text: 'continue_with',
        }
      );
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      setIsLoading(true);
      const userData = await googleAuthService.handleGoogleResponse(response);
      if (userData) {
        onSuccess(userData);
      } else {
        onError?.('Falha ao processar credencial do Google');
      }
    } catch (error) {
      console.error('Erro ao processar resposta Google:', error);
      onError?.(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="google-login-btn" className="w-full flex justify-center hidden">
      {isLoading && <div className="text-sm text-gray-600">Processando...</div>}
    </div>
  );
};
