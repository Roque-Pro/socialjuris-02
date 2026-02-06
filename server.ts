import express from 'express';
import cors from 'cors';
import { jwtDecode } from 'jwt-decode';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO SERVIDOR ---
const app = express();
const port = process.env.PORT || 3001;

// CONFIGURAÇÃO DO CORS - Isso libera o acesso da Vercel
app.use(cors({
  origin: 'https://socialjuris-02.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// --- ROTAS DA API (O que o seu frontend chama) ---

app.post('/api/create-juris-checkout', async (req, res) => {
  try {
    const { userId, priceId, successUrl, cancelUrl } = req.body;
    const result = await createJurisCheckoutSession(userId, priceId, successUrl, cancelUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
});

app.post('/api/create-subscription-checkout', async (req, res) => {
  try {
    const { userId, priceId, successUrl, cancelUrl } = req.body;
    const result = await createSubscriptionCheckoutSession(userId, priceId, successUrl, cancelUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
});

// Rota de teste para você ver se o backend está vivo
app.get('/health', (req, res) => {
  res.send('Backend SocialJuris está rodando liso! 🚀');
});

// --- SUAS FUNÇÕES ORIGINAIS (AJUSTADAS) ---

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

// Funções de validação de Token (Mantidas como estavam)
export async function validateGoogleToken(token: string, expectedClientId: string) {
    try {
      const decoded = jwtDecode<any>(token);
      if (!decoded || !decoded.email) throw new Error('Token inválido');
      if (decoded.aud !== expectedClientId) throw new Error('Token não autorizado');
      if (decoded.exp * 1000 < Date.now()) throw new Error('Token expirado');
      return { valid: true, user: { email: decoded.email, name: decoded.name, picture: decoded.picture, googleId: decoded.sub } };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
}

// ... (Aqui você pode manter as funções validateFacebookToken, etc.)

// FUNÇÕES DO STRIPE (Exportadas e Prontas para uso)
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

// INICIALIZAÇÃO DO SERVIDOR
app.listen(port, () => {
  console.log(`\n✅ Servidor rodando na porta ${port}`);
  console.log(`✅ Aceitando requisições de: https://socialjuris-02.vercel.app\n`);
});