import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { jwtDecode } from 'jwt-decode';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ⚠️ ROTAS DE API DEVEM VIR ANTES DO express.static('dist')
// Senão o Vite vai interceptar com o catch-all
app.post('/api/auth/admin-reset-password', async (req, res) => {
  try {
    const { userId, newPassword, userEmail } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    if (!userId && !userEmail) {
      return res.status(400).json({ error: 'userId ou userEmail é obrigatório' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    
    if (!serviceRoleKey) {
      console.error('Erro: SUPABASE_SERVICE_ROLE_KEY não definida');
      console.error('Variáveis disponíveis:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
      return res.status(500).json({ error: 'Variável SUPABASE_SERVICE_ROLE_KEY não configurada' });
    }

    const supabaseAdmin = createClient(supabaseUrl || '', serviceRoleKey);

    let targetUserId = userId;
    
    // Se só temos email, busca na tabela public.users
    if (!targetUserId && userEmail) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .ilike('email', userEmail)
        .single();
      
      if (user) {
        targetUserId = user.id;
      }
    }
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'userId ou userEmail é obrigatório' });
    }

    // Tentar atualizar a senha
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      password: newPassword
    });

    if (error) {
      console.log('Nota: Usuário não encontrado em auth.users, pode ser usuário criado manualmente');
      return res.status(500).json({ 
        error: `Erro ao resetar senha: ${error.message}` 
      });
    }

    // Marcar que o usuário deve alterar a senha na próxima vez que logar
    await supabaseAdmin
      .from('users')
      .update({ mustChangePassword: true })
      .eq('id', targetUserId);

    return res.json({ 
      success: true, 
      message: `Senha alterada com sucesso. Usuário será obrigado a alterar na próxima vez que logar`,
      email: data.user.email
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: `Erro: ${error.message}`
    });
  }
});

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
    // Detailed logging to surface OpenAI client errors (status, body, stack)
    try {
      console.error('❌ AI Generate Draft Error:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        response: error?.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data || error.response.body || null
        } : null
      });
    } catch (logErr) {
      console.error('❌ Error while logging original error:', logErr);
      console.error('Original error:', error);
    }

    res.status(500).json({ success: false, error: error?.message || 'Internal Server Error' });
  }
});

// Search Jurisprudence
app.post('/api/ai/search-jurisprudence', async (req, res) => {
  const { query } = req.body;
  try {
    if (!query) {
      return res.status(400).json({ error: 'query é obrigatório' });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Você é um assistente jurídico especializado em jurisprudência brasileira. Busque CASOS REAIS e JULGAMENTOS relevantes sobre: "${query}"

Procure em bases conhecidas como: STJ, STF, TJSP, TJ de outros estados.

Retorne uma lista JSON de 3-5 casos REAIS com:
- tribunal: Nome do tribunal (STJ, STF, TJSP, etc)
- numero_processo: Número do processo quando disponível (ou "Não especificado")
- resumo: Resumo EXATO da decisão
- resultado: Favorável/Desfavorável/Parcial
- relevancia: Score 0-100
- ano: Ano do julgamento se conhecido

Se não souber casos específicos, indique que a informação não está disponível. NUNCA crie casos fictícios.

RESPONDA COMO UM ARRAY JSON VÁLIDO, SEM MARKDOWN, SEM CÓDIGO BLOCKS:
[
  { "tribunal": "...", "numero_processo": "...", "resumo": "...", "resultado": "...", "relevancia": 0, "ano": "..." },
  ...
]`
        }
      ],
      temperature: 0.7
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response');

    const cleaned = raw.replace(/^```json|```$/g, '').trim();
    let result = JSON.parse(cleaned);

    // Garante que o resultado é sempre um array
    if (!Array.isArray(result)) {
      if (result.casos) result = result.casos;
      else if (result.cases) result = result.cases;
      else if (result.results) result = result.results;
      else result = [result]; // Wraps single object in array
    }

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ AI Search Jurisprudence Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Client Report (IA Insights)
app.post('/api/ai/generate-client-report', async (req, res) => {
  const { clientData } = req.body;
  try {
    if (!clientData) {
      return res.status(400).json({ error: 'clientData é obrigatório' });
    }

    const openai = getOpenAI();
    const prompt = `Você é um analista jurídico sênior. Gere um RELATÓRIO EXECUTIVO sobre este cliente:

DADOS DO CLIENTE:
- Nome: ${clientData.name || 'N/A'}
- CPF/CNPJ: ${clientData.cpf_cnpj || 'N/A'}
- Email: ${clientData.email || 'N/A'}
- Telefone: ${clientData.phone || 'N/A'}
- Áreas: ${clientData.caseAreas?.join(', ') || 'N/A'}
- Status: ${clientData.status || 'Ativo'}
- Data de Registro: ${clientData.createdAt || 'N/A'}

ANÁLISE SOLICITADA:
1. Perfil jurídico do cliente (tipos de casos, padrões)
2. Riscos identificados (áreas de atenção)
3. Potencial de valor agregado
4. Recomendações de serviços
5. Próximos passos sugeridos

Responda em formato TEXTO ESTRUTURADO (sem JSON).`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const report = response.choices[0]?.message?.content || 'Não foi possível gerar relatório';

    res.json({ success: true, result: report });
  } catch (error: any) {
    console.error('❌ AI Generate Client Report Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Next Action for Client
app.post('/api/ai/generate-next-action', async (req, res) => {
  const { clientData } = req.body;
  try {
    if (!clientData) {
      return res.status(400).json({ error: 'clientData é obrigatório' });
    }

    const openai = getOpenAI();
    const prompt = `Você é um gestor de casos jurídico sênior. Sugira a PRÓXIMA AÇÃO IMEDIATA para este cliente:

DADOS DO CLIENTE:
- Nome: ${clientData.name || 'N/A'}
- Áreas: ${clientData.caseAreas?.join(', ') || 'N/A'}
- Status: ${clientData.status || 'Ativo'}
- Último Contato: ${clientData.lastContact || 'N/A'}

CONTEXTO:
- Quantos casos ativos: ${clientData.activeCases || 0}
- Valor total em litígio: R$ ${clientData.totalValue || 0}

RECOMENDAÇÃO:
Sugira 1-3 ações PRÁTICAS E IMEDIATAS que o advogado deve tomar AGORA:
1. [Ação específica com prazo]
2. [Ação específica com prazo]
3. [Ação específica com prazo]

Seja direto e acionável.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8
    });

    const action = response.choices[0]?.message?.content || 'Não foi possível gerar ação recomendada';

    res.json({ success: true, result: action });
  } catch (error: any) {
    console.error('❌ AI Generate Next Action Error:', error);
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

// Análise de Caso - Profunda
app.post('/api/ai/analyze-case-deep', async (req, res) => {
  const { clientName, caseType, facts } = req.body;
  try {
    if (!clientName || !caseType || !facts) {
      return res.status(400).json({ error: 'clientName, caseType, facts são obrigatórios' });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Analyze this legal case BEFORE drafting:

CLIENT: ${clientName}
TYPE: ${caseType}
FACTS: ${facts}

Provide structured analysis in ONLY valid JSON:
1. context: Brief understanding of the case
2. relevantClauses: 3-5 key legal clauses to include (array of strings)
3. criticalPoints: Points that must be covered (array)
4. riskFactors: Potential weaknesses to address (array)
5. suggestedApproach: Recommended writing strategy

Return ONLY JSON, no markdown, no code blocks.`
        }
      ]
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response');

    const cleaned = raw.replace(/^```json|```$/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ AI Analyze Case Deep Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Draft Variations
app.post('/api/ai/generate-draft-variations', async (req, res) => {
  const { type, clientName, facts } = req.body;
  try {
    if (!type || !clientName || !facts) {
      return res.status(400).json({ error: 'type, clientName, facts são obrigatórios' });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Generate 4 versions of a legal document "${type}" for ${clientName}:

FACTS: ${facts}

Create ONLY valid JSON object with 4 complete draft versions as strings:
{
  "aggressive": "...",
  "conciliatory": "...",
  "technical": "...",
  "balanced": "..."
}

Each version should be 300-400 words in Portuguese (Brazil) and include Header, Facts (tailored), and Requests.
Return ONLY JSON, no markdown.`
        }
      ],
      temperature: 0.7,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response');

    const cleaned = raw.replace(/^```json|```$/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ AI Generate Draft Variations Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Estimate Case Value
app.post('/api/ai/estimate-case-value', async (req, res) => {
  const { caseArea, description } = req.body;
  try {
    if (!caseArea || !description) {
      return res.status(400).json({ error: 'caseArea, description são obrigatórios' });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Como especialista em AVALIAÇÃO ECONÔMICA DE CASOS para escritório de advocacia brasileiro, calcule o valor real do caso:

Área: ${caseArea}
Relato: ${description}

METODOLOGIA DE ANÁLISE:
1. BASE FACTUAL: Identifique valores específicos (salários, danos, períodos)
2. JURISPRUDÊNCIA STJ: Qual é a indenização média aprovada para casos similares?
3. AJUSTES: Considere sucumbência, honorários advocatícios (20-30%), custas
4. CENÁRIOS: Melhor caso (80% êxito) vs Pior caso (30% êxito)
5. RENTABILIDADE: Valor líquido ÷ horas estimadas deve ser > R$ 500/hora

Retorne JSON com TODOS os 4 campos OBRIGATORIAMENTE PREENCHIDOS:
{
  "estimatedRange": "Intervalo realista em BRL com base em jurisprudência",
  "complexity": "Avaliação honesta de horas necessárias (Simples: <20h, Moderada: 20-60h, Complexa: >60h)",
  "potentialOutcome": "Taxa de sucesso estimada baseada em jurisprudência dominante",
  "recommendedApproach": "Estratégia específica: extrajudicial, conciliação, ação simples, ação ordinária, etc"
}

Responda ONLY com JSON válido, sem markdown, sem code blocks.`
        }
      ]
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response');

    const cleaned = raw.replace(/^```json|```$/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ AI Estimate Case Value Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze Viability
app.post('/api/ai/analyze-viability', async (req, res) => {
  const { caseArea, description } = req.body;
  try {
    if (!caseArea || !description) {
      return res.status(400).json({ error: 'caseArea, description são obrigatórios' });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `ANÁLISE CRÍTICA DE VIABILIDADE PROCESSUAL - Sistema de Triagem para Advocacia Brasileira

Área: ${caseArea}
Caso: ${description}

MATRIZ DE DECISÃO (Responda rigorosamente):
1. FATO + DIREITO: Existe causa de pedir clara? Cliente tem legitimidade ativa?
2. DEFESA PREVISÍVEL: Qual será a tese contrária? Conseguimos rebatê-la com jurisprudência?
3. PROVA: Qual a probabilidade de gerar prova suficiente?
4. JURISPRUDÊNCIA STJ/STF: Há súmula ou precedentes contra nós? Qual a taxa de sucesso?
5. TEMPO PROCESSUAL: Ação simples (6-12 meses), ordinária (2-4 anos), superior (3-5 anos)?
6. CUSTAS/HONORÁRIOS: Será lucrativo considerando custas processuais?
7. CLIENTE: É solvente? Pode arcar com custas? Resistirá processo longo?

Retorne JSON com TODOS os 5 campos OBRIGATORIAMENTE PREENCHIDOS:
{
  "viability": "Alta (70%+ chance), Média (40-70%), ou Baixa (<40%)",
  "reasoning": "Fundamente com STJ/STF específico",
  "risks": ["risco 1 ESPECÍFICO e REALISTA", "risco 2", "risco 3"],
  "opportunities": ["diferencial 1 que aumenta viabilidade", "diferencial 2"],
  "recommendation": "CLARA: Aceitar/Recusar"
}

Responda SEM markdown, SEM code blocks, APENAS JSON válido`
        }
      ]
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response');

    const cleaned = raw.replace(/^```json|```$/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ AI Analyze Viability Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Suggest Deadlines for Agenda
app.post('/api/ai/suggest-deadlines', async (req, res) => {
  const { eventTitle, eventDescription, eventType } = req.body;
  try {
    if (!eventTitle || !eventType) {
      return res.status(400).json({ error: 'eventTitle e eventType são obrigatórios' });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Como especialista em prazos processuais brasileiros, sugira datas e prazos críticos para: "${eventTitle}"
          
Tipo de evento: ${eventType}
Descrição: ${eventDescription || 'N/A'}

Retorne em formato texto:
- Prazo recomendado (em dias/semanas)
- Datas críticas associadas
- Alertas importantes
- Observações legais relevantes`
        }
      ],
      temperature: 0.7
    });

    const suggestion = response.choices[0]?.message?.content || 'Não foi possível gerar sugestão';

    res.json({ success: true, result: suggestion });
  } catch (error: any) {
    console.error('❌ AI Suggest Deadlines Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate Preparation Checklist
app.post('/api/ai/generate-preparation-checklist', async (req, res) => {
  const { eventTitle, eventType, caseArea } = req.body;
  try {
    if (!eventTitle || !eventType) {
      return res.status(400).json({ error: 'eventTitle e eventType são obrigatórios' });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Como especialista jurídico, gere um CHECKLIST DE PREPARAÇÃO para: "${eventTitle}"

Tipo de evento: ${eventType}
Área jurídica: ${caseArea || 'Geral'}

Retorne um checklist estruturado com:
1. Documentos necessários (listar cada um)
2. Procedimentos a executar (passo a passo)
3. Contatos/comunicações necessárias
4. Prazo para cada item
5. Responsáveis

Use formato simples e acionável.`
        }
      ],
      temperature: 0.7
    });

    const checklist = response.choices[0]?.message?.content || 'Não foi possível gerar checklist';

    res.json({ success: true, result: checklist });
  } catch (error: any) {
    console.error('❌ AI Generate Preparation Checklist Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze Agenda Conflicts
app.post('/api/ai/analyze-agenda-conflicts', async (req, res) => {
  const { upcomingEvents } = req.body;
  try {
    if (!upcomingEvents || !Array.isArray(upcomingEvents)) {
      return res.status(400).json({ error: 'upcomingEvents é obrigatório (array)' });
    }

    const openai = getOpenAI();
    const eventsText = upcomingEvents.map((e, i) => `${i + 1}. ${e.title} (${e.type}) - ${e.date}`).join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Analise CONFLITOS E SOBREPOSIÇÕES nos seguintes compromissos jurídicos:

${eventsText}

Identifique:
1. Conflitos de data/hora (mesma data, tempos sobrepostos)
2. Precedências (qual deve ser feito primeiro)
3. Dependências entre eventos
4. Recomendações de reordenação
5. Risco de não cumprimento de prazos

Seja específico e acionável.`
        }
      ],
      temperature: 0.7
    });

    const analysis = response.choices[0]?.message?.content || 'Não foi possível analisar conflitos';

    res.json({ success: true, result: analysis });
  } catch (error: any) {
    console.error('❌ AI Analyze Agenda Conflicts Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Parser para texto formatado de resumo de agenda
const parseAgendaSummaryText = (text: string) => {
  const result: any = {
    visaoGeral: { totalCompromisos: 0, urgenciaDistribuicao: { alta: 0, media: 0, baixa: 0 }, tiposDistribuicao: {}, resumoUltilizado: '' },
    prioridadesCriticas: [],
    cargaTrabalho: { diasMaisCarregados: [], diasComRespiro: [], analiseDistribuicao: '', percentualUsoSemanal: '0%', indicador: 'N/A' },
    prazos: { vencimentosProximos: [], precedencias: [], dependencias: '', riscoDeProcrastinacao: 'Médio' },
    recomendacoesEstrategicas: [],
    riscos: [],
    oportunidades: { eficiencia: [], proatividade: [], otimizacaoTempo: '' },
    metricas: { indicadorSaude: 'Boa', taxaComplementacao: '0%', tempoMedioComprometimento: '0h', nivelStress: 'Moderado', balanceWorkLife: 'N/A' },
    proximasAcoes: []
  };

  const lines = text.split('\n').filter(l => l.trim());
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detectar seções
    if (trimmed.includes('VISÃO GERAL')) currentSection = 'visaoGeral';
    else if (trimmed.includes('PRIORIDADES CRÍTICAS')) currentSection = 'prioridades';
    else if (trimmed.includes('CARGA DE TRABALHO')) currentSection = 'carga';
    else if (trimmed.includes('PRAZOS CRÍTICOS')) currentSection = 'prazos';
    else if (trimmed.includes('RECOMENDAÇÕES ESTRATÉGICAS')) currentSection = 'recomendacoes';
    else if (trimmed.includes('RISCOS IDENTIFICADOS')) currentSection = 'riscos';
    else if (trimmed.includes('OPORTUNIDADES')) currentSection = 'oportunidades';
    else if (trimmed.includes('PRÓXIMAS AÇÕES')) currentSection = 'proximasAcoes';

    // Parser por seção
    if (currentSection === 'visaoGeral') {
      if (trimmed.match(/Total de compromissos:\s*(\d+)/i)) {
        result.visaoGeral.totalCompromisos = parseInt(RegExp.$1);
      }
      if (trimmed.match(/Alto\s*(\d+)/i)) result.visaoGeral.urgenciaDistribuicao.alta = parseInt(RegExp.$1);
      if (trimmed.match(/Médio\s*(\d+)/i)) result.visaoGeral.urgenciaDistribuicao.media = parseInt(RegExp.$1);
      if (trimmed.match(/Baixo\s*(\d+)/i)) result.visaoGeral.urgenciaDistribuicao.baixa = parseInt(RegExp.$1);
    }

    if (currentSection === 'prioridades' && trimmed.match(/^\d+\./)) {
      const match = trimmed.match(/^\d+\.\s*(.+?)\s*(?:-|–)\s*Razão:\s*(.+?)(?:\.|$)/);
      if (match) {
        result.prioridadesCriticas.push({
          ordem: result.prioridadesCriticas.length + 1,
          titulo: match[1].trim(),
          razao: match[2].trim(),
          impactoAusencia: 'Impacto potencial',
          acaoRecomendada: 'Tomar ação apropriada'
        });
      }
    }

    if (currentSection === 'carga') {
      if (trimmed.match(/(\d{4}-\d{2}-\d{2})\s*com\s*(\d+)/)) {
        result.cargaTrabalho.diasMaisCarregados.push({
          data: RegExp.$1,
          quantidade: parseInt(RegExp.$2),
          compromissos: ''
        });
      }
      if (trimmed.match(/estão\s*(bem distribuídos|sobrecarregados)/i)) {
        result.cargaTrabalho.analiseDistribuicao = trimmed;
      }
    }

    if (currentSection === 'prazos') {
      if (trimmed.match(/(\d{4}-\d{2}-\d{2})/)) {
        const dates = trimmed.match(/(\d{4}-\d{2}-\d{2})/g) || [];
        dates.forEach(date => {
          if (!result.prazos.vencimentosProximos.find((v: any) => v.data === date)) {
            result.prazos.vencimentosProximos.push({
              data: date,
              diasRestantes: 7,
              titulo: 'Compromisso',
              prioridade: 'Média'
            });
          }
        });
      }
    }

    if (currentSection === 'recomendacoes' && trimmed.match(/^\d+\./)) {
      result.recomendacoesEstrategicas.push({
        numero: result.recomendacoesEstrategicas.length + 1,
        acao: trimmed.substring(trimmed.indexOf('.') + 1).trim(),
        prazo: 'ASAP',
        beneficio: 'Melhoria no planejamento',
        esforço: 'Médio'
      });
    }

    if (currentSection === 'riscos' && trimmed.match(/^\d+\./)) {
      result.riscos.push({
        risco: trimmed.substring(trimmed.indexOf('.') + 1).split('-')[0].trim(),
        probabilidade: 'Média',
        impacto: trimmed.split('Impacto:')[1]?.trim() || 'Verificar',
        mitigacao: 'Planejamento antecipado'
      });
    }

    if (currentSection === 'oportunidades') {
      if (trimmed.includes('Eficiência:')) {
        result.oportunidades.eficiencia.push(trimmed.replace(/^[^:]+:\s*/, ''));
      }
      if (trimmed.includes('Proatividade:')) {
        result.oportunidades.proatividade.push(trimmed.replace(/^[^:]+:\s*/, ''));
      }
    }
  }

  // Defaults para campos obrigatórios
  result.metricas.indicadorSaude = 'Boa';
  result.metricas.nivelStress = 'Moderado';
  result.metricas.balanceWorkLife = 'Bem distribuído';

  return result;
};

// Generate Agenda Summary
app.post('/api/ai/generate-agenda-summary', async (req, res) => {
  const { events, period } = req.body;
  try {
    if (!events || !Array.isArray(events) || !period) {
      return res.status(400).json({ error: 'events (array) e period (semanal/mensal) são obrigatórios' });
    }

    const openai = getOpenAI();
    const eventsText = events.map((e, i) => `${i + 1}. ${e.title} (${e.urgency}) - ${e.date} [${e.type}]`).join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: `GERE UM RESUMO EXECUTIVO ULTRA DETALHADO DA AGENDA ${period.toUpperCase()}

DADOS DOS COMPROMISSOS:
${eventsText}

RETORNE JSON VÁLIDO (sem markdown, sem code blocks) com TODAS as seções abaixo:

{
  "visaoGeral": {
    "totalCompromisos": número,
    "urgenciaDistribuicao": {
      "alta": número,
      "media": número,
      "baixa": número
    },
    "tiposDistribuicao": {
      "Judicial": número,
      "Administrativo": número,
      "Interno": número,
      "Diligencia": número,
      "ExtraJudicial": número
    },
    "resumoUltilizado": "[1-2 linhas sobre o panorama geral]"
  },
  "prioridadesCriticas": [
    {
      "ordem": 1,
      "titulo": "[titulo completo]",
      "razao": "[por que é crítico]",
      "impactoAusencia": "[o que acontece se não fizer]",
      "acaoRecomendada": "[próximo passo específico]"
    },
    {"ordem": 2, ...},
    {"ordem": 3, ...}
  ],
  "cargaTrabalho": {
    "diasMaisCarregados": [
      {"data": "YYYY-MM-DD", "quantidade": número, "compromissos": "[títulos]"}
    ],
    "diasComRespiro": ["datas em YYYY-MM-DD"],
    "analiseDistribuicao": "[análise detalhada de como estão espalhados]",
    "percentualUsoSemanal": "XX%",
    "indicador": "[Sobrecarregado / Bem distribuído / Subutilizado]"
  },
  "prazos": {
    "vencimentosProximos": [
      {"data": "YYYY-MM-DD", "diasRestantes": número, "titulo": "[titulo]", "prioridade": "Alta/Média/Baixa"}
    ],
    "precedencias": [
      {"deve_ser_feito_antes": "[A precisa ser antes de B]"}
    ],
    "dependencias": "[lista de dependências entre compromissos]",
    "riscoDeProcrastinacao": "[Baixo / Médio / Alto]"
  },
  "recomendacoesEstrategicas": [
    {
      "numero": 1,
      "acao": "[ação concreta e específica]",
      "prazo": "[quando fazer]",
      "beneficio": "[benefício esperado]",
      "esforço": "[Baixo / Médio / Alto]"
    },
    {"numero": 2, ...},
    {"numero": 3, ...},
    {"numero": 4, ...},
    {"numero": 5, ...}
  ],
  "riscos": [
    {
      "risco": "[descrição específica]",
      "probabilidade": "[Baixa / Média / Alta]",
      "impacto": "[detalhamento do dano se ocorrer]",
      "mitigacao": "[como prevenir ou minimizar]"
    },
    {"numero": 2, ...},
    {"numero": 3, ...},
    {"numero": 4, ...}
  ],
  "oportunidades": {
    "eficiencia": [
      "[dica 1 com métrica específica de ganho]",
      "[dica 2]",
      "[dica 3]"
    ],
    "proatividade": [
      "[o que preparar com antecedência + quando]",
      "[o que preparar com antecedência + quando]"
    ],
    "otimizacaoTempo": "[estimativa de horas que podem ser economizadas]"
  },
  "metricas": {
    "indicadorSaude": "[Ótima / Boa / Atenção / Crítica]",
    "taxaComplementacao": "XX%",
    "tempoMedioComprometimento": "[X horas/dia]",
    "nivelStress": "[Baixo / Moderado / Alto]",
    "balanceWorkLife": "[descrição do equilíbrio]"
  },
  "proximasAcoes": [
    {"ordem": 1, "acao": "[ação imediata]", "prazo": "[até quando]"},
    {"ordem": 2, "acao": "[ação próximos dias]", "prazo": "[até quando]"}
  ]
}

IMPORTANTE: 
- Retorne APENAS JSON válido, sem markdown, sem explicações
- Preencha TODAS as seções
- Use datas em formato YYYY-MM-DD
- Seja específico e contextuado com os dados fornecidos
- Nenhum campo pode estar vazio ou incompleto`
        }
      ],
      temperature: 0.7
    });

    const raw = response.choices[0]?.message?.content;
    console.log('📝 Raw AI Response (first 300 chars):', raw?.substring(0, 300));
    if (!raw) throw new Error('Empty response from OpenAI');

    const cleaned = raw.replace(/^```json|```$/g, '').replace(/^```|```$/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(cleaned);
      console.log('✅ Valid JSON parsed');
    } catch (parseError) {
      console.log('⚠️ Not valid JSON, attempting text parsing...');
      // Se não for JSON válido, fazer parsing do texto formatado
      result = parseAgendaSummaryText(cleaned);
      console.log('✅ Parsed as formatted text');
    }

    console.log('✅ Final result keys:', Object.keys(result || {}));
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ AI Generate Agenda Summary Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Diagnose Intake
app.post('/api/ai/diagnose-intake', async (req, res) => {
  const { answers } = req.body;
  try {
    if (!answers) {
      return res.status(400).json({ error: 'answers é obrigatório' });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `VOCÊ É UM ESPECIALISTA SENIOR EM TRIAGEM DE CASOS JURÍDICOS BRASILEIROS.

RELATO DO CLIENTE:
"${answers}"

ANÁLISE CRÍTICA E ESPECÍFICA (NÃO GENÉRICA):
1. Qual é EXATAMENTE a causa jurídica (direito civil, penal, trabalhista, etc)?
2. Quais são os PRAZOS específicos mencionados ou implícitos (prescrição, caducidade)?
3. Que JURISPRUDÊNCIA STJ/STF se aplica ESPECIFICAMENTE?
4. Qual é o POTENCIAL ECONÔMICO real baseado no relato?
5. Que DOCUMENTOS são ESPECÍFICOS para este caso?

RETORNE JSON COM ANÁLISE CONTEXTUALIZADA:
{
  "area": "Área jurídica específica DESTE caso",
  "urgency": "Alta/Média/Baixa (justificada pelo contexto)",
  "suggestedAction": "Ação ESPECÍFICA derivada DOS FATOS descritos",
  "riskLevel": "Alto/Médio/Baixo (baseado em jurisprudência real)",
  "estimatedComplexity": "Simples/Moderada/Complexa",
  "requiredDocuments": ["documentos ESPECÍFICOS para este caso"],
  "nextSteps": ["passos ESPECÍFICOS para este caso"],
  "criticalDeadlines": "Prazos específicos identificados",
  "potentialValue": "Estimativa baseada NOS FATOS"
}

RESPONDA APENAS COM JSON VÁLIDO, SEM MARKDOWN, SEM EXPLICAÇÕES.`
        }
      ],
      temperature: 0.8
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response');

    const cleaned = raw.replace(/^```json|```$/g, '').trim();
    const result = JSON.parse(cleaned);

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ AI Diagnose Intake Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor rodando' });
});

// Reset de Senha Robusto (Admin)
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, userEmail } = req.body;
    
    if (!email && !userEmail) {
      console.warn('⚠️ Email não fornecido');
      return res.status(400).json({ error: 'email ou userEmail é obrigatório' });
    }

    const targetEmail = email || userEmail;
    console.log(`🔐 Tentando resetar senha para: ${targetEmail}`);

    // Limpar email (remover espaços)
    const cleanEmail = targetEmail.trim().toLowerCase();
    console.log(`📧 Email limpo: ${cleanEmail}`);

    const supabase = getSupabase();
    
    // Opção 1: Tentar com resetPasswordForEmail (padrão)
    const redirectUrl = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/reset-password-confirm`;
    console.log(`🔗 Redirect URL: ${redirectUrl}`);
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl
    });

    if (resetError) {
      console.error('❌ Erro ao resetar senha (método 1):', resetError.message);
      
      // Se falhar, tentar encontrar o usuário no banco
      try {
        console.log(`🔍 Procurando usuário com email: ${cleanEmail}`);
        
        const { data: userData, error: findError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', cleanEmail)
          .single();

        if (findError) {
          console.warn('⚠️ Usuário não encontrado com .eq(), tentando .ilike()');
          
          const { data: userData2, error: findError2 } = await supabase
            .from('profiles')
            .select('id, email')
            .ilike('email', cleanEmail)
            .single();

          if (findError2) {
            console.error('❌ Usuário não encontrado:', findError2.message);
            return res.status(404).json({ 
              error: `Usuário não encontrado: ${cleanEmail}` 
            });
          }

          // Tentar novamente com email exato
          console.log(`🔄 Tentando reset com email exato: ${userData2.email}`);
          const { error: retryError } = await supabase.auth.resetPasswordForEmail(userData2.email, {
            redirectTo: redirectUrl
          });

          if (retryError) {
            console.error('❌ Erro no retry:', retryError.message);
            return res.status(500).json({ 
              error: `Falha ao resetar: ${retryError.message}`
            });
          }

          console.log(`✅ Email enviado para: ${userData2.email}`);
          return res.json({ 
            success: true, 
            message: `Email de reset enviado para ${userData2.email}`,
            email: userData2.email
          });
        }

        // Tentar novamente com o email exato
        console.log(`🔄 Tentando reset com email exato: ${userData.email}`);
        const { error: retryError } = await supabase.auth.resetPasswordForEmail(userData.email, {
          redirectTo: redirectUrl
        });

        if (retryError) {
          console.error('❌ Erro no retry:', retryError.message);
          return res.status(500).json({ 
            error: `Falha ao resetar: ${retryError.message}`
          });
        }

        console.log(`✅ Email enviado para: ${userData.email}`);
        return res.json({ 
          success: true, 
          message: `Email de reset enviado para ${userData.email}`,
          email: userData.email
        });
      } catch (dbError: any) {
        console.error('❌ Erro na query:', dbError.message);
        return res.status(500).json({ 
          error: `Erro no banco: ${dbError.message}`
        });
      }
    }

    console.log(`✅ Email enviado para: ${cleanEmail}`);
    return res.json({ 
      success: true, 
      message: `Email de reset enviado para ${cleanEmail}`,
      email: cleanEmail
    });
  } catch (error: any) {
    console.error('❌ Erro geral:', error.message, error.stack);
    return res.status(500).json({ 
      error: `Erro: ${error.message}`
    });
  }
});

// ⚠️ Servir arquivos estáticos DEPOIS de todas as rotas de API
app.use(express.static('dist'));

// Catch-all para React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- 4. LIGAR SERVIDOR ---
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});