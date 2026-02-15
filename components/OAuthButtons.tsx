import React, { useState } from 'react';
import { oauthService } from '../services/oauthService';

interface OAuthButtonsProps {
  onLoading?: (isLoading: boolean) => void;
  onError?: (error: string) => void;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({ onLoading, onError }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      onLoading?.(true);
      await oauthService.loginWithGoogle();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao fazer login com Google';
      console.error(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
      onLoading?.(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      onLoading?.(true);
      await oauthService.loginWithFacebook();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao fazer login com Facebook';
      console.error(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
      onLoading?.(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full hidden">
      {/* Botão Google */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        </svg>
        <span className="text-gray-700 font-medium">Entrar com Google</span>
      </button>

      {/* Botão Facebook */}
      <button
        onClick={handleFacebookLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span className="font-medium">Entrar com Facebook</span>
      </button>
    </div>
  );
};
