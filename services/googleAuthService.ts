import { validateGoogleToken } from '../server';

interface GoogleCredential {
  credential: string;
}

export const googleAuthService = {
  async validateAndExtractToken(token: string) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Client ID não configurado');
    }

    const result = await validateGoogleToken(token, clientId);
    
    if (!result.valid) {
      throw new Error(result.error || 'Token inválido');
    }

    return {
      email: result.user.email,
      name: result.user.name,
      avatar: result.user.picture,
      verified: result.user.verified,
      googleId: result.user.googleId,
    };
  },

  async handleGoogleResponse(response: GoogleCredential) {
    if (response.credential) {
      try {
        const userData = await this.validateAndExtractToken(response.credential);
        return userData;
      } catch (error) {
        console.error('Erro ao validar resposta Google:', error);
        throw error;
      }
    }
    return null;
  },
};
