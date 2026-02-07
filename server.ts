import express from 'express';
import cors from 'cors';
import { jwtDecode } from 'jwt-decode';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO SERVIDOR ---
const app = express();
const port = process.env.PORT || 3001;

// CONFIGURAÇÃO DO CORS - ESSENCIAL PARA A VERCEL CONVERSAR COM O RENDER
app.use(cors({
  origin: 'https://socialjuris-02.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// --- ROTAS DA API (O QUE O SEU FRONTEND CHAMA) ---

app.post('/api/create-juris-checkout', async (req, res) => {
  try {
    const { userId, priceId, successUrl, cancelUrl } = req.body;
    const result = await createJurisCheckoutSession(userId, priceId, successUrl, cancelUrl);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/create-subscription-checkout', async (req, res) => {
  try {
    const { userId, priceId, successUrl, cancelUrl } = req.body;
    const result = await createSubscriptionCheckoutSession(userId, priceId, successUrl, cancelUrl);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.send('Backend SocialJuris está rodando liso! 🚀');
});

// --- VARIÁVEIS E INICIALIZAÇÕES ---

const GOOGLE_PUBLIC_KEYS_URL = 'https://www.googleapis.com/oauth2/v1/certs';

let stripe: any = null;
function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }
  return stripe;
}

let supabase: any = null;
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

// --- FUNÇÕES DE AUTENTICAÇÃO (GOOGLE E FACEBOOK) ---

export async function validateGoogleToken(token: string, expectedClientId: string) {
  try {
    const decoded = jwtDecode<any>(token);
    if (!decoded || !decoded.email) throw new Error('Token inválido: email não encontrado');
    if (decoded.iss !== 'https://accounts.google.com' && decoded.iss !== 'accounts.google.com') {
      throw new Error('Token não foi emitido pelo Google');
    }
    if (decoded.aud !== expectedClientId) throw new Error('Token não autorizado');
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

    if (!debugData.data || !debugData.data.is_valid) throw new Error('Token Facebook inválido');
    if (debugData.data.app_id !== appId) throw new Error('App ID não corresponde');

    const userUrl = `https://graph.facebook.com/me?fields=id,name,email,picture.width(200).height(200)&access_token=${accessToken}`;
    const userResponse = await fetch(userUrl);
    const userData = await userResponse.json();

    return { valid: true, user: { id: userData.id, email: userData.email, name: userData.name || 'Usuário Facebook', picture: userData.picture?.data?.url || '' } };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

// --- FUNÇÕES DO STRIPE ---

export async function createJurisCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
  try {
    const db = getSupabase();
    const { data: user } = await db.from('profiles').select('stripe_customer_id').eq('id', userId).single();
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
    const { data: user } = await db.from('profiles').select('stripe_customer_id').eq('id', userId).single();
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

// MANTENHA AS OUTRAS FUNÇÕES (handleCheckoutSessionCompleted, etc) AQUI SE PRECISAR DELAS RODANDO VIA WEBHOOK

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(port, () => {
  console.log(`\n✅ Servidor rodando na porta ${port}`);
  console.log(`✅ URL Permitida (CORS): https://socialjuris-02.vercel.app\n`);
});