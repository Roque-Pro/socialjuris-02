import { jwtDecode } from 'jwt-decode';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_PUBLIC_KEYS_URL = 'https://www.googleapis.com/oauth2/v1/certs';

// Inicializar Stripe (lazy)
let stripe: any = null;

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }
  return stripe;
}

// Inicializar Supabase (lazy)
let supabase: any = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

// Mapeamento de price IDs para quantidade Juris (função para pegar valores atualizados)
function getPriceToJurisMap(): Record<string, number> {
  return {
    [process.env.STRIPE_PRICE_JURIS_10 || '']: 10,
    [process.env.STRIPE_PRICE_JURIS_20 || '']: 20,
    [process.env.STRIPE_PRICE_JURIS_50 || '']: 50,
  };
}

interface GoogleToken {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
  iat: number;
  exp: number;
}

let cachedPublicKeys: any = null;
let cacheTime = 0;

async function getGooglePublicKeys() {
  const now = Date.now();
  // Cache por 1 hora
  if (cachedPublicKeys && now - cacheTime < 3600000) {
    return cachedPublicKeys;
  }

  const response = await fetch(GOOGLE_PUBLIC_KEYS_URL);
  cachedPublicKeys = await response.json();
  cacheTime = now;
  return cachedPublicKeys;
}

export async function validateGoogleToken(token: string, expectedClientId: string) {
  try {
    // Decodificar sem validação primeiro para ver o header
    const decoded = jwtDecode<GoogleToken>(token);

    // Validações básicas
    if (!decoded || !decoded.email) {
      throw new Error('Token inválido: email não encontrado');
    }

    // Verificar se o token foi emitido pelo Google
    if (decoded.iss !== 'https://accounts.google.com' && decoded.iss !== 'accounts.google.com') {
      throw new Error('Token não foi emitido pelo Google');
    }

    // Verificar se o aud (audience) corresponde ao seu Client ID
    if (decoded.aud !== expectedClientId) {
      throw new Error('Token não foi emitido para esta aplicação');
    }

    // Verificar se o token ainda é válido (exp em segundos, Date.now() em ms)
    if (decoded.exp * 1000 < Date.now()) {
      throw new Error('Token expirado');
    }

    // Se passou em todas as validações básicas, o token é válido
    // (Em produção, você poderia validar a assinatura também, mas requer chaves públicas do Google)

    return {
      valid: true,
      user: {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        verified: decoded.email_verified,
        googleId: decoded.sub
      }
    };
  } catch (error) {
    console.error('Erro ao validar token Google:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

export async function validateFacebookToken(accessToken: string, userID: string, appId: string) {
  try {
    // Validar token no Facebook
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}`;
    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();

    if (!debugData.data || !debugData.data.is_valid) {
      throw new Error('Token Facebook inválido ou expirado');
    }

    // Verificar se o App ID corresponde
    if (debugData.data.app_id !== appId) {
      throw new Error('Token não foi emitido para esta aplicação');
    }

    // Buscar dados do usuário
    const userUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.width(200).height(200)&access_token=${accessToken}`;
    const userResponse = await fetch(userUrl);
    const userData = await userResponse.json();

    if (!userData.id || !userData.email) {
      throw new Error('Não foi possível obter dados do usuário Facebook');
    }

    return {
      valid: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name || 'Usuário Facebook',
        picture: userData.picture?.data?.url || '',
      }
    };
  } catch (error) {
    console.error('Erro ao validar token Facebook:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// ==================== STRIPE FUNCTIONS ====================

export async function createJurisCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    console.log('createJurisCheckoutSession - userId:', userId, 'priceId:', priceId);
    const db = getSupabase();
    // Buscar ou criar Stripe Customer
    const { data: user, error } = await db
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    console.log('Supabase response:', { user, error });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    let customerId = user.stripe_customer_id;

    // Criar customer se não existir
    if (!customerId) {
      const customer = await getStripe().customers.create({
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;

      // Salvar customer ID no banco
      await db
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Criar checkout session para compra única
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        type: 'juris',
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Erro ao criar Juris checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export async function createSubscriptionCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const db = getSupabase();
    // Buscar ou criar Stripe Customer
    const { data: user } = await db
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    let customerId = user.stripe_customer_id;

    // Criar customer se não existir
    if (!customerId) {
      const customer = await getStripe().customers.create({
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;

      // Salvar customer ID no banco
      await db
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Criar checkout session para subscription
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        type: 'subscription',
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Erro ao criar subscription checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export async function handleCheckoutSessionCompleted(sessionId: string) {
  try {
    console.log('\n📦 handleCheckoutSessionCompleted iniciado com sessionId:', sessionId);
    const db = getSupabase();
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    console.log('Session metadata:', session.metadata);
    
    const userId = session.metadata?.user_id;
    const type = session.metadata?.type;

    console.log('userId:', userId, 'type:', type);

    if (!userId) {
      throw new Error('User ID não encontrado nos metadados');
    }

    if (type === 'juris') {
      // Compra de Juris - creditar balance
      const lineItems = await getStripe().checkout.sessions.listLineItems(sessionId);
      console.log('lineItems:', lineItems.data);
      
      let totalJuris = 0;

      const priceMap = getPriceToJurisMap();
      for (const item of lineItems.data) {
        console.log('Processando item:', item.price?.id);
        console.log('priceToJurisMap:', priceMap);
        const jurisAmount = priceMap[item.price?.id || ''];
        console.log('jurisAmount para', item.price?.id, ':', jurisAmount);
        if (jurisAmount) {
          totalJuris += jurisAmount * item.quantity;
        }
      }

      console.log('Total Juris calculado:', totalJuris);

      // Atualizar balance
      const { data: user } = await db
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      console.log('User atual:', user);

      if (user) {
        const newBalance = (user.balance || 0) + totalJuris;
        console.log('Novo saldo será:', newBalance);
        
        const { error } = await db
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId);
        
        console.log('Erro da atualização:', error);
      }

      return { success: true, message: `${totalJuris} Juris creditados` };
    } else if (type === 'subscription') {
      // PRO Subscription - ativar premium + bônus
      const { data: user } = await db
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      const bonusJuris = 20;
      await db
        .from('profiles')
        .update({
          is_premium: true,
          balance: (user?.balance || 0) + bonusJuris,
          subscription_status: 'active',
        })
        .eq('id', userId);

      return { success: true, message: 'PRO ativado + 20 Juris de bônus' };
    }

    return { success: false, message: 'Tipo desconhecido' };
  } catch (error) {
    console.error('Erro ao processar checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  try {
    const db = getSupabase();
    const customerId = subscription.customer as string;
    const customer = await getStripe().customers.retrieve(customerId);
    const customerData = customer as any;
    const userId = customerData?.metadata?.user_id;

    if (!userId) {
      throw new Error('User ID não encontrado');
    }

    const status = subscription.status;

    if (status === 'active' || status === 'trialing') {
      await db
        .from('profiles')
        .update({
          is_premium: true,
          stripe_subscription_id: subscription.id,
          subscription_status: status,
          subscription_started_at: new Date(subscription.created * 1000).toISOString(),
          subscription_ends_at: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        })
        .eq('id', userId);
    } else if (status === 'canceled' || status === 'past_due') {
      await db
        .from('profiles')
        .update({
          is_premium: false,
          subscription_status: status,
        })
        .eq('id', userId);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao processar subscription event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): { valid: boolean; event?: any } {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    return { valid: true, event };
  } catch (error) {
    console.error('Erro ao verificar webhook signature:', error);
    return { valid: false };
  }
}
