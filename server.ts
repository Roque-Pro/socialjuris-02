import express from 'express';
import cors from 'cors';
import { jwtDecode } from 'jwt-decode';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 10000;

// --- 1. CONFIGURAÇÃO DE SEGURANÇA (CORS) ---
const allowedOrigins = [
  'https://socialjuridico-roque-rafaels-projects.vercel.app',
  'https://socialjuridico-roque-rafaels-projects.vercel.app',
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
app.use(express.static('dist'));

// --- 2. INICIALIZAÇÃO DE SERVIÇOS (STRIPE/SUPABASE) ---
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || '');
const getSupabase = () => createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// --- 3. ROTAS DA API ---

// Login Google
app.post('/api/auth/validate-google', async (req, res) => {
  const { token, clientId } = req.body;
  try {
    const decoded: any = jwtDecode(token);
    if (decoded.aud !== clientId) throw new Error('Audience inválido');
    res.json({ 
      valid: true, 
      user: { email: decoded.email, name: decoded.name, picture: decoded.picture, googleId: decoded.sub } 
    });
  } catch (error: any) {
    res.status(400).json({ valid: false, error: error.message });
  }
});

// Login Facebook
app.post('/api/auth/validate-facebook', async (req, res) => {
  const { accessToken, userID, appId } = req.body;
  try {
    if (!accessToken || !userID || !appId) {
      throw new Error('Parâmetros inválidos: accessToken, userID e appId são obrigatórios');
    }

    // Validar token contra Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error('Token inválido ou expirado');
    }

    const facebookUser = await response.json();

    // Verificar se o ID do token corresponde ao ID retornado
    if (facebookUser.id !== userID) {
      throw new Error('ID do usuário não corresponde ao token');
    }

    // Validar se existe email (obrigatório para o sistema)
    if (!facebookUser.email) {
      throw new Error('Email não disponível na conta Facebook');
    }

    res.json({
      valid: true,
      user: {
        id: facebookUser.id,
        email: facebookUser.email,
        name: facebookUser.name,
        picture: facebookUser.picture?.data?.url || '',
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao validar Facebook:', error.message);
    res.status(400).json({ 
      valid: false, 
      error: error.message || 'Erro ao validar token Facebook' 
    });
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

// Catch-all para React Router
app.get('*', (req, res) => {
  res.sendFile('dist/index.html');
});

// --- 4. LIGAR SERVIDOR ---
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});