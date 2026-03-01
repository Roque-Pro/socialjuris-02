/**
 * OpenAI Backend Proxy
 * 
 * Este serviço redireciona todas as chamadas OpenAI para o backend
 * evitando problemas de CORS e mantendo a chave de API segura no servidor.
 * 
 * Uso: Importe este arquivo ao invés de openaiService.ts direto
 */

// Detecta base URL com fallback inteligente
const API_BASE_URL = (() => {
  const env = import.meta.env.VITE_API_URL;
  if (env) return env;
  
  // Fallback: se estiver em localhost:5173, usa localhost:10000
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:10000';
  }
  
  // Fallback: tenta usar a mesma origem do frontend
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol; // http: ou https:
    const hostname = window.location.hostname;
    const port = ':10000'; // Assume porta 10000 para API
    return `${protocol}//${hostname}${port}`;
  }
  
  return 'http://localhost:10000';
})();

console.log('🔌 Backend Proxy inicializado. API Base URL:', API_BASE_URL);

export const analyzeCaseDescription = async (description: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (analyzeCaseDescription):', error);
    throw error;
  }
};

export const generateLegalDraft = async (config: { type: string; clientName: string; facts: string; tone: string }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.draft;
  } catch (error) {
    console.error('❌ Backend Proxy Error (generateLegalDraft):', error);
    throw error;
  }
};

export const chatWithClientAI = async (clientData: any, userMessage: string, conversationHistory: any[] = []) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat-client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientData, userMessage, conversationHistory })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.message;
  } catch (error) {
    console.error('❌ Backend Proxy Error (chatWithClientAI):', error);
    throw error;
  }
};

export const chatGeneric = async (userMessage: string, context?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage, context })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.message;
  } catch (error) {
    console.error('❌ Backend Proxy Error (chatGeneric):', error);
    throw error;
  }
};

// FALLBACK: Funções que não estão no backend ainda
// Estas ainda usam Gemini como fallback
import * as geminiService from './geminiService';

export const calculateCasePrice = (complexity: string) => {
  return geminiService.calculateCasePrice(complexity);
};

export const autoTagDocument = async (fileName: string) => {
  return geminiService.autoTagDocument(fileName);
};

export const searchJurisprudence = async (query: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/search-jurisprudence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (searchJurisprudence):', error);
    // Fallback to Gemini
    return geminiService.searchJurisprudence(query);
  }
};

export const analyzeCase = async (clientName: string, caseType: string, facts: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-case-deep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, caseType, facts })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (analyzeCase):', error);
    // Fallback to Gemini
    return geminiService.analyzeCase(clientName, caseType, facts);
  }
};

export const generateDraftVariations = async (config: { type: string; clientName: string; facts: string }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-draft-variations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (generateDraftVariations):', error);
    // Fallback to Gemini
    return geminiService.generateDraftVariations(config);
  }
};

export const chatWithDocumentAI = async (documentContent: string, userQuestion: string) => {
  return geminiService.chatWithDocumentAI(documentContent, userQuestion);
};

export const analyzeContractRisks = async (contractText: string) => {
  return geminiService.analyzeContractRisks(contractText);
};

export const suggestDeadlines = async (
    eventTitle: string,
    eventDescription: string,
    eventType: 'Judicial' | 'Administrativo' | 'Interno' | 'Diligencia' | 'Extra Judicial'
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/suggest-deadlines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTitle, eventDescription, eventType })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (suggestDeadlines):', error);
    return geminiService.suggestDeadlines(eventTitle, eventDescription, eventType);
  }
};

export const generatePreparationChecklist = async (eventTitle: string, eventType: string, caseArea: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-preparation-checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTitle, eventType, caseArea })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (generatePreparationChecklist):', error);
    return geminiService.generatePreparationChecklist(eventTitle, eventType, caseArea);
  }
};

export const analyzeAgendaConflicts = async (upcomingEvents: Array<{ title: string, date: string, type: string }>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-agenda-conflicts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upcomingEvents })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (analyzeAgendaConflicts):', error);
    return geminiService.analyzeAgendaConflicts(upcomingEvents);
  }
};

export const generateAgendaSummary = async (
    events: Array<{ title: string, date: string, type: string, urgency: string }>,
    period: 'semanal' | 'mensal'
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-agenda-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events, period })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (generateAgendaSummary):', error);
    return geminiService.generateAgendaSummary(events, period);
  }
};

export const generateWelcomeMessage = async (userName: string) => {
  return geminiService.generateWelcomeMessage(userName);
};

export const analyzeCRMRisk = async (profileName: string, type: string) => {
  return geminiService.analyzeCRMRisk(profileName, type);
};

export const diagnoseIntake = async (answers: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/diagnose-intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (diagnoseIntake):', error);
    // Fallback to Gemini
    return geminiService.diagnoseIntake(answers);
  }
};

export const analyzeViability = async (caseArea: string, description: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-viability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseArea, description })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (analyzeViability):', error);
    // Fallback to Gemini
    return geminiService.analyzeViability(caseArea, description);
  }
};

export const calculateLegalMath = async (category: string, type: string, inputs: any) => {
  return geminiService.calculateLegalMath(category, type, inputs);
};

export const generateClientProfile = async (clientData: any) => {
  return geminiService.generateClientProfile(clientData);
};

export const generateNextAction = async (clientData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-next-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientData })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (generateNextAction):', error);
    // Fallback to Gemini
    return geminiService.generateNextAction(clientData);
  }
};

export const generateClientTags = async (clientData: any) => {
  return geminiService.generateClientTags(clientData);
};

export const generateClientReport = async (clientData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-client-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientData })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (generateClientReport):', error);
    // Fallback to Gemini
    return geminiService.generateClientReport(clientData);
  }
};

export const generateIntakeQuestions = async (legalArea: string) => {
  return geminiService.generateIntakeQuestions(legalArea);
};

export const estimateCaseValue = async (caseArea: string, description: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/estimate-case-value`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseArea, description })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.result;
  } catch (error) {
    console.error('❌ Backend Proxy Error (estimateCaseValue):', error);
    // Fallback to Gemini
    return geminiService.estimateCaseValue(caseArea, description);
  }
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
