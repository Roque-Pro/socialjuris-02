/**
 * OpenAI Backend Service
 * Chama endpoints do backend (seguro) em vez de chamar OpenAI direto no frontend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const analyzeCaseDescription = async (
    description: string
): Promise<{
    area: string;
    title: string;
    summary: string;
    complexity: "Baixa" | "Média" | "Alta";
}> => {
    try {
        const response = await fetch(`${API_BASE}/api/ai/analyze-case`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error);
        }

        return data.result;
    } catch (error) {
        console.error("OpenAI Backend Error:", error);
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

export const autoTagDocument = async (fileName: string): Promise<{ type: string; tags: string[] }> => {
    // Fallback simples para não quebrar
    return { type: "Outros", tags: ["Documento"] };
};

export const searchJurisprudence = async (query: string) => {
    // Fallback simples
    return [];
};

export const generateLegalDraft = async (config: { type: string; clientName: string; facts: string; tone: string }) => {
    try {
        const response = await fetch(`${API_BASE}/api/ai/generate-draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error);
        }

        return data.draft;
    } catch (error) {
        console.error("OpenAI Backend Error:", error);
        throw error;
    }
};

export const analyzeCase = async (clientName: string, caseType: string, facts: string): Promise<{
    context: string;
    relevantClauses: string[];
    criticalPoints: string[];
    riskFactors: string[];
    suggestedApproach: string;
}> => {
    // Fallback
    return { context: '', relevantClauses: [], criticalPoints: [], riskFactors: [], suggestedApproach: '' };
};

export const generateDraftVariations = async (config: { type: string; clientName: string; facts: string }): Promise<{
    aggressive: string;
    conciliatory: string;
    technical: string;
    balanced: string;
}> => {
    // Fallback
    return { aggressive: '', conciliatory: '', technical: '', balanced: '' };
};

export const chatWithClientAI = async (clientData: any, userMessage: string, conversationHistory: any[]): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/api/ai/chat-client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientData, userMessage, conversationHistory })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error);
        }

        return data.message;
    } catch (error) {
        console.error("OpenAI Backend Chat Error:", error);
        throw error;
    }
};

export const chatWithDocumentAI = async (documentContent: string, userQuestion: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userMessage: `Document:\n${documentContent}\n\nQuestion: ${userQuestion}`,
                context: 'You are analyzing a legal document. Answer based on the document content only.'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error);
        }

        return data.message;
    } catch (error) {
        console.error("OpenAI Backend Error:", error);
        throw error;
    }
};

export const analyzeContractRisks = async (contractText: string): Promise<{
    parties: Array<{ name: string; role: string }>;
    amounts: Array<{ description: string; value: number; date: string }>;
    dates: Array<{ description: string; date: string }>;
    criticalClauses: Array<{ clause: string; risk: "Alta" | "Média" | "Baixa" }>;
}> => {
    // Fallback
    return { parties: [], amounts: [], dates: [], criticalClauses: [] };
};

export const suggestDeadlines = async (
    eventTitle: string,
    eventDescription: string,
    eventType: 'Judicial' | 'Administrativo' | 'Interno' | 'Diligencia' | 'Extra Judicial'
): Promise<{
    suggestedDate: string;
    reasoning: string;
    preparationDays: number;
    relatedDeadlines: string[];
}> => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const defaultISODate = defaultDate.toISOString().split('T')[0];

    return {
        suggestedDate: defaultISODate,
        reasoning: "Sugestão padrão: 7 dias a partir de hoje. Consulte o calendário judiciário para ajustar.",
        preparationDays: 7,
        relatedDeadlines: ["Prazo padrão", "Verifique tribunal"]
    };
};

export const generatePreparationChecklist = async (eventTitle: string, eventType: string, caseArea: string): Promise<{
    checklist: Array<{ task: string; daysBeforeEvent: number; priority: 'Alta' | 'Média' | 'Baixa' }>;
    estimatedPrepTime: number;
    criticalTasks: string[];
}> => {
    return { checklist: [], estimatedPrepTime: 0, criticalTasks: [] };
};

export const analyzeAgendaConflicts = async (upcomingEvents: Array<{ title: string, date: string, type: string }>): Promise<{
    conflicts: Array<{ event1: string; event2: string; riskLevel: 'Alta' | 'Média' | 'Baixa'; suggestion: string }>;
    overloadedDays: string[];
    recommendedReschedules: Array<{ event: string; suggestedNewDate: string; reason: string }>;
}> => {
    return { conflicts: [], overloadedDays: [], recommendedReschedules: [] };
};

export const generateAgendaSummary = async (
    events: Array<{ title: string, date: string, type: string, urgency: string }>,
    period: 'semanal' | 'mensal'
): Promise<{
    summary: string;
    keyEvents: string[];
    workloadAnalysis: string;
    recommendations: string[];
}> => {
    return { summary: '', keyEvents: [], workloadAnalysis: '', recommendations: [] };
};

export const generateWelcomeMessage = async (userName: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userMessage: `Write a short, friendly Portuguese welcome message for a user named ${userName}. Keep it concise (1-2 sentences). Respond only with the message text, no quotes.`
            })
        });

        if (!response.ok) {
            return `Olá, ${userName}!`;
        }

        const data = await response.json();
        return data.success ? data.message : `Olá, ${userName}!`;
    } catch (error) {
        console.error('Welcome message generation failed:', error);
        return `Olá, ${userName}!`;
    }
};

export const analyzeCRMRisk = async (profileName: string, type: string): Promise<{
    riskScore: "Baixo" | "Médio" | "Alto";
    conversionProbability: number;
}> => {
    return { riskScore: "Médio", conversionProbability: 50 };
};

export const diagnoseIntake = async (answers: string): Promise<{
    area: string;
    description: string;
    confidence: number;
    followUpQuestions: string[];
}> => {
    return { area: '', description: '', confidence: 0, followUpQuestions: [] };
};
