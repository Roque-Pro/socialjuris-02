import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'facebook';
}

/**
 * Serviço de autenticação OAuth
 * Gerencia login com Google e Facebook via Supabase
 */
export const oauthService = {
  /**
   * Inicia fluxo de login com Google
   */
  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile',
      },
    });

    if (error) {
      console.error('Erro ao fazer login com Google:', error);
      throw error;
    }

    return data;
  },

  /**
   * Inicia fluxo de login com Facebook
   */
  async loginWithFacebook() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email public_profile',
      },
    });

    if (error) {
      console.error('Erro ao fazer login com Facebook:', error);
      throw error;
    }

    return data;
  },

  /**
   * Processa o callback de OAuth e sincroniza usuário no banco
   */
  async handleOAuthCallback(): Promise<User | null> {
    try {
      // Obter sessão da URL (Supabase coloca na hash)
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.error('Erro ao obter sessão:', error);
        return null;
      }

      const { user } = data.session;

      if (!user || !user.email) {
        throw new Error('Usuário ou email não disponível');
      }

      // Sincronizar usuário no banco de dados
      const syncedUser = await oauthService.syncUserToDatabase(user);

      return syncedUser;
    } catch (error) {
      console.error('Erro ao processar callback OAuth:', error);
      throw error;
    }
  },

  /**
   * Sincroniza dados do provedor OAuth com o banco de dados
   */
  async syncUserToDatabase(authUser: any): Promise<User> {
    const { id, email, user_metadata, identities } = authUser;
    const provider = identities?.[0]?.provider || 'unknown';

    // Extrair dados do perfil
    const userData: any = {
      email,
      name: user_metadata?.name || user_metadata?.full_name || email.split('@')[0],
      avatar: user_metadata?.avatar_url || user_metadata?.picture || '',
      role: UserRole.CLIENT,
      verified: true, // OAuth automáticamente verifica email
      createdAt: new Date().toISOString(),
    };

    // Criar ou atualizar usuário na tabela 'users'
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = nenhuma linha encontrada (é ok)
      throw fetchError;
    }

    let finalUser: User;

    if (existingUser) {
      // Atualizar usuário existente
      const { data, error } = await supabase
        .from('users')
        .update({
          ...userData,
          [`${provider}_id`]: id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (error) throw error;
      finalUser = data;
    } else {
      // Criar novo usuário
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: id, // Usar o ID do provedor como ID principal
            email,
            ...userData,
            [`${provider}_id`]: id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      finalUser = data;
    }

    return finalUser;
  },

  /**
   * Logout do usuário
   */
  async logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  },

  /**
   * Obter usuário atual
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        return null;
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.session.user.email)
        .single();

      if (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  },
};
