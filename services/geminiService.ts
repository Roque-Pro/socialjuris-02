import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.REACT_APP_GEMINI_API_KEY;
  console.log('🔑 Gemini API Key carregada:', apiKey ? '✓' : '✗');
  console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? 'presente' : 'ausente');
  console.log('REACT_APP_GEMINI_API_KEY:', import.meta.env.REACT_APP_GEMINI_API_KEY ? 'presente' : 'ausente');
  return new GoogleGenAI({ apiKey });
};

export const analyzeCaseDescription = async (
    description: string
): Promise<{
    area: string;
    title: string;
    summary: string;
    complexity: "Baixa" | "Média" | "Alta";
}> => {
    const ai = getAI();

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
Return ONLY a valid JSON object matching the schema.

Rules:
- area MUST be exactly one of:
["Direito do Consumidor","Direito Civil","Direito de Família","Direito Penal","Direito do Trabalho","Direito Previdenciário","Direito Tributário","Direito Empresarial","Direito Administrativo","Direito Bancário"]
- NEVER return "Direito Geral"
- Choose the MOST SPECIFIC area.

Case:
${description}
`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        area: { type: Type.STRING },
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        complexity: {
                            type: Type.STRING,
                            enum: ["Baixa", "Média", "Alta"],
                        },
                    },
                    required: ["area", "title", "summary", "complexity"],
                },
            },
        });

        const raw =
            response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!raw) {
            throw new Error("Empty Gemini response");
        }

        const cleaned = raw.replace(/^```json|```$/g, "").trim();
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw error; // NÃO mascara mais com Direito Geral
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

// Tool 1: Auto-Tagging for Docs
export const autoTagDocument = async (fileName: string): Promise<{ type: string; tags: string[] }> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Categorize a legal document named "${fileName}". 
      Return the document Type (Peticao, Contrato, Sentenca, Procuracao, Outros) and 3 relevant tags.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"type": "Outros", "tags": []}');
    } catch (e) {
        return { type: "Outros", tags: ["Documento"] };
    }
};

// Tool 2: Jurisprudence Search
export const searchJurisprudence = async (query: string) => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Simulate a jurisprudence search for the query: "${query}" in Brazilian courts.
      Return 3 representative cases with: Court Name, Summary of Decision, Outcome (Favorável/Desfavorável/Parcial) and Relevance Score (0-100).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            court: { type: Type.STRING },
                            summary: { type: Type.STRING },
                            outcome: { type: Type.STRING, enum: ['Favorável', 'Desfavorável', 'Parcial'] },
                            relevance: { type: Type.NUMBER }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || '[]');
    } catch (e) {
        return [];
    }
};

// Tool 3: Draft Creator - ENHANCED
export const generateLegalDraft = async (config: { type: string; clientName: string; facts: string; tone: string }) => {
    const ai = getAI();
    const prompt = `Act as a senior Brazilian lawyer. Write ONLY a legal document of type "${config.type}". 
DO NOT include any introduction, explanation, or narrative before the document. Start directly with the document content.

Client: ${config.clientName}
Facts: ${config.facts}
Tone: ${config.tone}
Structure: Header, Facts, Law, Requests, Footer
Language: Portuguese (Brazil)
Format: Plain text (NO markdown formatting, NO backticks, NO code blocks)

Generate ONLY the document content. Nothing else.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });
    
    let text = response.text || "Erro ao gerar minuta.";
    
    // Remover markdown backticks se presentes
    text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
    
    // Remover explicações comuns do início
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

// 1. Análise completa do caso ANTES de gerar
export const analyzeCase = async (clientName: string, caseType: string, facts: string): Promise<{
    context: string;
    relevantClauses: string[];
    criticalPoints: string[];
    riskFactors: string[];
    suggestedApproach: string;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze this legal case BEFORE drafting:

CLIENT: ${clientName}
TYPE: ${caseType}
FACTS: ${facts}

Provide structured analysis in JSON:
1. context: Brief understanding of the case
2. relevantClauses: 3-5 key legal clauses to include
3. criticalPoints: Points that must be covered
4. riskFactors: Potential weaknesses to address
5. suggestedApproach: Recommended writing strategy

Return only valid JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        context: { type: Type.STRING },
                        relevantClauses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        criticalPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                        riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestedApproach: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"context":"","relevantClauses":[],"criticalPoints":[],"riskFactors":[],"suggestedApproach":""}');
    } catch (e) {
        return { context: '', relevantClauses: [], criticalPoints: [], riskFactors: [], suggestedApproach: '' };
    }
};

// 2. Gerar MÚLTIPLAS versões de uma minuta
export const generateDraftVariations = async (config: { type: string; clientName: string; facts: string }): Promise<{
    aggressive: string;
    conciliatory: string;
    technical: string;
    balanced: string;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate 4 versions of a legal document "${config.type}" for ${config.clientName}:

FACTS: ${config.facts}

Create JSON with 4 complete draft versions:
1. aggressive: Strong argumentation, firm stance, maximum demands
2. conciliatory: Soft tone, open to negotiation, emphasize common ground
3. technical: Pure legal analysis, cite laws, cold and formal
4. balanced: Recommended approach, balanced arguments

Each version should be 300-400 words in Portuguese (Brazil) and include:
- Header with client info
- Facts (tailored to approach)
- Legal foundation
- Clear requests

Return ONLY valid JSON with "aggressive", "conciliatory", "technical", "balanced" fields.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        aggressive: { type: Type.STRING },
                        conciliatory: { type: Type.STRING },
                        technical: { type: Type.STRING },
                        balanced: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"aggressive":"","conciliatory":"","technical":"","balanced":""}');
    } catch (e) {
        return { aggressive: '', conciliatory: '', technical: '', balanced: '' };
    }
};

// 3. Buscar jurisprudência relacionada
export const findRelatedJurisprudence = async (documentType: string, mainTopic: string): Promise<{
    cases: Array<{ summary: string; court: string; year: number; relevance: 0 | 1 | 2 | 3 }>;
    súmulas: string[];
    trends: string;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find relevant jurisprudence for a "${documentType}" about "${mainTopic}" in Brazilian law.

Return JSON with:
1. cases: 3-5 landmark cases (summary, court, year, relevance 0-3)
2. súmulas: 2-3 relevant súmulas from STJ/STF
3. trends: Current court trends on this topic

Format dates as YYYY. Be specific to Brazilian legal system.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        cases: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    summary: { type: Type.STRING },
                                    court: { type: Type.STRING },
                                    year: { type: Type.NUMBER },
                                    relevance: { type: Type.NUMBER, enum: [0, 1, 2, 3] }
                                }
                            }
                        },
                        súmulas: { type: Type.ARRAY, items: { type: Type.STRING } },
                        trends: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"cases":[],"súmulas":[],"trends":""}');
    } catch (e) {
        return { cases: [], súmulas: [], trends: '' };
    }
};

// 4. Analisar força/solidez da minuta gerada
export const analyzeDraftStrength = async (draftContent: string, draftType: string): Promise<{
    legalScore: number;
    completeness: number;
    originalityScore: number;
    successProbability: string;
    alerts: Array<{ type: string; severity: 'Alta' | 'Média' | 'Baixa'; description: string }>;
    recommendations: string[];
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the strength and quality of this legal draft (${draftType}):

DRAFT CONTENT (first 2000 chars):
${draftContent.substring(0, 2000)}...

Evaluate and return JSON with:
1. legalScore: 0-100 (legal soundness)
2. completeness: 0-100 (covers all necessary points)
3. originalityScore: 0-100 (not just template)
4. successProbability: "Alta/Média/Baixa" (likely to succeed in court)
5. alerts: Critical issues found
6. recommendations: How to improve

Be specific and constructive.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        legalScore: { type: Type.NUMBER },
                        completeness: { type: Type.NUMBER },
                        originalityScore: { type: Type.NUMBER },
                        successProbability: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] },
                        alerts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    severity: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] },
                                    description: { type: Type.STRING }
                                }
                            }
                        },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"legalScore":50,"completeness":50,"originalityScore":50,"successProbability":"Média","alerts":[],"recommendations":[]}');
    } catch (e) {
        return { legalScore: 0, completeness: 0, originalityScore: 0, successProbability: 'Média', alerts: [], recommendations: [] };
    }
};

// 5. Sugestões inteligentes em tempo real
export const suggestImprovements = async (draftContent: string, userEdit: string): Promise<{
    suggestions: Array<{ text: string; explanation: string; severity: 'Alta' | 'Média' | 'Baixa'; category: string }>;
    gainsAfterEdit: number; // Score improvement 0-100
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `A lawyer is editing a legal document. Analyze their edit and suggest improvements.

ORIGINAL SECTION:
${draftContent.substring(0, 500)}...

USER EDIT:
${userEdit}

Return JSON with:
1. suggestions: List of improvements to their edit
2. gainsAfterEdit: How much better the document becomes (0-100)

Be helpful, not critical.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING },
                                    explanation: { type: Type.STRING },
                                    severity: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] },
                                    category: { type: Type.STRING }
                                }
                            }
                        },
                        gainsAfterEdit: { type: Type.NUMBER }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"suggestions":[],"gainsAfterEdit":0}');
    } catch (e) {
        return { suggestions: [], gainsAfterEdit: 0 };
    }
};

// 6. Comparar duas versões de minuta
export const compareDrafts = async (draft1: string, draft2: string, draftType: string): Promise<{
    keyDifferences: Array<{ section: string; version1: string; version2: string; significance: 'Alta' | 'Média' | 'Baixa' }>;
    strengths1: string[];
    strengths2: string[];
    recommendation: string;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Compare two versions of the same legal document (${draftType}):

VERSION 1 (first 1000 chars):
${draft1.substring(0, 1000)}...

VERSION 2 (first 1000 chars):
${draft2.substring(0, 1000)}...

Return JSON with:
1. keyDifferences: Major changes between versions
2. strengths1: What version 1 does well
3. strengths2: What version 2 does well
4. recommendation: Which is better or how to merge

Be specific about legal implications.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        keyDifferences: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    section: { type: Type.STRING },
                                    version1: { type: Type.STRING },
                                    version2: { type: Type.STRING },
                                    significance: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] }
                                }
                            }
                        },
                        strengths1: { type: Type.ARRAY, items: { type: Type.STRING } },
                        strengths2: { type: Type.ARRAY, items: { type: Type.STRING } },
                        recommendation: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"keyDifferences":[],"strengths1":[],"strengths2":[],"recommendation":""}');
    } catch (e) {
        return { keyDifferences: [], strengths1: [], strengths2: [], recommendation: '' };
    }
};

// 7. Verificar conformidade legal
export const checkCompliance = async (draftType: string, draftContent: string): Promise<{
    conformingClauses: string[];
    missingClauses: string[];
    riskItems: Array<{ item: string; severity: 'Alta' | 'Média' | 'Baixa'; fix: string }>;
    overallCompliance: number;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Check legal compliance for a "${draftType}" document:

CONTENT (first 2000 chars):
${draftContent.substring(0, 2000)}...

Evaluate against Brazilian law and return JSON with:
1. conformingClauses: What's included correctly
2. missingClauses: What MUST be added
3. riskItems: Problematic content
4. overallCompliance: 0-100 score

Focus on Brazilian legal requirements.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        conformingClauses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        missingClauses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        riskItems: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    item: { type: Type.STRING },
                                    severity: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] },
                                    fix: { type: Type.STRING }
                                }
                            }
                        },
                        overallCompliance: { type: Type.NUMBER }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"conformingClauses":[],"missingClauses":[],"riskItems":[],"overallCompliance":50}');
    } catch (e) {
        return { conformingClauses: [], missingClauses: [], riskItems: [], overallCompliance: 0 };
    }
};


// Small welcome message generator used in dashboard
export const generateWelcomeMessage = async (userName: string) => {
    try {
        const ai = await getAI();
        const prompt = `Write a short, friendly Portuguese welcome message for a user named ${userName}. Keep it concise (1-2 sentences).`;
        const response = await ai.models.generateContent({ model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash", contents: prompt });
        return response.text?.trim() || `Olá, ${userName}!`;
    } catch (e) {
        console.error('Welcome message generation failed:', e);
        return `Olá, ${userName}!`;
    }
};

// Tool 5: CRM Risk Analysis
export const analyzeCRMRisk = async (profileName: string, type: string) => {
    // Simulation logic since we don't have real financial data
    try {
        const ai = await getAI();
        const response = await ai.models.generateContent({
            model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash",
            contents: `Generate a fictional risk analysis profile for a legal client named "${profileName}" (${type}).
      Return Risk Score (Baixo/Médio/Alto) and Conversion Probability (0-100).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riskScore: { type: Type.STRING, enum: ['Baixo', 'Médio', 'Alto'] },
                        conversionProbability: { type: Type.NUMBER }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"riskScore": "Baixo", "conversionProbability": 50}');
    } catch (e) {
        console.error('CRMRisk failed:', e);
        return { riskScore: "Médio", conversionProbability: 50 };
    }
};

// Tool 7: Intake Diagnosis (Enhanced)
export const diagnoseIntake = async (answers: string): Promise<{
    area: string;
    urgency: 'Alta' | 'Média' | 'Baixa';
    suggestedAction: string;
    riskLevel: 'Alto' | 'Médio' | 'Baixo';
    estimatedComplexity: 'Simples' | 'Moderada' | 'Complexa';
    requiredDocuments: string[];
    nextSteps: string[];
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Você é um especialista sênior em triagem de casos para escritório de advocacia brasileiro. Analise PROFUNDAMENTE o relato do cliente:

"${answers}"

CRITÉRIOS RIGOROSOS PARA ANÁLISE:
- Identifique PRAZOS CRÍTICOS (prescrição, caducidade, notificações urgentes)
- Detecte VÍCIOS PROCESSUAIS ou NULIDADES potenciais
- Avalie JURISPRUDÊNCIA DOMINANTE (STJ, STF) para a área
- Identifique INSTRUMENTOS PROCESSUAIS específicos cabíveis
- Calcule POTENCIAL DE GANHO vs CUSTO DO CASO
- Detecte LITIGIOSIDADE PREVISÍVEL (partes, valor, complexidade)

Retorne JSON estruturado:
1. area: Área jurídica precisa com especialização (ex: "Direito do Trabalho - Rescisão Abusiva")
2. urgency: CRITÉRIOS: Alta (prazos < 15 dias ou dano irreparável), Média (prazos 15-90 dias), Baixa (prazos > 90 dias)
3. suggestedAction: Ação ESPECÍFICA e IMEDIATA com número de protocolo/prazo se aplicável
4. riskLevel: ANÁLISE DE DEFESA contra-intuitiva (nem sempre baixo risco = viável)
5. estimatedComplexity: Avalie quantidade de partes, questões de fato/direito, necessidade pericial
6. requiredDocuments: Documentos CRÍTICOS para estratégia (não genéricos)
7. nextSteps: Ações NUMERADAS com responsável e prazo específico`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        area: { type: Type.STRING },
                        urgency: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] },
                        suggestedAction: { type: Type.STRING },
                        riskLevel: { type: Type.STRING, enum: ['Alto', 'Médio', 'Baixo'] },
                        estimatedComplexity: { type: Type.STRING, enum: ['Simples', 'Moderada', 'Complexa'] },
                        requiredDocuments: { type: Type.ARRAY, items: { type: Type.STRING } },
                        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        const rawText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!rawText) throw new Error('Empty response');

        const cleaned = rawText.replace(/^```json|```$/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('diagnoseIntake error:', e);
        console.error('GEMINI_API_KEY presente?', !!process.env.GEMINI_API_KEY);
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

// Tool 7: Gerador de Questionário Inteligente
export const generateIntakeQuestions = async (initialArea?: string): Promise<string[]> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate 5-7 specific intake questions for a Brazilian law firm to ask a new client about their legal issue${initialArea ? ` in the ${initialArea} practice area` : ''}.

Make questions practical, focused, and designed to gather critical information in order.
Return an array of question strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        const rawText = response.text || '';
        const cleaned = rawText.replace(/^```json|```$/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return parsed.questions || [];
    } catch (e) {
        console.error('generateIntakeQuestions error:', e);
        return ['Qual é o seu problema jurídico?', 'Quando começou?', 'Qual é a situação atual?'];
    }
};

// Tool 7: Estimativa de Valor do Caso
export const estimateCaseValue = async (caseArea: string, description: string): Promise<{
    estimatedRange: string;
    complexity: string;
    potentialOutcome: string;
    recommendedApproach: string;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Como especialista em AVALIAÇÃO ECONÔMICA DE CASOS para escritório de advocacia brasileiro, calcule o valor real do caso:

Área: ${caseArea}
Relato: ${description}

METODOLOGIA DE ANÁLISE:
1. BASE FACTUAL: Identifique valores específicos (salários, danos, períodos)
2. JURISPRUDÊNCIA STJ: Qual é a indenização média aprovada para casos similares?
3. AJUSTES: Considere sucumbência, honorários advocatícios (20-30%), custas
4. CENÁRIOS: Melhor caso (80% êxito) vs Pior caso (30% êxito)
5. RENTABILIDADE: Valor líquido ÷ horas estimadas deve ser > R$ 500/hora

Retorne JSON com:
1. estimatedRange: Intervalo realista em BRL com base em jurisprudência (ex: "R$ 15.000 - R$ 75.000" com justificativa)
2. complexity: Avaliação honesta de horas necessárias (Simples: <20h, Moderada: 20-60h, Complexa: >60h)
3. potentialOutcome: Taxa de sucesso estimada baseada em jurisprudência dominante e defesa previsível
4. recommendedApproach: Estratégia específica: extrajudicial, conciliação, ação simples, ação ordinária, etc`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        estimatedRange: { type: Type.STRING },
                        complexity: { type: Type.STRING },
                        potentialOutcome: { type: Type.STRING },
                        recommendedApproach: { type: Type.STRING }
                    }
                }
            }
        });

        const rawText = response.text || '';
        const cleaned = rawText.replace(/^```json|```$/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('estimateCaseValue error:', e);
        return {
            estimatedRange: 'Valor a ser definido após análise',
            complexity: 'Moderada',
            potentialOutcome: 'Análise necessária',
            recommendedApproach: 'Consulta presencial recomendada'
        };
    }
};

// Tool 7: Análise de Viabilidade
export const analyzeViability = async (caseArea: string, description: string): Promise<{
    viability: 'Alta' | 'Média' | 'Baixa';
    reasoning: string;
    risks: string[];
    opportunities: string[];
    recommendation: string;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `ANÁLISE CRÍTICA DE VIABILIDADE PROCESSUAL - Sistema de Triagem para Advocacia Brasileira

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

Retorne JSON:
1. viability: Alta (70%+ chance, jurisprudência favorável, prova robusta), Média (40-70%, alguns riscos), Baixa (<40%, defesa forte, prova fraca)
2. reasoning: Fundamente com STJ/STF específico e jurisprudência dominante NOMINALIZADA
3. risks: 3-4 riscos processuais ESPECÍFICOS e REALISTAS (prescrição, falta prova, defesa consolidada, etc)
4. opportunities: 2-3 diferenciais que aumentam viabilidade (jurisprudência newer, precedentes favoráveis, acordo viável)
5. recommendation: CLARA: Aceitar/Recusar com critério objetivo (aceitar se >60% chance OU valor alto OU precedentes novos)`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        viability: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] },
                        reasoning: { type: Type.STRING },
                        risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                        recommendation: { type: Type.STRING }
                    }
                }
            }
        });

        const rawText = response.text || '';
        const cleaned = rawText.replace(/^```json|```$/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('analyzeViability error:', e);
        return {
            viability: 'Média',
            reasoning: 'Análise requer consulta presencial',
            risks: ['Risco não avaliado'],
            opportunities: ['Potencial a ser explorado'],
            recommendation: 'Marcar consulta para avaliação'
        };
    }
};

// Tool 7: Calculators (AI Powered)
export const calculateLegalMath = async (category: string, type: string, inputs: any) => {
    const ai = getAI();
    const prompt = `Act as a Brazilian Forensic Accountant. Perform a legal calculation.
   Category: ${category}
   Type: ${type}
   Inputs: ${JSON.stringify(inputs)}
   
   Requirements:
   1. Use current Brazilian legislation (CLT, Civil Code, STJ Súmulas).
   2. Return a detailed JSON with the result.
   
   Output Schema:
   {
     "total": number,
     "summary": string,
     "details": [
       {"label": string, "value": string, "description": string} // Line items for the calculation memory
     ]
   }`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        total: { type: Type.NUMBER },
                        summary: { type: Type.STRING },
                        details: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    label: { type: Type.STRING },
                                    value: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error(e);
        return { total: 0, summary: "Erro no cálculo IA", details: [] };
    }
}

// ===== CRM PRO ENHANCEMENTS =====

// Análise avançada do perfil do cliente com score de confiabilidade
export const generateClientProfile = async (clientData: any): Promise<{
    trustScore: number;
    segment: 'Cliente Ideal' | 'Em Desenvolvimento' | 'Em Risco' | 'Dormindo' | 'VIP';
    tags: string[];
    insight: string;
}> => {
    const ai = getAI();
    const prompt = `You are a Senior Law Firm Business Analyst. Analyze this client profile and generate strategic insights:
  
  Name: ${clientData.name}
  Type: ${clientData.type}
  Profession: ${clientData.profession}
  Civil Status: ${clientData.civil_status}
  Notes: ${clientData.notes || 'N/A'}
  Current Risk Score: ${clientData.riskScore}
  
  Return a JSON with:
  1. trustScore (0-100): How reliable and valuable this client is
  2. segment: Best segment classification
  3. tags: 3-5 strategic tags for this client
  4. insight: One sentence business recommendation
  
  Be strategic and practical for law firm growth.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        trustScore: { type: Type.NUMBER },
                        segment: { type: Type.STRING, enum: ['Cliente Ideal', 'Em Desenvolvimento', 'Em Risco', 'Dormindo', 'VIP'] },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        insight: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"trustScore": 50, "segment": "Em Desenvolvimento", "tags": [], "insight": "Cliente potencial"}');
    } catch (e) {
        console.error('Client profile generation failed:', e);
        return { trustScore: 50, segment: 'Em Desenvolvimento', tags: ['Novo'], insight: 'Perfil incompleto' };
    }
};

// Recomendações inteligentes de próximos passos
export const generateNextAction = async (clientData: any, caseHistory: string[]): Promise<string> => {
    const ai = getAI();
    const prompt = `Act as a law firm CRM specialist. Given this client's data, what should be the NEXT ACTION to maximize engagement and revenue?
  
  Client: ${clientData.name}
  Risk Score: ${clientData.riskScore}
  Status: ${clientData.status}
  Cases: ${caseHistory.length > 0 ? caseHistory.join(', ') : 'None'}
  Segment: ${clientData.segment || 'Unknown'}
  
  Return ONE actionable, specific recommendation (max 2 sentences). Focus on client retention or conversion.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: prompt }]
        });
        return response.text?.trim() || 'Realizar follow-up com cliente';
    } catch (e) {
        return 'Realizar follow-up com cliente';
    }
};

// Chat conversacional sobre o cliente
export const chatWithClientAI = async (clientData: any, userMessage: string, conversationHistory: any[]): Promise<string> => {
    const ai = getAI();
    const historyText = conversationHistory
        .slice(-5) // Últimas 5 mensagens para context
        .map(m => `${m.role === 'user' ? 'Advogado' : 'IA'}: ${m.content}`)
        .join('\n');

    const prompt = `You are an AI advisor for a law firm. You're helping analyze and discuss this client:
  
  CLIENT PROFILE:
  Name: ${clientData.name}
  Type: ${clientData.type}
  Risk: ${clientData.riskScore}
  Segment: ${clientData.segment}
  
  PREVIOUS CONVERSATION:
  ${historyText || 'Nenhuma conversa anterior'}
  
  Lawyer asks: "${userMessage}"
  
  Respond in Portuguese (Brazil). Be concise, strategic, and focused on business value. Answer in 1-2 sentences.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: prompt }]
        });
        return response.text?.trim() || 'Não consegui processar sua pergunta.';
    } catch (e) {
        return 'Erro ao processar solicitação.';
    }
};

// Gerar tags automáticas baseadas em IA
export const generateClientTags = async (clientData: any): Promise<string[]> => {
    const ai = getAI();
    const prompt = `Generate 5 strategic tags for this legal client that would help with CRM segmentation:
  
  Name: ${clientData.name}
  Type: ${clientData.type}
  Profession: ${clientData.profession}
  Notes: ${clientData.notes || 'N/A'}
  
  Return ONLY a JSON array of 5 tag strings. Example: ["High-Value", "Repeat Client", "Complex Cases"]`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text || '[]').slice(0, 5);
    } catch (e) {
        return ['Cliente', 'Novo'];
    }
};

// Gerar relatório executivo em texto
export const generateClientReport = async (clientData: any, caseHistory: string[]): Promise<string> => {
    const ai = getAI();
    const prompt = `Generate a SHORT executive report (5-7 sentences) about this client for the lawyer:
   
   CLIENT: ${clientData.name}
   TYPE: ${clientData.type}
   RISK: ${clientData.riskScore}
   SEGMENT: ${clientData.segment}
   TRUST SCORE: ${clientData.trustScore || 'N/A'}
   CASES: ${caseHistory.length || 0}
   
   Format: Professional Portuguese (Brazil) summary highlighting:
   1. Client value and potential
   2. Key risks or opportunities
   3. Recommended actions
   
   Make it concise and actionable for a busy lawyer.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: prompt }]
        });
        return response.text?.trim() || 'Não foi possível gerar relatório.';
    } catch (e) {
        return 'Erro ao gerar relatório.';
    }
};

// ===== SMARTDOCS PROFESSIONAL ENHANCEMENTS =====

// 1. Análise completa e profunda do documento
export const analyzeDocumentAI = async (fileName: string, content: string): Promise<{
    type: string;
    summary: string;
    risks: { type: string; severity: 'Alta' | 'Média' | 'Baixa'; description: string }[];
    importantDates: { label: string; date: string }[];
    values: { label: string; amount: string }[];
    tags: string[];
    riskScore: number;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze this legal document professionally and return structured data in JSON format.

DOCUMENT NAME: ${fileName}
CONTENT (first 2000 chars): ${content.substring(0, 2000)}...

Return JSON with:
1. type: (Peticao|Contrato|Sentenca|Procuracao|Parecer|Minuta|Outros)
2. summary: 3-5 sentence executive summary in Portuguese (Brazil)
3. risks: Array of potential legal risks with severity levels
4. importantDates: Array of critical dates (vencimento, prazo, validade, etc)
5. values: Array of monetary values mentioned (honorários, multa, indenização)
6. tags: 5-7 strategic tags for CRM categorization
7. riskScore: 0-100 (0=safe, 100=high risk) - analyze contract clauses and missing protections

Be thorough and professional. Focus on what matters to a law firm.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        risks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    severity: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] },
                                    description: { type: Type.STRING }
                                }
                            }
                        },
                        importantDates: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    label: { type: Type.STRING },
                                    date: { type: Type.STRING }
                                }
                            }
                        },
                        values: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    label: { type: Type.STRING },
                                    amount: { type: Type.STRING }
                                }
                            }
                        },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        riskScore: { type: Type.NUMBER }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"type":"Outros","summary":"","risks":[],"importantDates":[],"values":[],"tags":[],"riskScore":50}');
    } catch (e) {
        console.error('Document analysis failed:', e);
        return { type: 'Outros', summary: 'Análise indisponível', risks: [], importantDates: [], values: [], tags: ['Erro-Análise'], riskScore: 50 };
    }
};

// 2. Chat inteligente com documento
export const chatWithDocument = async (documentContent: string, documentName: string, userQuestion: string): Promise<{
    answer: string;
    relevantSection?: string;
    confidence: number;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an expert legal document analyst. A lawyer is asking a question about a legal document.

DOCUMENT: ${documentName}
CONTENT (first 3000 chars): ${documentContent.substring(0, 3000)}...

LAWYER'S QUESTION: "${userQuestion}"

Respond in Portuguese (Brazil). 
1. Answer the question based ONLY on the document content
2. Be specific and cite relevant sections
3. If information is not in document, say so clearly
4. Keep answer concise (2-3 sentences max)

Return JSON with:
- answer: Your response to the lawyer
- relevantSection: The quote from document that answers the question (or null)
- confidence: 0-100 score on how well you could answer from the document`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        answer: { type: Type.STRING },
                        relevantSection: { type: Type.STRING },
                        confidence: { type: Type.NUMBER }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"answer":"Não consegui responder","relevantSection":null,"confidence":0}');
    } catch (e) {
        return { answer: 'Erro ao processar pergunta sobre o documento.', relevantSection: undefined, confidence: 0 };
    }
};

// 3. Comparação inteligente entre documentos
export const compareDocuments = async (doc1Name: string, doc1Content: string, doc2Name: string, doc2Content: string): Promise<{
    similarities: string[];
    differences: { field: string; doc1Value: string; doc2Value: string; severity: 'Alta' | 'Média' | 'Baixa' }[];
    riskFlags: { flag: string; severity: 'Alta' | 'Média' | 'Baixa' }[];
    recommendation: string;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Compare two legal documents professionally. 

DOCUMENT 1 (${doc1Name}):
${doc1Content.substring(0, 1500)}...

DOCUMENT 2 (${doc2Name}):
${doc2Content.substring(0, 1500)}...

Analyze and return JSON with:
1. similarities: Key points that are the same
2. differences: Important differences (values, dates, clauses) with severity
3. riskFlags: Any concerning discrepancies or missing protections
4. recommendation: One-line recommendation for the lawyer (Portuguese Brazil)

Focus on legal/financial implications, not formatting.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        similarities: { type: Type.ARRAY, items: { type: Type.STRING } },
                        differences: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    field: { type: Type.STRING },
                                    doc1Value: { type: Type.STRING },
                                    doc2Value: { type: Type.STRING },
                                    severity: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] }
                                }
                            }
                        },
                        riskFlags: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    flag: { type: Type.STRING },
                                    severity: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] }
                                }
                            }
                        },
                        recommendation: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"similarities":[],"differences":[],"riskFlags":[],"recommendation":"Revisar diferenças antes de assinar"}');
    } catch (e) {
        return { similarities: [], differences: [], riskFlags: [], recommendation: 'Erro na comparação' };
    }
};

// 4. Busca semântica em documentos
export const semanticSearch = async (query: string, documents: Array<{ name: string; content: string }>): Promise<{
    results: Array<{ docName: string; relevance: number; relevantExcerpt: string }>;
}> => {
    const ai = getAI();
    try {
        const docSummaries = documents.map(d => `[${d.name}]: ${d.content.substring(0, 500)}...`).join('\n\n');

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Search for relevant documents matching a legal query.

QUERY: "${query}"

DOCUMENTS:
${docSummaries}

Return JSON with:
- results: Array of matching documents sorted by relevance (0-100)
- For each: docName, relevance score, and a 1-sentence excerpt explaining why it matches

Focus on semantic meaning, not just keyword matching.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        results: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    docName: { type: Type.STRING },
                                    relevance: { type: Type.NUMBER },
                                    relevantExcerpt: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"results":[]}');
    } catch (e) {
        return { results: [] };
    }
};

// 5. Geração de checklist de conformidade
export const generateComplianceChecklist = async (documentContent: string, documentType: string): Promise<{
    checks: Array<{ item: string; status: 'Presente' | 'Ausente' | 'Verificar'; severity: 'Alta' | 'Média' | 'Baixa'; suggestion?: string }>;
    overallCompliance: number;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Verify compliance checklist for a legal document.

DOCUMENT TYPE: ${documentType}
CONTENT (first 2000 chars): ${documentContent.substring(0, 2000)}...

Check for presence of essential elements for this document type in Brazilian law.

Return JSON with:
- checks: Array of compliance items specific to document type
  - item: Description of what to check (Portuguese)
  - status: Whether it's present/absent/needs verification
  - severity: How critical this item is
  - suggestion: How to fix if missing
- overallCompliance: 0-100 score

For a ${documentType}, ensure you check:
- Required signatures and witnesses
- Legal compliance with current legislation
- Essential clauses for this document type
- Risk mitigation elements`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        checks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    item: { type: Type.STRING },
                                    status: { type: Type.STRING, enum: ['Presente', 'Ausente', 'Verificar'] },
                                    severity: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] },
                                    suggestion: { type: Type.STRING }
                                }
                            }
                        },
                        overallCompliance: { type: Type.NUMBER }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"checks":[],"overallCompliance":50}');
    } catch (e) {
        return { checks: [], overallCompliance: 0 };
    }
};

// 6. Extração estruturada de dados
export const extractDocumentData = async (documentContent: string, documentType: string): Promise<{
    parties: string[];
    amounts: { description: string; value: string }[];
    dates: { description: string; date: string }[];
    criticalClauses: { clause: string; risk: 'Alta' | 'Média' | 'Baixa' }[];
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Extract structured data from a legal document.

DOCUMENT TYPE: ${documentType}
CONTENT (first 2500 chars): ${documentContent.substring(0, 2500)}...

Extract and return JSON with:
- parties: Array of all legal entities/persons involved
- amounts: Any monetary values with descriptions
- dates: Important dates with their purposes
- criticalClauses: Key legal clauses with risk assessment

Be precise. Extract actual values, not templates.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        parties: { type: Type.ARRAY, items: { type: Type.STRING } },
                        amounts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    value: { type: Type.STRING }
                                }
                            }
                        },
                        dates: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    date: { type: Type.STRING }
                                }
                            }
                        },
                        criticalClauses: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    clause: { type: Type.STRING },
                                    risk: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"parties":[],"amounts":[],"dates":[],"criticalClauses":[]}');
    } catch (e) {
        return { parties: [], amounts: [], dates: [], criticalClauses: [] };
    }
};

// ===== AGENDA PRO ENHANCEMENTS =====

// Tool 6: Smart Agenda - Sugestão de Prazos
export const suggestDeadlines = async (eventTitle: string, eventDescription: string, eventType: 'Judicial' | 'Administrativo' | 'Interno' | 'Diligencia' | 'Extra Judicial'): Promise<{
    suggestedDate: string;
    reasoning: string;
    preparationDays: number;
    relatedDeadlines: string[];
}> => {
    const ai = getAI();

    // Default date: 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const defaultISODate = defaultDate.toISOString();

    try {
        console.log('suggestDeadlines called with:', { eventTitle, eventType });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are a Brazilian legal expert. Based on the following event, suggest optimal deadline and prepare timeline:

Event Title: ${eventTitle}
Type: ${eventType}
Description: ${eventDescription || 'Not provided'}

Return ONLY a valid JSON object with:
1. suggestedDate: ISO date string (YYYY-MM-DD) for optimal scheduling considering Brazilian working days and court calendars
2. reasoning: Explain why this date is optimal (1-2 sentences)
3. preparationDays: Number of days before event to start preparation (1-30)
4. relatedDeadlines: Array of 2-3 related Brazilian legal deadlines (e.g., "Contestação: 15 dias", "Agravo: 10 dias")`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedDate: { type: Type.STRING },
                        reasoning: { type: Type.STRING },
                        preparationDays: { type: Type.NUMBER },
                        relatedDeadlines: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["suggestedDate", "reasoning", "preparationDays", "relatedDeadlines"]
                }
            }
        });

        const rawText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Gemini response:', rawText);

        if (!rawText) throw new Error('Empty response from Gemini');

        const cleaned = rawText.replace(/^```json|```$/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // Ensure suggestedDate is valid ISO format
        if (!parsed.suggestedDate || parsed.suggestedDate === '') {
            parsed.suggestedDate = defaultISODate;
        }

        // Validate date
        const dateObj = new Date(parsed.suggestedDate);
        if (isNaN(dateObj.getTime())) {
            parsed.suggestedDate = defaultISODate;
        }

        // Ensure preparationDays is a number
        if (typeof parsed.preparationDays !== 'number') {
            parsed.preparationDays = 7;
        }

        // Ensure relatedDeadlines is an array
        if (!Array.isArray(parsed.relatedDeadlines)) {
            parsed.relatedDeadlines = [];
        }

        console.log('Parsed suggestion:', parsed);
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

// Tool 6: Smart Agenda - Gerador de Checklist de Preparação
export const generatePreparationChecklist = async (eventTitle: string, eventType: string, caseArea: string): Promise<{
    checklist: Array<{ task: string; daysBeforeEvent: number; priority: 'Alta' | 'Média' | 'Baixa' }>;
    estimatedPrepTime: number;
    criticalTasks: string[];
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a detailed preparation checklist for a legal event in Brazil.

Event: ${eventTitle}
Type: ${eventType}
Legal Area: ${caseArea}

Return JSON with:
1. checklist: Array of preparation tasks with daysBeforeEvent and priority
2. estimatedPrepTime: Total hours needed to prepare
3. criticalTasks: Most important tasks that could impact the outcome`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        checklist: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    task: { type: Type.STRING },
                                    daysBeforeEvent: { type: Type.NUMBER },
                                    priority: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] }
                                }
                            }
                        },
                        estimatedPrepTime: { type: Type.NUMBER },
                        criticalTasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"checklist":[],"estimatedPrepTime":0,"criticalTasks":[]}');
    } catch (e) {
        console.error('generatePreparationChecklist error:', e);
        return { checklist: [], estimatedPrepTime: 0, criticalTasks: [] };
    }
};

// Tool 6: Smart Agenda - Detecção de Conflitos & Otimização
export const analyzeAgendaConflicts = async (upcomingEvents: Array<{ title: string, date: string, type: string }>): Promise<{
    conflicts: Array<{ event1: string; event2: string; riskLevel: 'Alta' | 'Média' | 'Baixa'; suggestion: string }>;
    overloadedDays: string[];
    recommendedReschedules: Array<{ event: string; suggestedNewDate: string; reason: string }>;
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze this lawyer's upcoming agenda for conflicts and inefficiencies:

Events: ${JSON.stringify(upcomingEvents)}

Return JSON with:
1. conflicts: Schedule conflicts or overlaps
2. overloadedDays: Days with too many high-priority events
3. recommendedReschedules: Events that should be moved for optimization`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        conflicts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    event1: { type: Type.STRING },
                                    event2: { type: Type.STRING },
                                    riskLevel: { type: Type.STRING, enum: ['Alta', 'Média', 'Baixa'] },
                                    suggestion: { type: Type.STRING }
                                }
                            }
                        },
                        overloadedDays: { type: Type.ARRAY, items: { type: Type.STRING } },
                        recommendedReschedules: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    event: { type: Type.STRING },
                                    suggestedNewDate: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"conflicts":[],"overloadedDays":[],"recommendedReschedules":[]}');
    } catch (e) {
        console.error('analyzeAgendaConflicts error:', e);
        return { conflicts: [], overloadedDays: [], recommendedReschedules: [] };
    }
};

// Tool 6: Smart Agenda - Resumo Inteligente por Período
export const generateAgendaSummary = async (events: Array<{ title: string, date: string, type: string, urgency: string }>, period: 'semanal' | 'mensal'): Promise<{
    summary: string;
    keyEvents: string[];
    workloadAnalysis: string;
    recommendations: string[];
}> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Gere um resumo estratégico de agenda para um advogado.

Período: ${period === 'semanal' ? 'Semanal' : 'Mensal'}
Compromissos: ${JSON.stringify(events)}

Retorne JSON com:
1. summary: Visão geral executiva do período
2. keyEvents: Eventos mais importantes
3. workloadAnalysis: Avaliação da carga de trabalho e estresse
4. recommendations: Como otimizar a agenda`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        keyEvents: { type: Type.ARRAY, items: { type: Type.STRING } },
                        workloadAnalysis: { type: Type.STRING },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"summary":"","keyEvents":[],"workloadAnalysis":"","recommendations":[]}');
    } catch (e) {
        console.error('generateAgendaSummary error:', e);
        return { summary: "", keyEvents: [], workloadAnalysis: "", recommendations: [] };
    }
};