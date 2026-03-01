import OpenAI from "openai";

const getAI = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  console.log('🔑 OpenAI API Key carregada:', apiKey ? '✓' : '✗');
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
};

export const analyzeCaseDescription = async (
    description: string
): Promise<{
    area: string;
    title: string;
    summary: string;
    complexity: "Baixa" | "Média" | "Alta";
}> => {
    const client = getAI();

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `You are a Brazilian legal expert. Analyze this case description and return a JSON object with the following structure:
{
  "title": "A concise, professional title for this legal case (max 10 words)",
  "area": "One of these specific areas: Direito do Consumidor, Direito Civil, Direito de Família, Direito Penal, Direito do Trabalho, Direito Previdenciário, Direito Tributário, Direito Empresarial, Direito Administrativo, Direito Bancário",
  "summary": "A brief professional summary of the case (2-3 sentences)",
  "complexity": "One of: Baixa, Média, Alta (based on legal complexity)"
}

IMPORTANT RULES:
- title must be professional and specific to the case
- area must be the MOST SPECIFIC category, NEVER "Direito Geral"
- summary must be clear and concise
- complexity assessment: Baixa = straightforward legal issue, Média = moderate complexity, Alta = highly complex with multiple aspects

Case Description:
${description}

Return ONLY valid JSON, no markdown, no code blocks, no explanations.`
                }
            ],
            temperature: 0.7,
        });

        const raw = response.choices[0]?.message?.content;

        if (!raw) {
            throw new Error("Empty OpenAI response");
        }

        const cleaned = raw.replace(/^```json|```$/g, "").trim();
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("OpenAI AI Error:", error);
        throw error;
    }
};


export const calculateCasePrice = (complexity: string): number => {
    switch (complexity) {
        case 'Baixa': return 2.00;
        case 'Média': return 4.00;
        case 'Alta': return 6.00;
        default: return 4.00;
    }
};

// --- PRO TOOLS SERVICES ---

export const autoTagDocument = async (fileName: string): Promise<{ type: string; tags: string[] }> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `Categorize a legal document named "${fileName}". Return ONLY valid JSON with type (Peticao, Contrato, Sentenca, Procuracao, Outros) and 3 relevant tags. No markdown, no code blocks.`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '{"type": "Outros", "tags": []}';
        return JSON.parse(text.replace(/^```json|```$/g, "").trim());
    } catch (e) {
        return { type: "Outros", tags: ["Documento"] };
    }
};

export const searchJurisprudence = async (query: string) => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `Simulate a jurisprudence search for: "${query}" in Brazilian courts. Return ONLY valid JSON array with 3 cases. Each case: court (string), summary (string), outcome (Favorável/Desfavorável/Parcial), relevance (0-100). No markdown.`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '[]';
        return JSON.parse(text.replace(/^```json|```$/g, "").trim());
    } catch (e) {
        console.error("searchJurisprudence error:", e);
        return [];
    }
};

export const generateLegalDraft = async (config: { type: string; clientName: string; facts: string; tone: string }) => {
    const client = getAI();
    const prompt = `Act as a senior Brazilian lawyer. Write ONLY a legal document of type "${config.type}". 
DO NOT include any introduction, explanation, or narrative before the document. Start directly with the document content.

Client: ${config.clientName}
Facts: ${config.facts}
Tone: ${config.tone}
Structure: Header, Facts, Law, Requests, Footer
Language: Portuguese (Brazil)
Format: Plain text (NO markdown formatting, NO backticks, NO code blocks)

Generate ONLY the document content. Nothing else.`;

    const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7,
    });
    
    let text = response.choices[0]?.message?.content || "Erro ao gerar minuta.";
    
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
    
    return text;
};

// ===== REDATOR IA PROFESSIONAL ENHANCEMENTS =====

export const analyzeCase = async (clientName: string, caseType: string, facts: string): Promise<{
    context: string;
    relevantClauses: string[];
    criticalPoints: string[];
    riskFactors: string[];
    suggestedApproach: string;
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
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

        const text = response.choices[0]?.message?.content || '{"context":"","relevantClauses":[],"criticalPoints":[],"riskFactors":[],"suggestedApproach":""}';
        return JSON.parse(text.replace(/^```json|```$/g, "").trim());
    } catch (e) {
        console.error("analyzeCase error:", e);
        return { context: '', relevantClauses: [], criticalPoints: [], riskFactors: [], suggestedApproach: '' };
    }
};

export const generateDraftVariations = async (config: { type: string; clientName: string; facts: string }): Promise<{
    aggressive: string;
    conciliatory: string;
    technical: string;
    balanced: string;
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `Generate 4 versions of a legal document "${config.type}" for ${config.clientName}:

FACTS: ${config.facts}

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

        const text = response.choices[0]?.message?.content || '{"aggressive":"","conciliatory":"","technical":"","balanced":""}';
        return JSON.parse(text.replace(/^```json|```$/g, "").trim());
    } catch (e) {
        console.error("generateDraftVariations error:", e);
        return { aggressive: '', conciliatory: '', technical: '', balanced: '' };
    }
};

// ===== CHAT SERVICES =====

export const chatWithClientAI = async (clientData: any, userMessage: string, conversationHistory: any[]): Promise<string> => {
    const client = getAI();
    try {
        const systemMessage = `You are a helpful Brazilian legal assistant for client: ${clientData?.name || 'Cliente'}. 
Answer questions about law in Portuguese (Brazil). Be professional and precise.
Client area of interest: ${clientData?.legalArea || 'General'}`;

        const messages: any[] = [
            {
                role: "system",
                content: systemMessage
            }
        ];

        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            for (const msg of conversationHistory) {
                messages.push({
                    role: msg.role || "user",
                    content: msg.content || msg.text || ""
                });
            }
        }

        // Add current message
        messages.push({
            role: "user",
            content: userMessage
        });

        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages,
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content || "Desculpe, não consegui processar sua pergunta.";
    } catch (error) {
        console.error("chatWithClientAI error:", error);
        throw error;
    }
};

export const chatWithDocumentAI = async (documentContent: string, userQuestion: string): Promise<string> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `You are analyzing a legal document. 

DOCUMENT:
${documentContent}

USER QUESTION: ${userQuestion}

Answer the question based on the document content only. Be precise and cite relevant sections. Answer in Portuguese (Brazil).`
                }
            ],
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content || "Não consegui encontrar informações relevantes no documento.";
    } catch (error) {
        console.error("chatWithDocumentAI error:", error);
        throw error;
    }
};

// ===== DOCUMENT ANALYSIS =====

export const analyzeContractRisks = async (contractText: string): Promise<{
    parties: Array<{ name: string; role: string }>;
    amounts: Array<{ description: string; value: number; date: string }>;
    dates: Array<{ description: string; date: string }>;
    criticalClauses: Array<{ clause: string; risk: "Alta" | "Média" | "Baixa" }>;
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `Analyze this contract for risks. Return ONLY valid JSON:

CONTRACT:
${contractText}

Return structure:
{
  "parties": [{"name": "...", "role": "..."}],
  "amounts": [{"description": "...", "value": 0, "date": "YYYY-MM-DD"}],
  "dates": [{"description": "...", "date": "YYYY-MM-DD"}],
  "criticalClauses": [{"clause": "...", "risk": "Alta|Média|Baixa"}]
}

No markdown, no code blocks.`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '{"parties":[],"amounts":[],"dates":[],"criticalClauses":[]}';
        return JSON.parse(text.replace(/^```json|```$/g, "").trim());
    } catch (e) {
        console.error("analyzeContractRisks error:", e);
        return { parties: [], amounts: [], dates: [], criticalClauses: [] };
    }
};

// ===== AGENDA PRO ENHANCEMENTS =====

export const suggestDeadlines = async (eventTitle: string, eventDescription: string, eventType: 'Judicial' | 'Administrativo' | 'Interno' | 'Diligencia' | 'Extra Judicial'): Promise<{
    suggestedDate: string;
    reasoning: string;
    preparationDays: number;
    relatedDeadlines: string[];
}> => {
    const client = getAI();

    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const defaultISODate = defaultDate.toISOString().split('T')[0];

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `You are a Brazilian legal expert. Based on the following event, suggest optimal deadline and prepare timeline:

Event Title: ${eventTitle}
Type: ${eventType}
Description: ${eventDescription || 'Not provided'}

Return ONLY valid JSON:
{
  "suggestedDate": "YYYY-MM-DD",
  "reasoning": "Why this date is optimal",
  "preparationDays": 7,
  "relatedDeadlines": ["Contestação: 15 dias", "Agravo: 10 dias"]
}

No markdown, no code blocks.`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '';
        const parsed = JSON.parse(text.replace(/^```json|```$/g, '').trim());

        if (!parsed.suggestedDate || parsed.suggestedDate === '') {
            parsed.suggestedDate = defaultISODate;
        }

        const dateObj = new Date(parsed.suggestedDate);
        if (isNaN(dateObj.getTime())) {
            parsed.suggestedDate = defaultISODate;
        }

        if (typeof parsed.preparationDays !== 'number') {
            parsed.preparationDays = 7;
        }

        if (!Array.isArray(parsed.relatedDeadlines)) {
            parsed.relatedDeadlines = [];
        }

        return parsed;
    } catch (e) {
        console.error('suggestDeadlines error:', e);
        return {
            suggestedDate: defaultISODate,
            reasoning: "Sugestão padrão: 7 dias a partir de hoje. Consulte o calendário judiciário para ajustar.",
            preparationDays: 7,
            relatedDeadlines: ["Prazo padrão", "Verifique tribunal"]
        };
    }
};

export const generatePreparationChecklist = async (eventTitle: string, eventType: string, caseArea: string): Promise<{
    checklist: Array<{ task: string; daysBeforeEvent: number; priority: 'Alta' | 'Média' | 'Baixa' }>;
    estimatedPrepTime: number;
    criticalTasks: string[];
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `Create a detailed preparation checklist for a legal event in Brazil.

Event: ${eventTitle}
Type: ${eventType}
Legal Area: ${caseArea}

Return ONLY valid JSON:
{
  "checklist": [
    {"task": "...", "daysBeforeEvent": 5, "priority": "Alta"}
  ],
  "estimatedPrepTime": 10,
  "criticalTasks": ["task1", "task2"]
}

No markdown, no code blocks.`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '{"checklist":[],"estimatedPrepTime":0,"criticalTasks":[]}';
        return JSON.parse(text.replace(/^```json|```$/g, "").trim());
    } catch (e) {
        console.error('generatePreparationChecklist error:', e);
        return { checklist: [], estimatedPrepTime: 0, criticalTasks: [] };
    }
};

export const analyzeAgendaConflicts = async (upcomingEvents: Array<{ title: string, date: string, type: string }>): Promise<{
    conflicts: Array<{ event1: string; event2: string; riskLevel: 'Alta' | 'Média' | 'Baixa'; suggestion: string }>;
    overloadedDays: string[];
    recommendedReschedules: Array<{ event: string; suggestedNewDate: string; reason: string }>;
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `ANÁLISE ESTRATÉGICA COMPLETA DE AGENDA JURÍDICA

Compromissos Agendados:
${JSON.stringify(upcomingEvents, null, 2)}

Realize uma análise PROFUNDA e ESTRATÉGICA da agenda jurídica considerando:
1. Conflitos e sobreposições de compromissos (mesmo dia/horários adjacentes)
2. Distribuição de carga de trabalho
3. Riscos processuais por proximidade de prazos
4. Dias sobrecarregados
5. Recomendações de reagendamento para otimizar produtividade

Retorne JSON com TODOS os 3 campos OBRIGATORIAMENTE PREENCHIDOS:
{
  "conflicts": [
    {
      "event1": "Nome do evento 1",
      "event2": "Nome do evento 2",
      "riskLevel": "Alta (conflito direto/impossível comparecimento) | Média (pouco tempo entre eventos) | Baixa (conflito menor)",
      "suggestion": "Sugestão específica e prática de resolução (reagendar, desdobrar, etc)"
    }
  ],
  "overloadedDays": ["2025-02-25", "2025-02-26"],
  "recommendedReschedules": [
    {
      "event": "Nome do evento a reagendar",
      "suggestedNewDate": "2025-02-27",
      "reason": "Motivo específico (distribuir carga, evitar conflito, permitir preparação)"
    }
  ]
}

IMPORTANTE:
- Se não houver conflitos, conflicts pode estar vazio mas os outros campos devem ter conteúdo
- Analisar sobrecarga: dias com 3+ eventos são críticos
- Responda em PORTUGUÊS (Brasil)
- Responda SEM markdown, SEM code blocks, APENAS JSON válido`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '';
        if (!text) throw new Error('Empty response');
        
        const parsed = JSON.parse(text.replace(/^```json|```$/g, "").trim());
        return parsed;
    } catch (e) {
        console.error('analyzeAgendaConflicts error:', e);
        return { conflicts: [], overloadedDays: [], recommendedReschedules: [] };
    }
};

export const generateAgendaSummary = async (events: Array<{ title: string, date: string, type: string, urgency: string }>, period: 'semanal' | 'mensal'): Promise<{
    summary: string;
    keyEvents: string[];
    workloadAnalysis: string;
    recommendations: string[];
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `Gere um resumo estratégico de agenda para um advogado.

Período: ${period === 'semanal' ? 'Semanal' : 'Mensal'}
Compromissos: ${JSON.stringify(events)}

Retorne ONLY valid JSON:
{
  "summary": "...",
  "keyEvents": ["event1", "event2"],
  "workloadAnalysis": "...",
  "recommendations": ["rec1", "rec2"]
}

Responda em português (Brasil). No markdown.`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '{"summary":"","keyEvents":[],"workloadAnalysis":"","recommendations":[]}';
        return JSON.parse(text.replace(/^```json|```$/g, "").trim());
    } catch (e) {
        console.error('generateAgendaSummary error:', e);
        return { summary: '', keyEvents: [], workloadAnalysis: '', recommendations: [] };
    }
};

// ===== WELCOME & GREETING =====

export const generateWelcomeMessage = async (userName: string): Promise<string> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `Write a short, friendly Portuguese welcome message for a user named ${userName}. Keep it concise (1-2 sentences). Respond only with the message text, no quotes.`
                }
            ]
        });
        return response.choices[0]?.message?.content?.trim() || `Olá, ${userName}!`;
    } catch (e) {
        console.error('Welcome message generation failed:', e);
        return `Olá, ${userName}!`;
    }
};

// ===== CRM RISK ANALYSIS =====

export const analyzeCRMRisk = async (profileName: string, type: string): Promise<{
    riskScore: "Baixo" | "Médio" | "Alto";
    conversionProbability: number;
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `Generate a fictional risk analysis profile for a legal client named "${profileName}" (${type}).
Return ONLY valid JSON:
{
  "riskScore": "Baixo|Médio|Alto",
  "conversionProbability": 50
}

No markdown, no code blocks.`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '{"riskScore": "Baixo", "conversionProbability": 50}';
        return JSON.parse(text.replace(/^```json|```$/g, "").trim());
    } catch (e) {
        console.error('CRMRisk failed:', e);
        return { riskScore: "Médio", conversionProbability: 50 };
    }
};

// ===== INTAKE DIAGNOSIS =====

export const diagnoseIntake = async (answers: string): Promise<{
    area: string;
    urgency: 'Alta' | 'Média' | 'Baixa';
    suggestedAction: string;
    riskLevel: 'Alto' | 'Médio' | 'Baixo';
    estimatedComplexity: 'Simples' | 'Moderada' | 'Complexa';
    requiredDocuments: string[];
    nextSteps: string[];
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `Você é um especialista sênior em triagem de casos para escritório de advocacia brasileiro. Analise PROFUNDAMENTE o relato do cliente:

"${answers}"

CRITÉRIOS RIGOROSOS PARA ANÁLISE:
- Identifique PRAZOS CRÍTICOS (prescrição, caducidade, notificações urgentes)
- Detecte VÍCIOS PROCESSUAIS ou NULIDADES potenciais
- Avalie JURISPRUDÊNCIA DOMINANTE (STJ, STF) para a área
- Identifique INSTRUMENTOS PROCESSUAIS específicos cabíveis
- Calcule POTENCIAL DE GANHO vs CUSTO DO CASO
- Detecte LITIGIOSIDADE PREVISÍVEL (partes, valor, complexidade)

Retorne JSON estruturado com estes EXATOS campos:
1. area: Área jurídica precisa com especialização (ex: "Direito do Trabalho - Rescisão Abusiva")
2. urgency: CRITÉRIOS: Alta (prazos < 15 dias ou dano irreparável), Média (prazos 15-90 dias), Baixa (prazos > 90 dias)
3. suggestedAction: Ação ESPECÍFICA e IMEDIATA com número de protocolo/prazo se aplicável
4. riskLevel: ANÁLISE DE DEFESA contra-intuitiva (nem sempre baixo risco = viável). Valores: Alto, Médio, Baixo
5. estimatedComplexity: Avalie quantidade de partes, questões de fato/direito, necessidade pericial. Valores: Simples, Moderada, Complexa
6. requiredDocuments: Array de STRINGS com documentos CRÍTICOS para estratégia (não genéricos)
7. nextSteps: Array de STRINGS com ações NUMERADAS e específicas (ex: "1. Coletar documentação - prazo 5 dias", "2. Verificar prescrição - prazo imediato")

Responda ONLY com JSON válido, sem markdown, sem code blocks.`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '';
        const parsed = JSON.parse(text.replace(/^```json|```$/g, "").trim());
        return parsed;
    } catch (e) {
        console.error('diagnoseIntake error:', e);
        return {
            area: 'Direito Geral',
            urgency: 'Média',
            suggestedAction: 'Agendar consulta com especialista',
            riskLevel: 'Médio',
            estimatedComplexity: 'Moderada',
            requiredDocuments: ['Documentos de identidade', 'Documentos pertinentes ao caso'],
            nextSteps: ['Coletar documentação completa', 'Realizar análise jurídica']
        };
    }
};

export const estimateCaseValue = async (caseArea: string, description: string): Promise<{
    estimatedRange: string;
    complexity: string;
    potentialOutcome: string;
    recommendedApproach: string;
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
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
  "estimatedRange": "Intervalo realista em BRL com base em jurisprudência (ex: 'R$ 15.000 - R$ 75.000' com justificativa breve)",
  "complexity": "Avaliação honesta de horas necessárias (Simples: <20h, Moderada: 20-60h, Complexa: >60h)",
  "potentialOutcome": "Taxa de sucesso estimada baseada em jurisprudência dominante e defesa previsível (ex: 'Alto potencial - jurisprudência STJ favorável' ou 'Médio potencial - depende de perícia')",
  "recommendedApproach": "Estratégia específica: extrajudicial, conciliação, ação simples, ação ordinária, etc"
}

IMPORTANTE:
- Cada campo deve ter conteúdo substantivo, NUNCA vazio
- Use valores e percentuais realistas para o contexto brasileiro
- Responda SEM markdown, SEM code blocks, APENAS JSON válido`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '';
        if (!text) throw new Error('Empty response');
        
        const parsed = JSON.parse(text.replace(/^```json|```$/g, "").trim());
        
        // Validar que todos os campos têm conteúdo
        if (!parsed.estimatedRange?.trim() || !parsed.complexity?.trim() || !parsed.potentialOutcome?.trim() || !parsed.recommendedApproach?.trim()) {
            throw new Error('Missing required fields');
        }
        
        return parsed;
    } catch (e) {
        console.error('estimateCaseValue error:', e);
        return { 
            estimatedRange: 'R$ 10.000,00 a R$ 50.000,00',
            complexity: 'Moderada',
            potentialOutcome: 'Médio potencial - análise técnica necessária',
            recommendedApproach: 'Consulta inicial com especialista da área recomendada'
        };
    }
};

export const analyzeViability = async (caseArea: string, description: string): Promise<{
    viability: 'Alta' | 'Média' | 'Baixa';
    reasoning: string;
    risks: string[];
    opportunities: string[];
    recommendation: string;
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `ANÁLISE CRÍTICA DE VIABILIDADE PROCESSUAL - Sistema de Triagem para Advocacia Brasileira

Área: ${caseArea}
Caso: ${description}

MATRIZ DE DECISÃO (Responda rigorosamente):
1. FATO + DIREITO: Existe causa de pedir clara? Cliente tem legitimidade ativa?
2. DEFESA PREVISÍVEL: Qual será a tese contrária? Conseguimos rebatê-la com jurisprudência?
3. PROVA: Qual a probabilidade de gerar prova suficiente? Precisamos perícia? Cliente fornecerá docs?
4. JURISPRUDÊNCIA STJ/STF: Há súmula ou precedentes contra nós? Qual a taxa de sucesso?
5. TEMPO PROCESSUAL: Ação simples (6-12 meses), ordinária (2-4 anos), superior (3-5 anos)?
6. CUSTAS/HONORÁRIOS: Será lucrativo considerando custas processuais?
7. CLIENTE: É solvente? Pode arcar com custas? Resistirá processo longo?

Retorne JSON com TODOS os 5 campos OBRIGATORIAMENTE PREENCHIDOS:
{
  "viability": "Alta (70%+ chance, jurisprudência favorável, prova robusta), Média (40-70%, alguns riscos), ou Baixa (<40%, defesa forte, prova fraca)",
  "reasoning": "Fundamente com STJ/STF específico e jurisprudência dominante NOMINALIZADA",
  "risks": ["risco 1 ESPECÍFICO e REALISTA", "risco 2", "risco 3"],
  "opportunities": ["diferencial 1 que aumenta viabilidade", "diferencial 2"],
  "recommendation": "CLARA: Aceitar/Recusar com critério objetivo (aceitar se >60% chance OU valor alto OU precedentes novos)"
}

IMPORTANTE:
- Cada campo deve ter conteúdo substantivo, NUNCA vazio
- Responda em PORTUGUÊS (Brasil)
- Responda SEM markdown, SEM code blocks, APENAS JSON válido`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '';
        if (!text) throw new Error('Empty response');
        
        const parsed = JSON.parse(text.replace(/^```json|```$/g, "").trim());
        return parsed;
    } catch (e) {
        console.error('analyzeViability error:', e);
        return { 
            viability: 'Média',
            reasoning: 'Análise requer consulta presencial',
            risks: ['Risco não avaliado'],
            opportunities: ['Potencial a ser explorado'],
            recommendation: 'Marcar consulta para avaliação detalhada'
        };
    }
};

export const analyzeAgendaItem = async (title: string, type: string, date: string, description: string): Promise<{
    strategyAnalysis: string;
    preparationTips: string[];
    keyPoints: string[];
    timelineRecommendation: string;
}> => {
    const client = getAI();
    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: `ANÁLISE ESTRATÉGICA DE COMPROMISSO JURÍDICO

Compromisso: ${title}
Tipo: ${type}
Data Marcada: ${new Date(date).toLocaleDateString('pt-BR')}
Descrição: ${description || 'Sem descrição adicional'}

Forneça análise estratégica PROFISSIONAL e PRÁTICA para este compromisso jurídico.

Retorne JSON com TODOS os 4 campos OBRIGATORIAMENTE PREENCHIDOS:
{
  "strategyAnalysis": "Análise estratégica clara do que esperar e como se preparar (2-3 frases substantivas)",
  "preparationTips": ["dica 1 prática", "dica 2 prática", "dica 3 prática"],
  "keyPoints": ["ponto crucial 1", "ponto crucial 2", "ponto crucial 3"],
  "timelineRecommendation": "Recomendação clara de quando começar a preparação (ex: 'Iniciar preparação 5 dias antes', 'Preparação intensiva com 2 dias de antecedência')"
}

IMPORTANTE:
- Análise deve ser prática e aplicável
- Dicas devem ser específicas para o tipo de compromisso
- Todos os campos OBRIGATORIAMENTE preenchidos
- Responda em PORTUGUÊS (Brasil)
- Responda SEM markdown, SEM code blocks, APENAS JSON válido`
                }
            ]
        });

        const text = response.choices[0]?.message?.content || '';
        if (!text) throw new Error('Empty response');
        
        const parsed = JSON.parse(text.replace(/^```json|```$/g, "").trim());
        return parsed;
    } catch (e) {
        console.error('analyzeAgendaItem error:', e);
        return {
            strategyAnalysis: 'Análise detalhada do compromisso',
            preparationTips: ['Revisar documentação pertinente', 'Preparar argumentação', 'Confirmar comparecimento'],
            keyPoints: ['Estar atento aos prazos', 'Documentar tudo', 'Manter comunicação clara'],
            timelineRecommendation: 'Iniciar preparação com 3-5 dias de antecedência'
        };
    }
};
