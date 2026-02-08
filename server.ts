import express from 'express';
import cors from 'cors';
import { jwtDecode } from 'jwt-decode';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 10000;

// --- 1. CONFIGURAÇÃO DE SEGURANÇA (CORS) ---
const allowedOrigins = [
  'https://socialjuris-02.vercel.app',
  'https://socialjuris-02-roque-rafaels-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      callback(null, true);
    } else {
      callback(new Error('CORS não permitido'));
    }
  },
  credentials: true
}));

app.use(express.json());

// --- 2. INICIALIZAÇÃO DE SERVIÇOS (STRIPE/SUPABASE) ---
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || '');
const getSupabase = () => createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// --- 3. ROTAS DA API ---

// Login Google
app.post('/api/auth/validate-google', async (req, res) => {
  const { credential, clientId } = req.body;
  try {
    const decoded: any = jwtDecode(credential);
    if (decoded.aud !== clientId) throw new Error('Audience inválido');
    res.json({ 
      valid: true, 
      user: { email: decoded.email, name: decoded.name, picture: decoded.picture, googleId: decoded.sub } 
    });
  } catch (error: any) {
    res.status(400).json({ valid: false, error: error.message });
  }
});

// Checkout de Créditos (Juris)
app.post('/api/create-juris-checkout', async (req, res) => {
  const { userId, priceId, successUrl, cancelUrl } = req.body;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: userId, type: 'juris' },
    });
    res.json({ success: true, url: session.url });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Checkout de Assinatura (A ROTA QUE DAVA ERRO)
app.post('/api/create-subscription-checkout', async (req, res) => {
  const { userId, priceId, successUrl, cancelUrl } = req.body;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: userId, type: 'subscription' },
    });
    res.json({ success: true, url: session.url });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => res.send('Servidor Ativo'));

// --- 4. LIGAR SERVIDOR ---
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});