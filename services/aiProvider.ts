/**
 * AI Provider Factory
 * Permite trocar entre Gemini e OpenAI sem alterar o código da aplicação
 * 
 * IMPORTANTE: OpenAI agora é chamado via Backend Proxy (sem CORS issues)
 */

import * as geminiService from './geminiService';
import * as openaiBackendProxy from './openaiBackendProxy';

// Tipo de provider
export type AIProvider = 'gemini' | 'openai';

// Detecta qual provider usar (pode ser controlado por env var ou UI)
const getActiveProvider = (): AIProvider => {
    const envProvider = import.meta.env.VITE_AI_PROVIDER as AIProvider;
    
    // Se houver variável de env explícita, usar essa
    if (envProvider && ['gemini', 'openai'].includes(envProvider)) {
        return envProvider;
    }
    
    // Fallback: Se houver endpoint de backend disponível, usar OpenAI via proxy
    const hasBackend = !!import.meta.env.VITE_API_URL;
    if (hasBackend) return 'openai';
    
    // Fallback: tentar Gemini
    const hasGemini = !!import.meta.env.VITE_GEMINI_API_KEY;
    if (hasGemini) return 'gemini';
    
    // Default
    return 'gemini';
};

// Seleciona o serviço ativo
const getService = () => {
    const provider = getActiveProvider();
    console.log(`🤖 Using AI Provider: ${provider.toUpperCase()}`);
    
    if (provider === 'openai') {
        return openaiBackendProxy;
    }
    return geminiService;
};

// === PROXY FUNCTIONS - Delegam para o provider ativo ===

export const analyzeCaseDescription = async (description: string) => {
    return getService().analyzeCaseDescription(description);
};

export const calculateCasePrice = (complexity: string) => {
    return getService().calculateCasePrice(complexity);
};

export const autoTagDocument = async (fileName: string) => {
    return getService().autoTagDocument(fileName);
};

export const searchJurisprudence = async (query: string) => {
    return getService().searchJurisprudence(query);
};

export const generateLegalDraft = async (config: { type: string; clientName: string; facts: string; tone: string }) => {
    return getService().generateLegalDraft(config);
};

export const analyzeCase = async (clientName: string, caseType: string, facts: string) => {
    return getService().analyzeCase(clientName, caseType, facts);
};

export const generateDraftVariations = async (config: { type: string; clientName: string; facts: string }) => {
    return getService().generateDraftVariations(config);
};

export const chatWithClientAI = async (clientData: any, userMessage: string, conversationHistory: any[] = []) => {
    return getService().chatWithClientAI(clientData, userMessage, conversationHistory);
};

export const chatWithDocumentAI = async (documentContent: string, userQuestion: string) => {
    return getService().chatWithDocumentAI(documentContent, userQuestion);
};

export const analyzeContractRisks = async (contractText: string) => {
    return getService().analyzeContractRisks(contractText);
};

export const suggestDeadlines = async (
    eventTitle: string,
    eventDescription: string,
    eventType: 'Judicial' | 'Administrativo' | 'Interno' | 'Diligencia' | 'Extra Judicial'
) => {
    return getService().suggestDeadlines(eventTitle, eventDescription, eventType);
};

export const generatePreparationChecklist = async (eventTitle: string, eventType: string, caseArea: string) => {
    return getService().generatePreparationChecklist(eventTitle, eventType, caseArea);
};

export const analyzeAgendaConflicts = async (upcomingEvents: Array<{ title: string, date: string, type: string }>) => {
    return getService().analyzeAgendaConflicts(upcomingEvents);
};

export const generateAgendaSummary = async (
    events: Array<{ title: string, date: string, type: string, urgency: string }>,
    period: 'semanal' | 'mensal'
) => {
    return getService().generateAgendaSummary(events, period);
};

export const generateWelcomeMessage = async (userName: string) => {
    return getService().generateWelcomeMessage(userName);
};

export const analyzeCRMRisk = async (profileName: string, type: string) => {
    return getService().analyzeCRMRisk(profileName, type);
};

export const diagnoseIntake = async (answers: string) => {
    return getService().diagnoseIntake(answers);
};

// === FUNÇÕES ADICIONAIS (Fallback para Gemini por enquanto) ===

export const analyzeViability = async (caseArea: string, description: string) => {
    return getService().analyzeViability(caseArea, description);
};

export const calculateLegalMath = async (category: string, type: string, inputs: any) => {
    return geminiService.calculateLegalMath(category, type, inputs);
};

export const generateClientProfile = async (clientData: any) => {
    return geminiService.generateClientProfile(clientData);
};

export const generateNextAction = async (clientData: any) => {
    return getService().generateNextAction(clientData);
};

export const generateClientTags = async (clientData: any) => {
    return getService().generateClientTags(clientData);
};

export const generateClientReport = async (clientData: any) => {
    return getService().generateClientReport(clientData);
};

export const generateIntakeQuestions = async (legalArea: string) => {
    return geminiService.generateIntakeQuestions(legalArea);
};

export const estimateCaseValue = async (caseArea: string, description: string) => {
    return getService().estimateCaseValue(caseArea, description);
};

export const analyzeDocumentAI = async (document: any) => {
    return geminiService.analyzeDocumentAI(document);
};

export const chatWithDocument = async (documentContent: string, userMessage: string) => {
    return geminiService.chatWithDocument(documentContent, userMessage);
};

export const compareDocuments = async (doc1: string, doc2: string) => {
    return geminiService.compareDocuments(doc1, doc2);
};

export const semanticSearch = async (documents: any[], query: string) => {
    return geminiService.semanticSearch(documents, query);
};

export const generateComplianceChecklist = async (documentType: string) => {
    return geminiService.generateComplianceChecklist(documentType);
};

export const extractDocumentData = async (documentContent: string) => {
    return geminiService.extractDocumentData(documentContent);
};

export const findRelatedJurisprudence = async (draftContent: string) => {
    return geminiService.findRelatedJurisprudence(draftContent);
};

export const analyzeDraftStrength = async (draftContent: string, caseContext: string) => {
    return geminiService.analyzeDraftStrength(draftContent, caseContext);
};

export const suggestImprovements = async (draftContent: string, draftType: string) => {
    return geminiService.suggestImprovements(draftContent, draftType);
};

export const compareDrafts = async (draft1: string, draft2: string) => {
    return geminiService.compareDrafts(draft1, draft2);
};

export const checkCompliance = async (draftContent: string, legalArea: string) => {
    return geminiService.checkCompliance(draftContent, legalArea);
};

// Funções auxiliares
export const getCurrentProvider = (): AIProvider => getActiveProvider();

export const getProviderStatus = () => {
    const provider = getActiveProvider();
    return {
        provider,
        hasOpenAI: !!import.meta.env.VITE_OPENAI_API_KEY,
        hasGemini: !!import.meta.env.VITE_GEMINI_API_KEY,
        activeKey: provider === 'openai' ? 
            import.meta.env.VITE_OPENAI_API_KEY ? '✓' : '✗' :
            import.meta.env.VITE_GEMINI_API_KEY ? '✓' : '✗'
    };
};
