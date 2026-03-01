import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { handleCreateJurisCheckout, handleCreateSubscriptionCheckout, handleWebhook } from './api/routes';

// Load .env
dotenv.config({ path: '.env' });

console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✓ carregada' : '✗ não carregada');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ carregada' : '✗ não carregada');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓ carregada' : '✗ não carregada');

const app = express();
const PORT = process.env.STRIPE_API_PORT || 3001;

// Enable CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://www.socialjuridico.com.br',
  'https://socialjuridico.com.br',
  'https://socialjuridico-roque-rafaels-projects.vercel.app',
  'https://socialjuris-02.onrender.com',
  process.env.FRONTEND_URL || '' // Adicional para flexibilidade
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para webhook (raw body para verificação de signature)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req: any, res) => {
  try {
    console.log('🔔 Webhook recebido');
    const signature = req.headers['stripe-signature'] as string;
    const body = req.body instanceof Buffer ? req.body.toString('utf-8') : req.body;
    
    console.log('Signature:', signature ? '✓' : '✗');
    
    const result = await handleWebhook(signature, body);
    
    console.log('Resultado webhook:', result);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Middleware JSON para outras rotas
app.use(express.json());

// Endpoints
app.post('/api/create-juris-checkout', async (req: any, res) => {
  try {
    const result = await handleCreateJurisCheckout(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro em create-juris-checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/api/create-subscription-checkout', async (req: any, res) => {
  try {
    const result = await handleCreateSubscriptionCheckout(req.body);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro em create-subscription-checkout:', error);
    res.status(500).json({ error: 'Failed to create subscription session' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Stripe API Server is running' });
});

app.listen(PORT, () => {
  console.log(`Stripe API Server running on port ${PORT}`);
});
