
export enum UserRole {
  CLIENT = 'CLIENT',
  LAWYER = 'LAWYER',
  ADMIN = 'ADMIN'
}

export enum CaseStatus {
  OPEN = 'OPEN',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  verified?: boolean;
  isPremium?: boolean;
  oab?: string;
  specialties?: string[];
  phone?: string;
  bio?: string;
  balance?: number;
  createdAt: string;
  fromFacebookGroup?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
}

export interface Case {
   id: string;
   clientId: string;
   lawyerId?: string;
   title: string;
   description: string;
   area: string;
   status: CaseStatus;
   city?: string;
   uf?: string;
   createdAt: string;
   messages: Message[];
   price?: number;
   complexity?: 'Baixa' | 'Média' | 'Alta';
   isPaid?: boolean;
   feedback?: {
     rating: number;
     comment: string;
   };
   interestedLawyers?: User[]; // Lista de advogados que manifestaram interesse
   lawyerRating?: number; // Avaliação do advogado (1-5 estrelas)
   lawyerRatedAt?: string; // Quando o advogado avaliou
   clientRating?: number; // Avaliação do cliente (1-5 estrelas)
   clientRatedAt?: string; // Quando o cliente avaliou
   ratingDeadlineAt?: string; // Data limite para avaliar (3 dias após aceitar o caso)
   images?: any[]; // Array de imagens em base64
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  type: 'info' | 'success' | 'warning';
}

export interface DashboardStats {
  activeCases: number;
  completedCases: number;
  totalRevenue?: number; 
  pendingVerifications?: number; 
}

// --- PRO TOOLS INTERFACES ---

// Tool 1: Smart Docs
export interface SmartDoc {
  id: string;
  lawyerId: string;
  clientId?: string; // Link opcional com CRM
  clientName?: string; // Helper para UI
  name: string;
  type: 'Peticao' | 'Contrato' | 'Sentenca' | 'Procuracao' | 'Outros';
  tags: string[];
  version: number;
  date: string;
  size: string;
  url?: string;
}

// Tool 2: Jurisprudence
export interface JurisprudenceResult {
  id?: string;
  tribunal: string;
  numero_processo: string;
  resumo: string;
  resultado: 'Favorável' | 'Desfavorável' | 'Parcial';
  relevancia: number; // 0-100
  ano?: string;
  court?: string; // fallback para compatibilidade
  summary?: string; // fallback
  outcome?: string; // fallback
  relevance?: number; // fallback
  date?: string; // fallback
}

// Tool 3: Draft Creator
export interface DraftConfig {
  type: string;
  clientName: string;
  opposingParty: string;
  facts: string;
  tone: 'Formal' | 'Agressivo' | 'Conciliador' | 'Técnico';
}

// Tool 4: Smart Agenda
export interface AgendaItem {
  id: string;
  lawyerId: string;
  title: string;
  description?: string;
  date: string; // ISO
  type: 'Judicial' | 'Administrativo' | 'Interno' | 'Diligencia' | 'Extra Judicial';
  urgency: 'Alta' | 'Média' | 'Baixa';
  clientId?: string;
  clientName?: string; // Helper UI
  status: 'PENDING' | 'DONE';
}

// Tool 5: CRM / KYC (Atualizado para DB Real)
export interface CRMProfile {
  id: string;
  lawyerId: string;
  name: string;
  type: 'PF' | 'PJ';
  cpf_cnpj?: string;
  rg?: string;
  email?: string;
  phone?: string;
  address?: string;
  profession?: string;
  civil_status?: string;
  riskScore: 'Baixo' | 'Médio' | 'Alto';
  status: 'Ativo' | 'Prospecção' | 'Inativo';
  notes?: string;
  createdAt: string;
  // PRO ENHANCEMENTS
  trustScore?: number; // 0-100 score de confiabilidade
  segment?: 'Cliente Ideal' | 'Em Desenvolvimento' | 'Em Risco' | 'Dormindo' | 'VIP';
  tags?: string[]; // Auto-geradas por IA
  totalCases?: number; // Número de casos totais
  lastInteraction?: string; // Data último contato
  caseAreas?: string[]; // Áreas de atuação mais comuns
  nextAction?: string; // Recomendação IA
  conversationHistory?: ClientMessage[];
}

export interface ClientMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Tool 6: Intake
export interface IntakeSession {
  id: string;
  clientName: string;
  area: string;
  urgency: string;
  summary: string;
  suggestedAction: string;
  timestamp: string;
}

// Tool 7: Calculators
export interface SavedCalculation {
    id: string;
    lawyerId: string;
    clientId?: string; // Link com cliente CRM
    clientName?: string; // Helper UI
    category: string;
    type: string;
    title: string;
    inputData: any;
    resultData: any;
    createdAt: string;
    savedToSmartDoc?: boolean; // Flag se foi salvo no SmartDoc
    smartDocId?: string; // ID do SmartDoc associado
}

// Admin: Banner Management
export interface Banner {
  id: string;
  name: string; // 'banner_1' ou 'banner_2'
  imageUrl: string;
  linkUrl: string;
  updatedAt: string;
}