import dotenv from 'dotenv';
dotenv.config(); // Carrega variáveis do .env

import express from 'express';
import cors from 'cors';
import { jwtDecode } from 'jwt-decode';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const app = express();
const port = process.env.PORT || 10000;

// --- 1. CONFIGURAÇÃO DE SEGURANÇA (CORS) ---
const allowedOrigins = [
  'https://www.socialjuridico.com.br',
  'https://socialjuridico.com.br',
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

// --- 2. INICIALIZAÇÃO DE SERVIÇOS (STRIPE/SUPABASE/OPENAI) ---
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || '');
const getSupabase = () => createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);
const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

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

// --- 4. ROTAS DE IA (OPENAI) ---

// Análise de Caso
app.post('/api/ai/analyze-case', async (req, res) => {
  const { description } = req.body;
  try {
    if (!description) {
      return res.status(400).json({ error: 'Description é obrigatório' });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Return ONLY a valid JSON object matching the schema.

Rules:
- area MUST be exactly one of:
["Direito do Consumidor","Direito Civil","Direito de Família","Direito Penal","Direito do Trabalho","Direito Previdenciário","Direito Tributário","Direito Empresarial","Direito Administrativo","Direito Bancário"]
- NEVER return "Direito Geral"
- Choose the MOST SPECIFIC area.

Case:
${description}

Respond ONLY with valid JSON, no markdown, no code blocks.`
        }
      ],
      temperature: 0.7,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      throw new Error('Empty OpenAI response');
    }

    const cleaned = raw.replace(/^```json|```$/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ AI Analyze Case Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat Genérico
app.post('/api/ai/chat', async (req, res) => {
  const { userMessage, context } = req.body;
  try {
    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage é obrigatório' });
    }

    const openai = getOpenAI();
    const systemMessage = context || 
      'You are a helpful Brazilian legal assistant. Answer questions about law in Portuguese (Brazil). Be professional and precise.';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
    });

    const message = response.choices[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';
    res.json({ success: true, message });
  } catch (error: any) {
    console.error('❌ AI Chat Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Geração de Minuta Legal
app.post('/api/ai/generate-draft', async (req, res) => {
  const { type, clientName, facts, tone } = req.body;
  try {
    if (!type || !clientName || !facts) {
      return res.status(400).json({ error: 'type, clientName, facts são obrigatórios' });
    }

    const openai = getOpenAI();
    const prompt = `Act as a senior Brazilian lawyer. Write ONLY a legal document of type "${type}". 
DO NOT include any introduction, explanation, or narrative before the document. Start directly with the document content.

Client: ${clientName}
Facts: ${facts}
Tone: ${tone || 'formal'}
Structure: Header, Facts, Law, Requests, Footer
Language: Portuguese (Brazil)
Format: Plain text (NO markdown formatting, NO backticks, NO code blocks)

Generate ONLY the document content. Nothing else.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    let text = response.choices[0]?.message?.content || 'Erro ao gerar minuta.';
    
    // Remove markdown backticks if present
    text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
    
    // Remove common explanations from the beginning
    const explanationPatterns = [
      /^.*?Com certeza.*?\n---\n/is,
      /^.*?Claro.*?\n---\n/is,
      /^.*?Com prazer.*?\n---\n/is,
      /^.*?Segue.*?\n---\n/is,
    ];
    
    for (const pattern of explanationPatterns) {
      if (pattern.test(text)) {
        text = text.replace(pattern, '');
        break;
      }
    }

    res.json({ success: true, draft: text });
  } catch (error: any) {
    console.error('❌ AI Generate Draft Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat com Cliente (com histórico)
app.post('/api/ai/chat-client', async (req, res) => {
  const { clientData, userMessage, conversationHistory } = req.body;
  try {
    if (!userMessage) {
      return res.status(400).json({ error: 'userMessage é obrigatório' });
    }

    const openai = getOpenAI();
    const systemMessage = `You are a helpful Brazilian legal assistant for client: ${clientData?.name || 'Cliente'}. 
Answer questions about law in Portuguese (Brazil). Be professional and precise.
Client area of interest: ${clientData?.legalArea || 'General'}`;

    const messages: any[] = [
      {
        role: 'system',
        content: systemMessage
      }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role || 'user',
          content: msg.content || msg.text || ''
        });
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: userMessage
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
    });

    const message = response.choices[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';
    res.json({ success: true, message });
  } catch (error: any) {
    console.error('❌ AI Chat Client Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Catch-all para React Router
app.get('*', (req, res) => {
  res.sendFile('dist/index.html');
});

// --- 4. LIGAR SERVIDOR ---
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});