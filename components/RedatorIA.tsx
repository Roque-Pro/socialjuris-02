import React, { useState } from 'react';
import {
    PenTool, Loader2, Copy, Download, AlertTriangle, Check, Zap,
    ChevronDown, Eye, Settings, BookOpen, Sparkles, TrendingUp,
    FileText, Users, Calendar, Lightbulb, Lock, CheckCircle2, Save
} from 'lucide-react';
import { useApp } from '../store';
import { useClickLimit } from '../hooks/useClickLimit';
import ClickLimitModal from './ClickLimitModal';
import MarketPricesIndex from './MarketPricesIndex';
import {
    generateLegalDraft, analyzeCase, generateDraftVariations,
    findRelatedJurisprudence, analyzeDraftStrength, suggestImprovements,
    compareDrafts, checkCompliance
} from '../services/aiProvider';

interface DraftConfig {
    type: string;
    clientName: string;
    facts: string;
    tone: 'Formal' | 'Agressivo' | 'Conciliador' | 'Técnico';
}

const RedatorIA: React.FC = () => {
    const { crmClients, addSmartDoc } = useApp();
    const { handleClick, showLimitModal, setShowLimitModal, clicksUsed, clicksLimit } = useClickLimit();
    
    // Carregar estado persistido do localStorage
    const loadPersistedState = () => {
        try {
            const saved = localStorage.getItem('redatorIA_state');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Erro ao carregar estado persistido:', e);
        }
        return null;
    };

    const persistedState = loadPersistedState();

    const [step, setStep] = useState<'config' | 'preview' | 'edit' | 'analysis'>(persistedState?.step || 'config');
    const [daysUntilReset, setDaysUntilReset] = useState(30);
    
    console.log('RedatorIA render - step:', step, 'draftResult:', persistedState?.draftResult?.substring(0, 50));
    const [config, setConfig] = useState<DraftConfig>(persistedState?.config || {
        type: 'Peticao Inicial',
        clientName: '',
        facts: '',
        tone: 'Formal'
    });

    const [draftResult, setDraftResult] = useState(persistedState?.draftResult || '');
    const [variations, setVariations] = useState<any>(persistedState?.variations || null);
    const [caseAnalysis, setCaseAnalysis] = useState<any>(persistedState?.caseAnalysis || null);
    const [jurisprudence, setJurisprudence] = useState<any>(persistedState?.jurisprudence || null);
    const [strength, setStrength] = useState<any>(persistedState?.strength || null);
    const [compliance, setCompliance] = useState<any>(persistedState?.compliance || null);
    const [loading, setLoading] = useState(false);
    const [savingToSmartDocs, setSavingToSmartDocs] = useState(false);
    const [selectedVariation, setSelectedVariation] = useState(persistedState?.selectedVariation || 'balanced');
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Salvar estado no localStorage sempre que muda
    React.useEffect(() => {
        const stateToSave = {
            step,
            config,
            draftResult,
            variations,
            caseAnalysis,
            jurisprudence,
            strength,
            compliance,
            selectedVariation
        };
        localStorage.setItem('redatorIA_state', JSON.stringify(stateToSave));
    }, [step, config, draftResult, variations, caseAnalysis, jurisprudence, strength, compliance, selectedVariation]);

    const handleAnalyzeCase = async () => {
        setLoading(true);
        try {
            const analysis = await analyzeCase(config.clientName, config.type, config.facts);
            setCaseAnalysis(analysis);
        } catch (e) {
            console.error('Analysis error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateVariations = async () => {
        setLoading(true);
        try {
            const vars = await generateDraftVariations({
                type: config.type,
                clientName: config.clientName,
                facts: config.facts
            });
            setVariations(vars);
            setStep('preview');
        } catch (e) {
            console.error('Variations error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDraft = async () => {
        setLoading(true);
        try {
            let draft = '';
            // Se tem variações, usar a selecionada
            if (variations && selectedVariation) {
                draft = variations[selectedVariation as keyof typeof variations];
                setDraftResult(draft);
            } else {
                draft = await generateLegalDraft(config);
                setDraftResult(draft);
            }

            // Análise paralela
            const juris = await findRelatedJurisprudence(config.type, config.facts.substring(0, 100));
            setJurisprudence(juris);

            // Análise de força
            const str = await analyzeDraftStrength(draft, config.type);
            setStrength(str);

            // Conformidade
            const comp = await checkCompliance(config.type, draft);
            setCompliance(comp);

            setStep('analysis');
        } catch (e) {
            console.error('Generate error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeDraft = async () => {
        setLoading(true);
        try {
            const str = await analyzeDraftStrength(draftResult, config.type);
            setStrength(str);

            const comp = await checkCompliance(config.type, draftResult);
            setCompliance(comp);
        } catch (e) {
            console.error('Analysis error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClient = (clientId: string) => {
        const client = crmClients.find(c => c.id === clientId);
        if (client) {
            setConfig(prev => ({
                ...prev,
                clientName: client.name
            }));
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(draftResult);
        alert('Minuta copiada para clipboard!');
    };

    const handleSaveToSmartDocs = async () => {
        if (!draftResult) {
            alert('Nenhuma minuta gerada para salvar');
            return;
        }

        setSavingToSmartDocs(true);
        try {
            // Preparar nome do arquivo com tipo e cliente
            const fileName = `${config.type}_${config.clientName}_${new Date().toISOString().split('T')[0]}.txt`;
            
            // Calcular tamanho aproximado
            const sizeInKB = draftResult.length / 1024;

            // Detectar tipo para SmartDocs
            let smartDocType: 'Peticao' | 'Contrato' | 'Sentenca' | 'Procuracao' | 'Outros' = 'Outros';
            if (config.type.toLowerCase().includes('peticao')) smartDocType = 'Peticao';
            else if (config.type.toLowerCase().includes('contrato')) smartDocType = 'Contrato';
            else if (config.type.toLowerCase().includes('sentenca')) smartDocType = 'Sentenca';
            else if (config.type.toLowerCase().includes('procuracao')) smartDocType = 'Procuracao';

            // Adicionar ao SmartDocs
            await addSmartDoc({
                name: fileName,
                type: smartDocType,
                tags: [config.type, config.tone, 'Redator IA'],
                version: 1,
                size: sizeInKB.toFixed(2) + ' KB',
                url: `data:text/plain;base64,${btoa(draftResult)}`
            });

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro ao salvar no SmartDocs');
        } finally {
            setSavingToSmartDocs(false);
        }
    };

    const handleExportTxt = () => {
        if (!draftResult) return;

        const fileName = `${config.type}_${config.clientName}_${new Date().toISOString().split('T')[0]}.txt`;
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(draftResult));
        element.setAttribute('download', fileName);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleExportPDF = () => {
        if (!draftResult) return;

        // Criar iframe para impressão
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${config.type}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        font-size: 12px;
                        line-height: 1.8;
                        color: #000;
                        margin: 20px;
                        padding: 0;
                    }
                    h2 {
                        text-align: center;
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 30px;
                    }
                    .content {
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        text-align: justify;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: right;
                        font-size: 10px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <h2>${config.type}</h2>
                <div class="content">${draftResult}</div>
                <div class="footer">
                    <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
            </body>
            </html>
        `;

        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Aguardar o iframe carregar antes de imprimir
        iframe.onload = () => {
            iframe.contentWindow?.print();
            // Remover iframe após um tempo
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        };
    };

    // ===== RENDER =====

    const handleClearState = () => {
        localStorage.removeItem('redatorIA_state');
        setStep('config');
        setConfig({ type: 'Peticao Inicial', clientName: '', facts: '', tone: 'Formal' });
        setDraftResult('');
        setVariations(null);
        setCaseAnalysis(null);
        setJurisprudence(null);
        setStrength(null);
        setCompliance(null);
        setSelectedVariation('balanced');
    };

    return (
        <>
        <ClickLimitModal isOpen={showLimitModal} daysUntilReset={daysUntilReset} onClose={() => setShowLimitModal(false)} />
        <div className="space-y-6">
            {/* Índice de Preços de Mercado */}
            <MarketPricesIndex />

            {/* Description Card */}
            <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-rose-100 rounded-xl flex-shrink-0">
                        <PenTool className="w-6 h-6 text-rose-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">O que você pode fazer:</h3>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3">
                            Gere minutas jurídicas profissionais com inteligência artificial. Analise o caso, compare versões (agressiva/conciliadora/técnica), insira jurisprudência relevante e verifique conformidade legal. Editor com sugestões de IA em tempo real. Tudo pronto para exportar.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-rose-700 font-bold border border-rose-200">✍️ IA Avançada</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-rose-700 font-bold border border-rose-200">🎯 Múltiplas Versões</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-rose-700 font-bold border border-rose-200">📚 Jurisprudência</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-rose-700 font-bold border border-rose-200">🛡️ Conformidade</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-rose-700 font-bold border border-rose-200">⚡ Instantâneo</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 1: Configuration */}
            {step === 'config' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5" /> Configuração da Minuta
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Panel: Configuration */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Peça Jurídica</label>
                                <select
                                    value={config.type}
                                    onChange={e => setConfig({ ...config, type: e.target.value })}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                                >
                                    <option>Peticao Inicial</option>
                                    <option>Contestação</option>
                                    <option>Contrato de Honorários</option>
                                    <option>Procuração</option>
                                    <option>Parecer Jurídico</option>
                                    <option>Recurso</option>
                                    <option>Embargos</option>
                                    <option>Manifestação</option>
                                    <option>Notificação Extrajudicial</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cliente</label>
                                <select
                                    onChange={e => handleSelectClient(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none mb-2"
                                >
                                    <option value="">-- Selecionar do CRM --</option>
                                    {crmClients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={config.clientName}
                                    onChange={e => setConfig({ ...config, clientName: e.target.value })}
                                    placeholder="Ou digitar nome"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tons de Personalidade</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Formal', 'Agressivo', 'Conciliador', 'Técnico'].map(tone => (
                                        <button
                                            key={tone}
                                            onClick={() => setConfig({ ...config, tone: tone as any })}
                                            className={`p-2 rounded-lg text-xs font-bold transition ${config.tone === tone
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            {tone}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Fatos / Resumo</label>
                                <textarea
                                    value={config.facts}
                                    onChange={e => setConfig({ ...config, facts: e.target.value })}
                                    placeholder="Descreva os fatos principais do caso..."
                                    className="w-full p-3 border border-slate-300 rounded-lg h-40 focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                              <button
                                onClick={() => {
                                  if (!handleClick()) return;
                                  handleGenerateVariations();
                                }}
                                disabled={loading || !config.clientName || !config.facts || clicksUsed >= clicksLimit}
                                className="w-full bg-rose-600 text-white py-3 rounded-lg font-bold hover:bg-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Gerar Múltiplas Versões
                              </button>
                              <button
                                onClick={() => {
                                  if (!handleClick()) return;
                                  setLoading(true);
                                  generateLegalDraft(config).then(draft => {
                                    setDraftResult(draft);
                                    analyzeDraftStrength(draft, config.type).then(str => setStrength(str));
                                    checkCompliance(config.type, draft).then(comp => setCompliance(comp));
                                    findRelatedJurisprudence(config.type, config.facts.substring(0, 100)).then(juris => setJurisprudence(juris));
                                    setStep('analysis');
                                    setLoading(false);
                                  }).catch(e => {
                                    console.error('Error:', e);
                                    setLoading(false);
                                  });
                                }}
                                disabled={loading || !config.clientName || !config.facts || clicksUsed >= clicksLimit}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Gerar Minuta Direto
                              </button>
                            </div>
                        </div>

                        {/* Right Panel: Tips */}
                        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-amber-500" /> Dicas
                            </h4>
                            <ul className="text-sm text-slate-700 space-y-2">
                                <li>✅ Quanto mais detalhes nos fatos, melhor a IA entende</li>
                                <li>✅ Tom "Agressivo" é ideal para defesa</li>
                                <li>✅ Tom "Conciliador" é melhor para negociações</li>
                                <li>✅ "Técnico" para documentos complexos</li>
                                <li>✅ Você poderá editar após gerar</li>
                            </ul>

                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-700 font-semibold flex items-start gap-2">
                                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    A IA vai analisar o caso, buscar jurisprudência e gerar 4 versões para você escolher!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Preview Variations */}
            {step === 'preview' && variations && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5" /> Escolha a Versão Ideal
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[
                                { key: 'aggressive', label: '⚔️ Agressiva', desc: 'Força máxima' },
                                { key: 'conciliatory', label: '🤝 Conciliadora', desc: 'Negociável' },
                                { key: 'technical', label: '📋 Técnica', desc: 'Formal' },
                                { key: 'balanced', label: '⚖️ Equilibrada', desc: 'Recomendada' }
                            ].map(({ key, label, desc }) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedVariation(key)}
                                    className={`p-4 rounded-lg border-2 transition text-center ${selectedVariation === key
                                            ? 'border-rose-600 bg-rose-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="font-bold text-slate-900">{label}</div>
                                    <div className="text-xs text-slate-500">{desc}</div>
                                </button>
                            ))}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-60 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">
                            {variations[selectedVariation as keyof typeof variations] || 'Selecione uma versão'}
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => setStep('config')}
                                className="flex-1 bg-slate-200 text-slate-900 py-2 rounded-lg font-bold hover:bg-slate-300 transition"
                            >
                                ← Voltar
                            </button>
                            <button
                                onClick={handleGenerateDraft}
                                disabled={loading}
                                className="flex-1 bg-rose-600 text-white py-2 rounded-lg font-bold hover:bg-rose-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Usar Esta Versão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOOLBAR COM BOTÕES - SEMPRE VISÍVEL SE TIVER MINUTA */}
            {draftResult && (
                <>
                    {/* Toolbar fixo acima */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-lg">
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-bold text-slate-700">Ações da Minuta:</p>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="bg-slate-600 text-white py-2 px-3 rounded-lg font-bold hover:bg-slate-700 transition flex items-center justify-center gap-2"
                                    title="Copiar minuta para clipboard"
                                >
                                    <Copy className="w-4 h-4" />
                                    <span className="text-xs">Copiar</span>
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="bg-slate-600 text-white py-2 px-3 rounded-lg font-bold hover:bg-slate-700 transition flex items-center justify-center gap-2"
                                    title="Salvar como PDF"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="text-xs">PDF</span>
                                </button>
                                <button
                                    onClick={handleExportTxt}
                                    className="bg-slate-600 text-white py-2 px-3 rounded-lg font-bold hover:bg-slate-700 transition flex items-center justify-center gap-2"
                                    title="Download como TXT"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="text-xs">TXT</span>
                                </button>
                                <button
                                    onClick={handleSaveToSmartDocs}
                                    disabled={savingToSmartDocs}
                                    className="bg-green-600 text-white py-2 px-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    title="Salvar no SmartDocs"
                                >
                                    {savingToSmartDocs ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-xs">Salvando</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span className="text-xs">SmartDocs</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setStep('config')}
                                    className="bg-rose-600 text-white py-2 px-3 rounded-lg font-bold hover:bg-rose-700 transition flex items-center justify-center gap-2"
                                    title="Gerar nova minuta"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs">Nova</span>
                                </button>
                                <button
                                    onClick={handleClearState}
                                    className="bg-slate-400 text-white py-2 px-3 rounded-lg font-bold hover:bg-slate-500 transition flex items-center justify-center gap-2 text-xs"
                                    title="Limpar tudo"
                                >
                                    <span className="text-xs">Limpar</span>
                                </button>
                            </div>
                        </div>

                        {/* Success Message */}
                        {saveSuccess && (
                            <div className="bg-green-50 border border-green-300 rounded-lg p-3 mt-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold text-green-900">Sucesso!</p>
                                    <p className="text-xs text-green-700">Minuta salva no SmartDocs</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card com a Minuta */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" /> Minuta Gerada
                        </h3>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-96 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">
                            {draftResult}
                        </div>
                    </div>
                </>
            )}
        </div>
        </>
    );
};

export default RedatorIA;
