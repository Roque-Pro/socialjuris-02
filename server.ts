import express from 'express';
import cors from 'cors';
import { jwtDecode } from 'jwt-decode';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 10000;

// --- CONFIGURAÇÃO DO SERVIDOR (CORS) ---
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requisiçõess de qualquer subdomínio do Vercel e localhost
    const allowedOrigins = [
      'https://socialjuris-02.vercel.app',
      'https://socialjuris-02-roque-rafaels-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
    ];
    
    // Se não tiver origin (requisição do Render para si mesmo), permite
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS não permitido'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());

// --- SUAS VARIÁVEIS ORIGINAIS ---
const GOOGLE_PUBLIC_KEYS_URL = 'https://www.googleapis.com/oauth2/v1/certs';
let stripe: any = null;
let supabase: any = null;
let cachedPublicKeys: any = null;
let cacheTime = 0;

function getStripe() {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  return stripe;
}

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

function getPriceToJurisMap(): Record<string, number> {
  return {
    [process.env.STRIPE_PRICE_JURIS_10 || '']: 10,
    [process.env.STRIPE_PRICE_JURIS_20 || '']: 20,
    [process.env.STRIPE_PRICE_JURIS_50 || '']: 50,
  };
}

// --- ROTAS DA API (ENVELOPANDO SUAS FUNÇÕES) ---

app.post('/api/create-juris-checkout', async (req, res) => {
  const { userId, priceId, successUrl, cancelUrl } = req.body;
  const result = await createJurisCheckoutSession(userId, priceId, successUrl, cancelUrl);
  res.json(result);
});

app.post('/api/create-subscription-checkout', async (req, res) => {
  const { userId, priceId, successUrl, cancelUrl } = req.body;
  const result = await createSubscriptionCheckoutSession(userId, priceId, successUrl, cancelUrl);
  res.json(result);
});

app.get('/health', (req, res) => res.send('Servidor Ativo'));

// --- SUAS FUNÇÕES ORIGINAIS (COM EXPORT PARA O VERCEL NÃO RECLAMAR) ---

export async function validateGoogleToken(token: string, expectedClientId: string) {
  try {
    const decoded = jwtDecode<any>(token);
    if (!decoded || !decoded.email) throw new Error('Token inválido');
    if (decoded.iss !== 'https://accounts.google.com' && decoded.iss !== 'accounts.google.com') throw new Error('Emissor inválido');
    if (decoded.aud !== expectedClientId) throw new Error('Audience inválido');
    if (decoded.exp * 1000 < Date.now()) throw new Error('Token expirado');
    return { valid: true, user: { email: decoded.email, name: decoded.name, picture: decoded.picture, verified: decoded.email_verified, googleId: decoded.sub } };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

export async function validateFacebookToken(accessToken: string, userID: string, appId: string) {
  try {
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}`;
    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();
    if (!debugData.data || !debugData.data.is_valid) throw new Error('Token inválido');
    const userUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.width(200).height(200)&access_token=${accessToken}`;
    const userResponse = await fetch(userUrl);
    const userData = await userResponse.json();
    return { valid: true, user: { id: userData.id, email: userData.email, name: userData.name || 'Usuário Facebook', picture: userData.picture?.data?.url || '' } };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

export async function createJurisCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
  try {
    const db = getSupabase();
    const { data: user } = await db.from('profiles').select('stripe_customer_id, email').eq('id', userId).single();
    if (!user) throw new Error('Usuário não encontrado');
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await getStripe().customers.create({ metadata: { user_id: userId } });
      customerId = customer.id;
      await db.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
    }
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: userId, type: 'juris' },
    });
    return { success: true, sessionId: session.id, url: session.url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSubscriptionCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
  try {
    const db = getSupabase();
    const { data: user } = await db.from('profiles').select('stripe_customer_id, email').eq('id', userId).single();
    if (!user) throw new Error('Usuário não encontrado');
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await getStripe().customers.create({ metadata: { user_id: userId } });
      customerId = customer.id;
      await db.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
    }
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: userId, type: 'subscription' },
    });
    return { success: true, sessionId: session.id, url: session.url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function handleCheckoutSessionCompleted(sessionId: string) {
  try {
    const db = getSupabase();
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const userId = session.metadata?.user_id;
    const type = session.metadata?.type;
    if (!userId) throw new Error('User ID não encontrado');

    if (type === 'juris') {
      const lineItems = await getStripe().checkout.sessions.listLineItems(sessionId);
      let totalJuris = 0;
      const priceMap = getPriceToJurisMap();
      for (const item of lineItems.data) {
        const jurisAmount = priceMap[item.price?.id || ''];
        if (jurisAmount) totalJuris += jurisAmount * item.quantity;
      }
      const { data: user } = await db.from('profiles').select('balance').eq('id', userId).single();
      if (user) {
        await db.from('profiles').update({ balance: (user.balance || 0) + totalJuris }).eq('id', userId);
      }
      return { success: true };
    } else if (type === 'subscription') {
      const { data: user } = await db.from('profiles').select('balance').eq('id', userId).single();
      await db.from('profiles').update({ is_premium: true, balance: (user?.balance || 0) + 20, subscription_status: 'active' }).eq('id', userId);
      return { success: true };
    }
    return { success: false };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  try {
    const db = getSupabase();
    const customer = await getStripe().customers.retrieve(subscription.customer as string);
    const userId = (customer as any).metadata?.user_id;
    if (!userId) throw new Error('User ID não encontrado');
    const status = subscription.status;
    if (status === 'active' || status === 'trialing') {
      await db.from('profiles').update({ is_premium: true, stripe_subscription_id: subscription.id, subscription_status: status }).eq('id', userId);
    } else {
      await db.from('profiles').update({ is_premium: false, subscription_status: status }).eq('id', userId);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function verifyWebhookSignature(body: string, signature: string) {
  try {
    const event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
    return { valid: true, event };
  } catch (error) {
    return { valid: false };
  }
}

// --- LIGAR O SERVIDOR ---
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});