import React, { useEffect, useState } from 'react';
import { facebookAuthService } from '../services/facebookAuthService';

interface FacebookLoginProps {
  onSuccess: (userData: { email: string; name: string; avatar: string; verified: boolean; facebookId?: string }) => void;
  onError?: (error: string) => void;
}

export const FacebookLogin: React.FC<FacebookLoginProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Carregar SDK do Facebook
    window.fbAsyncInit = function() {
      const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
      if (!appId) {
        console.error('VITE_FACEBOOK_APP_ID não configurado');
        return;
      }

      (window as any).FB.init({
        appId: appId,
        xfbml: true,
        version: 'v20.0'
      });
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleFacebookLogin = () => {
    try {
      setIsLoading(true);

      (window as any).FB.login((response: any) => {
        if (response.authResponse) {
          facebookAuthService.handleFacebookResponse({
            accessToken: response.authResponse.accessToken,
            userID: response.authResponse.userID
          }).then((userData) => {
            if (userData) {
              onSuccess(userData);
            } else {
              onError?.('Falha ao processar credencial do Facebook');
            }
            setIsLoading(false);
          }).catch((error) => {
            console.error('Erro ao processar resposta Facebook:', error);
            onError?.(error instanceof Error ? error.message : 'Erro desconhecido');
            setIsLoading(false);
          });
        } else {
          onError?.('Usuário cancelou o login');
          setIsLoading(false);
        }
      }, { scope: 'public_profile,email' });
    } catch (error) {
      console.error('Erro ao fazer login com Facebook:', error);
      onError?.(error instanceof Error ? error.message : 'Erro desconhecido');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFacebookLogin}
      disabled={isLoading}
      className="w-full h-10 flex items-center justify-center gap-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium hidden"
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
      <span>Entrar com Facebook</span>
    </button>
  );
};
