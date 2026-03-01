import React, { useState } from 'react';
import { 
  Upload, Download, Loader2, Search, AlertTriangle, FileText, 
  MessageCircle, Zap, Eye, Trash2, Copy, Share2, ChevronDown,
  BarChart3, Lock, Clock, DollarSign, User, CheckCircle2
} from 'lucide-react';
import { useApp } from '../store';
import { useClickLimit } from '../hooks/useClickLimit';
import ClickLimitModal from './ClickLimitModal';
import { SmartDoc } from '../types';
import { 
  analyzeDocumentAI, chatWithDocument, compareDocuments, 
  semanticSearch, generateComplianceChecklist, extractDocumentData 
} from '../services/aiProvider';

interface DocumentAnalysis {
  type: string;
  summary: string;
  risks: { type: string; severity: 'Alta' | 'Média' | 'Baixa'; description: string }[];
  importantDates: { label: string; date: string }[];
  values: { label: string; amount: string }[];
  tags: string[];
  riskScore: number;
}

const SmartDocs: React.FC = () => {
  const { smartDocs, addSmartDoc, crmClients } = useApp();
  const { handleClick, showLimitModal, setShowLimitModal, clicksUsed, clicksLimit } = useClickLimit();
  const [uploading, setUploading] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<SmartDoc | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'docs' | 'analise' | 'busca' | 'chat'>('docs');
  const [daysUntilReset, setDaysUntilReset] = useState(30);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      const file = e.target.files[0];
      
      try {
        // Simular leitura do arquivo (em produção seria Supabase Storage)
        const mockContent = `Documento: ${file.name}\nTipo: ${file.type}\nTamanho: ${file.size} bytes\nData: ${new Date().toISOString()}`;
        
        // Analisar com IA
        const aiAnalysis = await analyzeDocumentAI(file.name, mockContent);
        
        await addSmartDoc({
          name: file.name,
          type: aiAnalysis.type as any,
          tags: aiAnalysis.tags,
          version: 1,
          size: (file.size / 1024).toFixed(2) + ' KB',
          url: '#',
          clientId: selectedClient || undefined
        });

        setSelectedClient('');
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Erro ao fazer upload do documento.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAnalyzeDocument = async (doc: SmartDoc) => {
    if (!handleClick()) return;
    setSelectedDoc(doc);
    setAnalysisLoading(true);
    setActiveTab('analise');
    
    try {
      const mockContent = `${doc.name} - Documento jurídico processado`;
      const result = await analyzeDocumentAI(doc.name, mockContent);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Erro na análise do documento.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleChatWithDoc = async () => {
    if (!handleClick()) return;
    if (!selectedDoc || !chatQuestion) return;
    
    try {
      const mockContent = `${selectedDoc.name} - Conteúdo do documento`;
      const result = await chatWithDocument(mockContent, selectedDoc.name, chatQuestion);
      setChatAnswer(result.answer);
    } catch (error) {
      console.error('Chat failed:', error);
      setChatAnswer('Erro ao processar pergunta sobre o documento.');
    }
  };

  const handleSemanticSearch = async () => {
    if (!handleClick()) return;
    if (!searchQuery) return;
    
    try {
      const docsForSearch = smartDocs.map(d => ({
        name: d.name,
        content: `${d.name} - Tipo: ${d.type} - Tags: ${d.tags.join(', ')}`
      }));
      
      const result = await semanticSearch(searchQuery, docsForSearch);
      setSearchResults(result.results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-700 border-red-300';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return '⚠️ Alto Risco';
    if (score >= 40) return '⚡ Risco Médio';
    return '✅ Baixo Risco';
  };

  return (
    <>
    <ClickLimitModal isOpen={showLimitModal} daysUntilReset={daysUntilReset} onClose={() => setShowLimitModal(false)} />
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">SmartDocs Pro</h2>
          <p className="text-slate-500">Gerenciador inteligente de documentos com IA Gemini</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">-- Vincular a Cliente (Opcional) --</option>
            {crmClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-indigo-700 transition flex items-center">
            <Upload className="w-4 h-4 mr-2" /> Upload
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </header>

      {/* Description Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-xl flex-shrink-0">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 mb-2">O que você pode fazer:</h3>
            <p className="text-slate-700 text-sm leading-relaxed mb-3">
              Faça upload de documentos e deixe a IA analisar automaticamente. Detecta tipo, extrai dados críticos, identifica riscos e gera resumos. Chat inteligente para dúvidas sobre documentos, comparação entre arquivos e busca semântica. Controle versões e exporte relatórios completos.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-purple-700 font-bold border border-purple-200">🤖 IA Gemini</span>
              <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-purple-700 font-bold border border-purple-200">⚠️ Score Risco</span>
              <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-purple-700 font-bold border border-purple-200">💬 Chat Docs</span>
              <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-purple-700 font-bold border border-purple-200">🔍 Busca Semântica</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'docs'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          📄 Documentos
        </button>
        <button
          onClick={() => setActiveTab('analise')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'analise'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          📊 Análises
        </button>
        <button
          onClick={() => setActiveTab('busca')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'busca'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          🔍 Busca
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'chat'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          💬 Chat
        </button>
      </div>

      {/* Content by Tab */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {uploading && (
            <div className="p-8 text-center text-indigo-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Analisando com IA...
            </div>
          )}
          {!uploading && smartDocs.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              Nenhum documento. Comece fazendo upload para testar a IA.
            </div>
          )}
          {smartDocs.map(doc => {
            const clientName = crmClients.find(c => c.id === doc.clientId)?.name;
            return (
              <div
                key={doc.id}
                className="border-b border-slate-100 p-4 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => handleAnalyzeDocument(doc)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <h4 className="font-bold text-slate-800">{doc.name}</h4>
                      {doc.tags.length > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                          {doc.tags[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {doc.type}
                      </span>
                      {clientName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {clientName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(doc.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'analise' && selectedDoc && analysis && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">{selectedDoc.name}</h3>
              <div className={`px-3 py-1 rounded-lg font-bold border ${getRiskColor(analysis.riskScore)}`}>
                {getRiskLabel(analysis.riskScore)}
                <div className="text-xs font-normal mt-1">{analysis.riskScore}/100</div>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2">📋 Resumo Executivo</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Risks */}
            {analysis.risks.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" /> Riscos Identificados
                </h4>
                <div className="space-y-2">
                  {analysis.risks.map((risk, idx) => (
                    <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          risk.severity === 'Alta' ? 'bg-red-200 text-red-800' :
                          risk.severity === 'Média' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {risk.severity}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{risk.type}</p>
                          <p className="text-sm text-slate-700">{risk.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Dates */}
            {analysis.importantDates.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" /> Datas Importantes
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {analysis.importantDates.map((date, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-slate-600">{date.label}</p>
                      <p className="font-semibold text-slate-900">{date.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Values */}
            {analysis.values.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" /> Valores Identificados
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {analysis.values.map((value, idx) => (
                    <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-slate-600">{value.label}</p>
                      <p className="font-semibold text-slate-900">{value.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {analysis.tags.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-2">🏷️ Tags Inteligentes</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.tags.map(tag => (
                    <span key={tag} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chat' && selectedDoc && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">💬 Chat com {selectedDoc.name}</h3>
          
          <div className="space-y-4">
            <div className="bg-slate-100 rounded-lg p-4 min-h-24 max-h-48 overflow-y-auto">
              {chatAnswer ? (
                <div className="text-slate-800">{chatAnswer}</div>
              ) : (
                <div className="text-slate-400 text-center py-6">
                  Faça uma pergunta sobre o documento...
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatQuestion}
                onChange={e => setChatQuestion(e.target.value)}
                placeholder="Faça uma pergunta sobre este documento..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                onKeyPress={e => e.key === 'Enter' && handleChatWithDoc()}
              />
              <button
                onClick={handleChatWithDoc}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'busca' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">🔍 Busca Semântica</h3>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Busque por conceitos: 'documentos sobre rescisão', 'contratos com multa'..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              onKeyPress={e => e.key === 'Enter' && handleSemanticSearch()}
            />
            <button
              onClick={handleSemanticSearch}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{result.docName}</p>
                      <p className="text-sm text-slate-600 mt-1">{result.relevantExcerpt}</p>
                    </div>
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {result.relevance}% relevante
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default SmartDocs;
