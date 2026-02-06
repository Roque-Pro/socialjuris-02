import { validateFacebookToken } from '../server';

interface FacebookCredential {
  accessToken: string;
  userID: string;
}

export const facebookAuthService = {
  async validateAndExtractToken(accessToken: string, userID: string) {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId) {
      throw new Error('Facebook App ID não configurado');
    }

    const result = await validateFacebookToken(accessToken, userID, appId);
    
    if (!result.valid) {
      throw new Error(result.error || 'Token inválido');
    }

    return {
      email: result.user.email,
      name: result.user.name,
      avatar: result.user.picture,
      verified: true,
      facebookId: result.user.id,
    };
  },

  async handleFacebookResponse(response: any) {
    if (response?.accessToken && response?.userID) {
      try {
        const userData = await this.validateAndExtractToken(response.accessToken, response.userID);
        return userData;
      } catch (error) {
        console.error('Erro ao validar resposta Facebook:', error);
        throw error;
      }
    }
    return null;
  },
};
