interface FacebookCredential {
  accessToken: string;
  userID: string;
}

interface FacebookUser {
  email: string;
  name: string;
  avatar: string;
  verified: boolean;
  facebookId?: string;
}

export const facebookAuthService = {
  async validateAndExtractToken(accessToken: string, userID: string): Promise<FacebookUser> {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId) {
      throw new Error('Facebook App ID não configurado');
    }

    // Validar token no backend
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/auth/validate-facebook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, userID, appId })
    });

    const result = await response.json();
    
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

  async handleFacebookResponse(response: any): Promise<FacebookUser | null> {
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
