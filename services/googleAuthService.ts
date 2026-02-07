interface GoogleCredential {
  credential: string;
}

interface GoogleUser {
  email: string;
  name: string;
  avatar: string;
  verified: boolean;
  googleId?: string;
}

export const googleAuthService = {
  async validateAndExtractToken(token: string): Promise<GoogleUser> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Client ID não configurado');
    }

    // Validar token no backend
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/auth/validate-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, clientId })
    });

    const result = await response.json();
    
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

  async handleGoogleResponse(response: GoogleCredential): Promise<GoogleUser | null> {
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
