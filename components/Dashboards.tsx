
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { supabase } from '../services/supabaseClient';
import { UserRole, CaseStatus, Case, User, Notification, SmartDoc, JurisprudenceResult, AgendaItem, CRMProfile, SavedCalculation } from '../types';
import { Plus, Briefcase, MessageSquare, Check, X, Bell, User as UserIcon, LogOut, Award, DollarSign, Users, Activity, Filter, Search, Save, Settings, Phone, Mail, Shield, AlertCircle, MapPin, CreditCard, Coins, Loader2, Lock, FileText, Calculator, Calendar, Scale, Sparkles, BrainCircuit, TrendingUp, BarChart3, AlertTriangle, Zap, FileSearch, Folders, Clock, Eye, XCircle, Hammer, LayoutGrid, PieChart, ChevronRight, Copy, Printer, BookOpen, Download, RefreshCw, ChevronDown, GraduationCap, Heart, Landmark, BriefcaseBusiness, FileSpreadsheet, Upload, Tags, PenTool, ClipboardList, UserPlus, List, Edit2, Paperclip, Globe, Ban, CheckCircle2, Send, Menu, Share2, Store } from 'lucide-react';
import { Chat } from './Chat';
import ClickCounter from './ClickCounter';
import { useClickLimit } from '../hooks/useClickLimit';
import ClickLimitModal from './ClickLimitModal';
import MarketPricesIndex from './MarketPricesIndex';
import bannerTeste from '../img/banner_teste.png';
import { analyzeCaseDescription, calculateCasePrice, autoTagDocument, searchJurisprudence, generateLegalDraft, analyzeCRMRisk, diagnoseIntake, calculateLegalMath, generateClientProfile, generateNextAction, chatWithClientAI, generateClientTags, generateClientReport, suggestDeadlines, generatePreparationChecklist, analyzeAgendaConflicts, generateAgendaSummary, generateIntakeQuestions, estimateCaseValue, analyzeViability } from '../services/aiProvider';
import { calculateRescisaoCompleta, calculateFerias, calculateHorasExtras, calculateCorrecaoMonetaria, calculateJurosMoratorios, calculateAposentadoriaIdade, calculateSELIC, calculatePensaoAlimenticia, calculateHonorarios, calculatePrazoCPC } from '../services/calculatorsService';

// --- CONSTANTES ---
const BRAZIL_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Máscara de moeda brasileira - formata enquanto digita
const formatCurrencyBR = (value: string): string => {
    if (!value) return '';

    // Remove tudo que não é número
    let numericOnly = value.replace(/\D/g, '');
    if (!numericOnly) return '';

    // Converte para BigInt para suportar números grandes
    const bigNumValue = BigInt(numericOnly);
    const numValue = Number(bigNumValue / BigInt(100));
    const cents = Number(bigNumValue % BigInt(100));

    // Formata com localização brasileira (1.000.000,00)
    const formatted = numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    return formatted + ',' + cents.toString().padStart(2, '0');
};

// Função auxiliar para converter entrada para número
const parseCurrencyInput = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    // Remove formatação: "1.000.000,00" -> "1000000.00"
    const cleaned = formattedValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
};

type ViewType = 'dashboard' | 'profile' | 'notifications' | 'new-case' | 'pro_sales' | 'market' | 'my-cases' |
    'tool-docs' | 'tool-juris' | 'tool-writer' | 'tool-agenda' | 'tool-crm' | 'tool-intake' | 'tool-calc';

// --- SHARED COMPONENTS ---

// Componente de Botão de Compartilhamento
const ShareButton: React.FC<{ caseData: any }> = ({ caseData }) => {
    const [showShareMenu, setShowShareMenu] = useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const shareUrl = `${window.location.origin}?case=${caseData.id}`;
    const shareText = `Confira esta demanda jurídica: ${caseData.title} - ${caseData.description}`;

    const handleShare = (platform: string) => {
        const encodedText = encodeURIComponent(shareText);
        const encodedUrl = encodeURIComponent(shareUrl);

        const urls: { [key: string]: string } = {
            whatsapp: `https://wa.me/?text=${encodedText} ${encodedUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            email: `mailto:?subject=${encodeURIComponent(caseData.title)}&body=${encodedText}`,
        };

        if (platform === 'copy') {
            navigator.clipboard.writeText(shareUrl);
            alert('Link copiado!');
        } else if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
        }
        setShowShareMenu(false);
    };

    const toggleMenu = () => {
        if (!showShareMenu && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 8,
                left: rect.left - 180
            });
        }
        setShowShareMenu(!showShareMenu);
    };

    return (
        <div>
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                className="p-2 hover:bg-gray-100 rounded-lg transition text-slate-600 hover:text-indigo-600"
                title="Compartilhar"
            >
                <Share2 className="w-5 h-5" />
            </button>
            {showShareMenu && (
                <div className="fixed bg-white rounded-lg shadow-xl border border-slate-200 z-50 w-48" style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}>
                    <button onClick={() => handleShare('whatsapp')} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-slate-700 flex items-center gap-2">
                        <span>📱 WhatsApp</span>
                    </button>
                    <button onClick={() => handleShare('facebook')} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-slate-700 flex items-center gap-2">
                        <span>👍 Facebook</span>
                    </button>
                    <button onClick={() => handleShare('linkedin')} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-slate-700 flex items-center gap-2">
                        <span>💼 LinkedIn</span>
                    </button>
                    <button onClick={() => handleShare('email')} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-slate-700 flex items-center gap-2">
                        <span>✉️ E-mail</span>
                    </button>
                    <button onClick={() => handleShare('copy')} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-slate-700 flex items-center gap-2 border-t border-slate-100">
                        <Copy className="w-4 h-4" /> Copiar Link
                    </button>
                </div>
            )}
        </div>
    );
};

// Badge de Verificação do Advogado
const LawyerVerificationBadge: React.FC<{ lawyer: User; showIfPending?: boolean }> = ({ lawyer, showIfPending = false }) => {
    if (!lawyer.verified && !showIfPending) return null;

    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center ml-1 ${lawyer.verified
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
            }`}>
            <Check className="w-3 h-3 mr-1" />
            {lawyer.verified ? 'Verificado' : 'Pendente'}
        </span>
    );
};

const UserProfile: React.FC = () => {
    const { currentUser, updateProfile } = useApp();
    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        oab: currentUser?.oab || '',
        bio: currentUser?.bio || '',
    });
    const [loading, setLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(!!currentUser?.mustChangePassword);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [isMustChange, setIsMustChange] = useState(!!currentUser?.mustChangePassword);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(formData);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        if (!newPassword) {
            setPasswordError('Informe uma nova senha');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas não conferem');
            return;
        }

        if (!currentUser?.email) return;

        setPasswordLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000';
            const response = await fetch(`${apiUrl}/api/auth/admin-reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    newPassword: newPassword
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                console.error('Erro ao parsear JSON:', e, 'Response status:', response.status, 'Response text:', await response.text());
                throw new Error('Servidor retornou resposta inválida');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao alterar senha');
            }

            alert('✅ Senha alterada com sucesso!');
            setShowPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
            setIsMustChange(false);
            
            // Atualizar o usuário no banco para marcar que já alterou
            if (isMustChange) {
                await updateProfile({ mustChangePassword: false });
            }
        } catch (error: any) {
            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
            setPasswordError(errorMsg);
            console.error('Password change error:', error);
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                    <div className="relative group">
                        <img src={currentUser?.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-slate-50 object-cover shadow-md" />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                            <span className="text-white text-xs font-bold">Alterar</span>
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold text-slate-900">{currentUser?.name}</h2>
                        <div className="flex items-center justify-center md:justify-start space-x-2 text-slate-500">
                            <span className="capitalize">{currentUser?.role === 'LAWYER' ? 'Advogado' : currentUser?.role === 'CLIENT' ? 'Cliente' : 'Administrador'}</span>
                            {currentUser?.verified && <Check className="w-4 h-4 text-green-500" />}
                            {currentUser?.isPremium && <span className="bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 flex items-center"><Sparkles className="w-3 h-3 mr-1" /> PRO</span>}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input type="email" name="email" value={formData.email} onChange={handleChange} disabled className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Telefone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                            </div>
                        </div>
                        {currentUser?.role === UserRole.LAWYER && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">OAB</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                    <input type="text" name="oab" value={formData.oab} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                                </div>
                            </div>
                        )}
                    </div>

                    {currentUser?.role === UserRole.LAWYER && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Biografia Profissional</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} placeholder="Conte um pouco sobre sua experiência..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none" />
                        </div>
                    )}

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowPasswordModal(true)}
                            disabled={loading || passwordLoading}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                            <span>{passwordLoading ? 'Processando...' : 'Alterar Senha'}</span>
                        </button>
                        <button type="submit" disabled={loading || passwordLoading} className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                        </button>
                    </div>

                    {/* Modal de Alterar Senha - Direto */}
                    {showPasswordModal && (
                         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                             <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                                 <div className={`p-6 border-b ${isMustChange ? 'bg-orange-50 border-orange-200' : 'border-slate-200'}`}>
                                     <div className="flex items-start gap-3">
                                         {isMustChange && <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />}
                                         <div>
                                             <h3 className="text-lg font-bold text-slate-900">Alterar Senha</h3>
                                             <p className="text-sm text-slate-500 mt-1">{currentUser?.email}</p>
                                             {isMustChange && <p className="text-sm text-orange-700 mt-2 font-semibold">⚠️ Obrigatório alterar sua senha por segurança</p>}
                                         </div>
                                     </div>
                                 </div>

                                 <div className="p-6 space-y-4">
                                     {passwordError && (
                                         <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                             <p className="text-sm text-red-700">{passwordError}</p>
                                         </div>
                                     )}

                                     <div className="space-y-2">
                                         <label className="text-sm font-semibold text-slate-700">Nova Senha</label>
                                         <input
                                             type={showNewPassword ? 'text' : 'password'}
                                             value={newPassword}
                                             onChange={(e) => setNewPassword(e.target.value)}
                                             placeholder="Digite a nova senha"
                                             disabled={passwordLoading}
                                             className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                                         />
                                     </div>

                                     <div className="space-y-2">
                                         <label className="text-sm font-semibold text-slate-700">Confirmar Senha</label>
                                         <input
                                             type={showNewPassword ? 'text' : 'password'}
                                             value={confirmPassword}
                                             onChange={(e) => setConfirmPassword(e.target.value)}
                                             placeholder="Repita a nova senha"
                                             disabled={passwordLoading}
                                             className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                                         />
                                     </div>

                                     <label className="flex items-center space-x-2 text-sm text-slate-600">
                                         <input
                                             type="checkbox"
                                             checked={showNewPassword}
                                             onChange={(e) => setShowNewPassword(e.target.checked)}
                                             disabled={passwordLoading}
                                             className="rounded border-slate-300"
                                         />
                                         <span>Mostrar Senha</span>
                                     </label>
                                 </div>

                                 <div className="p-6 border-t border-slate-200 flex space-x-3">
                                     <button
                                         onClick={() => {
                                             if (!isMustChange) {
                                                 setShowPasswordModal(false);
                                                 setNewPassword('');
                                                 setConfirmPassword('');
                                                 setPasswordError('');
                                             }
                                         }}
                                         disabled={passwordLoading || isMustChange}
                                         className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                         title={isMustChange ? 'Obrigatório alterar a senha' : ''}
                                     >
                                         {isMustChange ? 'Obrigatório' : 'Cancelar'}
                                     </button>
                                     <button
                                         onClick={handleChangePassword}
                                         disabled={passwordLoading}
                                         className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                                     >
                                         {passwordLoading ? (
                                             <>
                                                 <Loader2 className="w-4 h-4 animate-spin" />
                                                 <span>Alterando...</span>
                                             </>
                                         ) : (
                                             <span>Alterar Senha</span>
                                         )}
                                     </button>
                                 </div>
                             </div>
                         </div>
                     )}
                </form>
            </div>
        </div>
    );
};

const NotificationList: React.FC = () => {
    const { notifications, currentUser, markNotificationAsRead } = useApp();
    const myNotifications = notifications.filter(n => n.userId === currentUser?.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Suas Notificações</h2>
                    <span className="text-xs font-medium text-slate-500">{myNotifications.filter(n => !n.read).length} não lidas</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {myNotifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500">Você não tem novas notificações.</p>
                        </div>
                    ) : (
                        myNotifications.map(n => (
                            <div key={n.id} onClick={() => {
                                markNotificationAsRead(n.id);
                                if (n.title === 'Proposta Aceita!' || n.message.includes('manifestou interesse')) {
                                    setView('my-cases');
                                }
                            }} className={`p-6 flex items-start space-x-4 hover:bg-slate-50 transition cursor-pointer ${!n.read ? 'bg-indigo-50/50' : ''}`}>
                                <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${n.type === 'success' ? 'bg-green-100 text-green-600' :
                                    n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                    {n.type === 'success' ? <Check className="w-4 h-4" /> : n.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-sm font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</h3>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{new Date(n.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className={`text-sm mt-1 ${!n.read ? 'text-slate-800' : 'text-slate-500'}`}>{n.message}</p>
                                </div>
                                {!n.read && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const ToolCRM: React.FC = () => {
    const { crmClients, addCRMClient, updateCRMClient, smartDocs, addSmartDoc } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingClient, setViewingClient] = useState<CRMProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fileUploading, setFileUploading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [showChat, setShowChat] = useState(false);
    const [clientReport, setClientReport] = useState<string | null>(null);

    // Form State for New Client
    const [newClient, setNewClient] = useState({
        name: '', type: 'PF' as 'PF' | 'PJ', cpf_cnpj: '', rg: '', email: '', phone: '',
        address: '', profession: '', civil_status: '', notes: ''
    });

    // Form State for Editing Client
    const [editForm, setEditForm] = useState<Partial<CRMProfile>>({});

    const handleSaveClient = async () => {
        if (!newClient.name) return alert("Nome é obrigatório");
        setLoading(true);
        try {
            const riskAnalysis = await analyzeCRMRisk(newClient.name, newClient.type);
            const profile = await generateClientProfile({
                name: newClient.name,
                type: newClient.type,
                profession: newClient.profession,
                civil_status: newClient.civil_status,
                notes: newClient.notes,
                riskScore: riskAnalysis.riskScore
            });
            const tags = await generateClientTags({ ...newClient, riskScore: riskAnalysis.riskScore });

            await addCRMClient({
                ...newClient,
                riskScore: riskAnalysis.riskScore as any,
                status: 'Prospecção',
                trustScore: profile.trustScore,
                segment: profile.segment,
                tags: tags,
                totalCases: 0,
                lastInteraction: new Date().toISOString(),
                caseAreas: [],
                nextAction: 'Aguardando contato',
                conversationHistory: []
            });
        } catch (e) {
            console.error('Erro ao salvar cliente:', e);
        } finally {
            setLoading(false);
            setIsModalOpen(false);
            setNewClient({ name: '', type: 'PF', cpf_cnpj: '', rg: '', email: '', phone: '', address: '', profession: '', civil_status: '', notes: '' });
        }
    };

    const handleUpdateClient = async () => {
        if (!viewingClient) return;
        setLoading(true);
        await updateCRMClient(viewingClient.id, editForm);
        setViewingClient(prev => prev ? ({ ...prev, ...editForm }) : null);
        setLoading(false);
        setIsEditing(false);
    };

    const handleQuickFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && viewingClient) {
            setFileUploading(true);
            const file = e.target.files[0];
            const aiData = await autoTagDocument(file.name);
            await addSmartDoc({
                name: file.name,
                type: aiData.type as any,
                tags: aiData.tags,
                version: 1,
                size: (file.size / 1024).toFixed(2) + ' KB',
                url: '#',
                clientId: viewingClient.id
            });
            setFileUploading(false);
        }
    };

    const startEditing = () => {
        if (viewingClient) {
            setEditForm(viewingClient);
            setIsEditing(true);
        }
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditForm({});
    };

    const clientDocs = viewingClient ? smartDocs.filter(d => d.clientId === viewingClient.id) : [];

    const handleChatMessage = async () => {
        if (!chatInput.trim() || !viewingClient) return;

        const userMessage = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }]);

        setAiLoading(true);
        try {
            const response = await chatWithClientAI(viewingClient, userMessage, chatMessages);
            setChatMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date().toISOString() }]);
        } catch (e) {
            console.error('Chat error:', e);
        } finally {
            setAiLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!viewingClient) return;
        setAiLoading(true);
        try {
            const report = await generateClientReport(viewingClient, viewingClient.caseAreas || []);
            setClientReport(report);
        } catch (e) {
            console.error('Report error:', e);
        } finally {
            setAiLoading(false);
        }
    };

    const handleGenerateNextAction = async () => {
        if (!viewingClient) return;
        setAiLoading(true);
        try {
            const action = await generateNextAction(viewingClient, viewingClient.caseAreas || []);
            if (viewingClient) {
                setViewingClient(prev => prev ? { ...prev, nextAction: action } : null);
            }
        } catch (e) {
            console.error('Action error:', e);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">CRM & KYC Jurídico</h2>
                    <p className="text-slate-500">Gestão de carteira e análise de risco.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg hover:bg-indigo-700 transition">
                    <UserPlus className="w-4 h-4 mr-2" /> Novo Cliente
                </button>
            </header>

            {/* FERRAMENTA DESCRIPTION CARD */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-xl flex-shrink-0">
                        <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">O que você pode fazer:</h3>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3">
                            Gerencie sua carteira de clientes com inteligência artificial. Analise risco automaticamente, segmente clientes por potencial, acompanhe histórico de casos, organize documentos e receba recomendações estratégicas sobre próximos passos. Tudo centralizado em um dossiê completo para cada cliente.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-indigo-700 font-bold border border-indigo-200">📊 Score de Confiança</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-indigo-700 font-bold border border-indigo-200">🏷️ Segmentação</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-indigo-700 font-bold border border-indigo-200">💬 Chat IA</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-indigo-700 font-bold border border-indigo-200">📈 Relatórios</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Client List */}
            <div className="grid gap-4">
                {crmClients.length === 0 && (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhum cliente cadastrado no banco de dados.</p>
                    </div>
                )}
                {crmClients.map(client => (
                    <div
                        key={client.id}
                        onClick={() => { setViewingClient(client); setIsEditing(false); setChatMessages([]); setClientReport(null); setShowChat(false); }}
                        className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm hover:border-indigo-300 transition cursor-pointer group"
                    >
                        <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition">
                                {client.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">{client.name}</h3>
                                <div className="flex flex-wrap space-x-2 mt-1">
                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">{client.type}</span>
                                    {client.cpf_cnpj && <span className="text-xs text-slate-400 border border-slate-200 px-2 py-0.5 rounded">{client.cpf_cnpj}</span>}
                                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${client.riskScore === 'Alto' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>Risco {client.riskScore}</span>
                                    {client.segment && <span className={`text-xs px-2 py-0.5 rounded font-bold ${client.segment === 'Cliente Ideal' ? 'bg-emerald-100 text-emerald-700' :
                                        client.segment === 'VIP' ? 'bg-amber-100 text-amber-700' :
                                            client.segment === 'Em Risco' ? 'bg-rose-100 text-rose-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>{client.segment}</span>}
                                    {client.trustScore && <span className={`text-xs px-2 py-0.5 rounded font-bold flex items-center ${client.trustScore >= 70 ? 'bg-green-100 text-green-700' : client.trustScore >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        <Award className="w-3 h-3 mr-1" /> {client.trustScore}%
                                    </span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-slate-400">{client.totalCases || 0} casos</p>
                                <p className="text-sm font-medium text-slate-700">{client.email || '-'}</p>
                            </div>
                            <div className="text-slate-300 group-hover:text-indigo-600 transition"><ChevronRight /></div>
                        </div>
                    </div>
                ))}
            </div>

            {viewingClient && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300 relative">
                        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-start">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-white border-4 border-white shadow-sm rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                                    {viewingClient.name.charAt(0)}
                                </div>
                                <div>
                                    {isEditing ? (
                                        <input
                                            value={editForm.name || ''}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="text-2xl font-bold text-slate-900 border-b border-indigo-300 bg-transparent focus:outline-none w-full"
                                            placeholder="Nome do Cliente"
                                        />
                                    ) : (
                                        <h2 className="text-2xl font-bold text-slate-900">{viewingClient.name}</h2>
                                    )}

                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">{viewingClient.type}</span>
                                        <div className="relative group">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold cursor-help flex items-center gap-1 ${viewingClient.riskScore === 'Alto' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                Risco {viewingClient.riskScore}
                                                <span className="text-xs opacity-60">ⓘ</span>
                                            </span>
                                            <div className="absolute bottom-full left-0 mb-2 bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                {viewingClient.riskScore === 'Alto'
                                                    ? 'Alto: Cliente com histórico de atrasos, disputas ou baixa atividade.'
                                                    : 'Médio: Análise IA com base em padrões comportamentais e histórico do cliente.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {!isEditing ? (
                                    <button onClick={startEditing} className="p-2 bg-white rounded-full hover:bg-slate-200 transition text-indigo-600" title="Editar Cliente">
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={handleUpdateClient} disabled={loading} className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition text-green-700" title="Salvar">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                        </button>
                                        <button onClick={cancelEditing} className="p-2 bg-red-100 rounded-full hover:bg-red-200 transition text-red-700" title="Cancelar">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setViewingClient(null)} className="p-2 bg-white rounded-full hover:bg-slate-200 transition text-slate-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase text-xs tracking-wider">Dados Pessoais</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-400">CPF / CNPJ</p>
                                        {isEditing ? (
                                            <input value={editForm.cpf_cnpj || ''} onChange={e => setEditForm({ ...editForm, cpf_cnpj: e.target.value })} className="w-full p-1 border rounded text-sm" />
                                        ) : (
                                            <p className="font-medium text-slate-800">{viewingClient.cpf_cnpj || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">RG / IE</p>
                                        {isEditing ? (
                                            <input value={editForm.rg || ''} onChange={e => setEditForm({ ...editForm, rg: e.target.value })} className="w-full p-1 border rounded text-sm" />
                                        ) : (
                                            <p className="font-medium text-slate-800">{viewingClient.rg || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Estado Civil</p>
                                        {isEditing ? (
                                            <input value={editForm.civil_status || ''} onChange={e => setEditForm({ ...editForm, civil_status: e.target.value })} className="w-full p-1 border rounded text-sm" />
                                        ) : (
                                            <p className="font-medium text-slate-800">{viewingClient.civil_status || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Profissão</p>
                                        {isEditing ? (
                                            <input value={editForm.profession || ''} onChange={e => setEditForm({ ...editForm, profession: e.target.value })} className="w-full p-1 border rounded text-sm" />
                                        ) : (
                                            <p className="font-medium text-slate-800">{viewingClient.profession || 'N/A'}</p>
                                        )}
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase text-xs tracking-wider mt-6">Contato</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-400">Email</p>
                                        {isEditing ? (
                                            <input value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full p-1 border rounded text-sm" />
                                        ) : (
                                            <p className="font-medium text-slate-800">{viewingClient.email || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Telefone</p>
                                        {isEditing ? (
                                            <input value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full p-1 border rounded text-sm" />
                                        ) : (
                                            <p className="font-medium text-slate-800">{viewingClient.phone || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Endereço</p>
                                        {isEditing ? (
                                            <input value={editForm.address || ''} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full p-1 border rounded text-sm" />
                                        ) : (
                                            <p className="font-medium text-slate-800">{viewingClient.address || 'N/A'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase text-xs tracking-wider">Notas Internas</h3>
                                {isEditing ? (
                                    <textarea
                                        value={editForm.notes || ''}
                                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                        className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-900 min-h-[100px] focus:outline-none"
                                    />
                                ) : (
                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800 min-h-[100px]">
                                        {viewingClient.notes || "Sem observações registradas."}
                                    </div>
                                )}

                                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase text-xs tracking-wider mt-6 flex justify-between items-center">
                                    <span>Documentos Vinculados</span>
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-2 py-1 rounded-md text-[10px] flex items-center shadow-sm transition">
                                            {fileUploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                                            Anexar
                                            <input type="file" className="hidden" onChange={handleQuickFileUpload} disabled={fileUploading} />
                                        </label>
                                        <span className="bg-indigo-100 text-indigo-700 px-2 rounded-full text-[10px] flex items-center h-5">{clientDocs.length}</span>
                                    </div>
                                </h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {clientDocs.length === 0 ? (
                                        <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                                            <p className="text-slate-400 text-xs italic">Nenhum documento.</p>
                                        </div>
                                    ) : (
                                        clientDocs.map(doc => (
                                            <div key={doc.id} className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-sm transition">
                                                <FileText className="w-4 h-4 text-slate-400 mr-2" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-700 truncate">{doc.name}</p>
                                                    <p className="text-slate-400 text-[10px]">{new Date(doc.date).toLocaleDateString()}</p>
                                                </div>
                                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded whitespace-nowrap ml-2">{doc.type}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* PRO INSIGHTS SECTION */}
                        <div className="p-6 border-t border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 flex items-center"><BrainCircuit className="w-5 h-5 mr-2 text-indigo-600" /> IA Insights & Ações</h3>
                                <button onClick={handleGenerateNextAction} disabled={aiLoading} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition flex items-center">
                                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                                    Atualizar IA
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {viewingClient.trustScore !== undefined && (
                                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                                        <p className="text-xs text-slate-500 font-bold">Score de Confiança</p>
                                        <div className="flex items-center mt-2">
                                            <div className="flex-1 bg-slate-200 rounded-full h-2">
                                                <div className={`h-full rounded-full ${viewingClient.trustScore >= 70 ? 'bg-green-500' : viewingClient.trustScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${viewingClient.trustScore}%` }}></div>
                                            </div>
                                            <p className="ml-2 font-bold text-slate-900">{viewingClient.trustScore}%</p>
                                        </div>
                                    </div>
                                )}
                                {viewingClient.segment && (
                                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                                        <p className="text-xs text-slate-500 font-bold">Segmentação</p>
                                        <p className="mt-2 font-bold text-slate-900">{viewingClient.segment}</p>
                                    </div>
                                )}
                                {viewingClient.totalCases !== undefined && (
                                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                                        <p className="text-xs text-slate-500 font-bold">Total de Casos</p>
                                        <p className="mt-2 text-2xl font-bold text-slate-900">{viewingClient.totalCases}</p>
                                    </div>
                                )}
                            </div>

                            {viewingClient.tags && viewingClient.tags.length > 0 && (
                                <div className="bg-white p-4 rounded-lg border border-slate-200">
                                    <p className="text-xs text-slate-500 font-bold mb-2">Tags Inteligentes</p>
                                    <div className="flex flex-wrap gap-2">
                                        {viewingClient.tags.map((tag, idx) => (
                                            <span key={idx} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewingClient.nextAction && (
                                <div className="bg-white p-4 rounded-lg border-l-4 border-amber-500">
                                    <p className="text-xs text-slate-500 font-bold mb-1">Próxima Ação Recomendada</p>
                                    <p className="text-sm text-slate-800">{viewingClient.nextAction}</p>
                                </div>
                            )}

                            {clientReport && (
                                <div className="bg-white p-4 rounded-lg border border-slate-200">
                                    <p className="text-xs text-slate-500 font-bold mb-3">Relatório Executivo</p>
                                    <div className="text-sm text-slate-700 leading-relaxed space-y-3 max-h-96 overflow-y-auto">
                                        {clientReport.split('\n').map((line, idx) => {
                                            // Cabeçalhos (linhas que começam com **)
                                            if (line.includes('**')) {
                                                return (
                                                    <p key={idx} className="font-bold text-slate-900 mt-3">
                                                        {line.replace(/\*\*/g, '')}
                                                    </p>
                                                );
                                            }
                                            // Itens de lista (começam com -)
                                            if (line.trim().startsWith('-')) {
                                                return (
                                                    <p key={idx} className="ml-4 text-slate-600">
                                                        • {line.replace(/^\s*-\s*/, '')}
                                                    </p>
                                                );
                                            }
                                            // Números (1., 2., etc)
                                            if (line.match(/^\d+\./)) {
                                                return (
                                                    <p key={idx} className="font-semibold text-slate-900 mt-2">
                                                        {line}
                                                    </p>
                                                );
                                            }
                                            // Separadores
                                            if (line.trim() === '---') {
                                                return <hr key={idx} className="my-2 border-slate-200" />;
                                            }
                                            // Linhas vazias
                                            if (line.trim() === '') {
                                                return <div key={idx} className="h-1" />;
                                            }
                                            // Texto normal
                                            return (
                                                <p key={idx} className="text-slate-700">
                                                    {line}
                                                </p>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={handleGenerateReport} disabled={aiLoading} className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition flex items-center justify-center text-sm">
                                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                                    Gerar Relatório
                                </button>
                                <button onClick={() => setShowChat(!showChat)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center justify-center text-sm">
                                    <MessageSquare className="w-4 h-4 mr-2" /> Chat IA
                                </button>
                            </div>

                            {showChat && (
                                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 max-h-64 flex flex-col">
                                    <div className="flex-1 overflow-y-auto space-y-3 mb-2">
                                        {chatMessages.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">Inicie uma conversa sobre este cliente...</p>
                                        ) : (
                                            chatMessages.map((msg, idx) => (
                                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`px-3 py-2 rounded-lg max-w-xs text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {aiLoading && <div className="flex items-center text-xs text-slate-500"><Loader2 className="w-3 h-3 animate-spin mr-1" /> IA processando...</div>}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && handleChatMessage()}
                                            placeholder="Pergunte sobre este cliente..."
                                            className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                            disabled={aiLoading}
                                        />
                                        <button onClick={handleChatMessage} disabled={aiLoading || !chatInput.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setViewingClient(null)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition">Fechar Dossiê</button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <h3 className="text-xl font-bold text-slate-900">Cadastrar Novo Cliente</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-2">
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                                <input value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                                <select value={newClient.type} onChange={e => setNewClient({ ...newClient, type: e.target.value as any })} className="w-full p-3 border border-slate-200 rounded-lg">
                                    <option value="PF">Pessoa Física</option>
                                    <option value="PJ">Pessoa Jurídica</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">CPF / CNPJ</label>
                                <input value={newClient.cpf_cnpj} onChange={e => setNewClient({ ...newClient, cpf_cnpj: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">RG / IE</label>
                                <input value={newClient.rg} onChange={e => setNewClient({ ...newClient, rg: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Estado Civil</label>
                                <input value={newClient.civil_status} onChange={e => setNewClient({ ...newClient, civil_status: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Profissão</label>
                                <input value={newClient.profession} onChange={e => setNewClient({ ...newClient, profession: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                                <input value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Endereço Completo</label>
                                <input value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                <input value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Notas Internas</label>
                                <textarea value={newClient.notes} onChange={e => setNewClient({ ...newClient, notes: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg h-24" />
                            </div>
                        </div>

                        <div className="mt-8">
                            <button onClick={handleSaveClient} disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                Salvar Cliente no Banco de Dados
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ToolDocs: React.FC = () => {
    const { smartDocs, addSmartDoc, crmClients } = useApp();
    const [uploading, setUploading] = useState(false);
    const [selectedClient, setSelectedClient] = useState('');

    // Filtros de pesquisa
    const [filterName, setFilterName] = useState('');
    const [filterClientId, setFilterClientId] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterTag, setFilterTag] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            const file = e.target.files[0];
            const aiData = await autoTagDocument(file.name);

            await addSmartDoc({
                name: file.name,
                type: aiData.type as any,
                tags: aiData.tags,
                version: 1,
                size: (file.size / 1024).toFixed(2) + ' KB',
                url: '#', // Em um app real, seria o link do Storage
                clientId: selectedClient || undefined
            });

            setUploading(false);
            setSelectedClient('');
        }
    };

    const handleDownload = async (doc: SmartDoc) => {
        try {
            if (doc.url && doc.url !== '#') {
                // Download de URL existente no Supabase
                const response = await fetch(doc.url);
                if (!response.ok) throw new Error('Erro ao baixar arquivo');

                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = doc.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(blobUrl);
            } else {
                // Documento sem URL: gerar arquivo de exemplo ou exportar conteúdo
                // Cria um arquivo de texto com informações do documento
                const content = `Documento: ${doc.name}
Tipo: ${doc.type}
Cliente: ${doc.clientName || 'N/A'}
Data: ${new Date(doc.date).toLocaleDateString('pt-BR')}
Versão: ${doc.version}
Tags: ${doc.tags.join(', ')}

---
Este é um documento gerado pelo SocialJurídico.
Para documentos finalizados com conteúdo completo, acesse a plataforma.`;

                const blob = new Blob([content], { type: 'text/plain' });
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = doc.name.endsWith('.txt') ? doc.name : `${doc.name}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(blobUrl);
            }
        } catch (error) {
            console.error('Erro ao fazer download:', error);
            alert('Erro ao fazer download do arquivo. Tente novamente.');
        }
    };

    // Aplicar filtros aos documentos
    const filteredDocs = smartDocs.filter(doc => {
        // Filtro por nome
        if (filterName && !doc.name.toLowerCase().includes(filterName.toLowerCase())) {
            return false;
        }

        // Filtro por cliente
        if (filterClientId && doc.clientId !== filterClientId) {
            return false;
        }

        // Filtro por tipo
        if (filterType && doc.type !== filterType) {
            return false;
        }

        // Filtro por tag
        if (filterTag && !doc.tags.some(t => t.toLowerCase().includes(filterTag.toLowerCase()))) {
            return false;
        }

        // Filtro por data (intervalo)
        if (filterDateFrom || filterDateTo) {
            const docDate = new Date(doc.date);
            if (filterDateFrom) {
                const fromDate = new Date(filterDateFrom);
                if (docDate < fromDate) return false;
            }
            if (filterDateTo) {
                const toDate = new Date(filterDateTo);
                toDate.setHours(23, 59, 59, 999); // Até fim do dia
                if (docDate > toDate) return false;
            }
        }

        return true;
    });

    // Limpar todos os filtros
    const handleClearFilters = () => {
        setFilterName('');
        setFilterClientId('');
        setFilterType('');
        setFilterTag('');
        setFilterDateFrom('');
        setFilterDateTo('');
    };

    // Obter lista de tipos únicos para dropdown
    const uniqueTypes = Array.from(new Set(smartDocs.map(d => d.type)));

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Gerenciador de Documentos</h2>
                    <p className="text-slate-500">IA detecta tipos e organiza automaticamente.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={selectedClient}
                        onChange={e => setSelectedClient(e.target.value)}
                        className="p-2 border border-slate-300 rounded-lg text-sm"
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

            {/* FERRAMENTA DESCRIPTION CARD */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl flex-shrink-0">
                        <Folders className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">O que você pode fazer:</h3>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3">
                            Faça upload de documentos jurídicos e deixe a IA organizá-los automaticamente. Sistema detecta tipo de documento (petição, contrato, sentença), gera tags relevantes e vincula ao cliente correspondente. Busca rápida e armazenamento centralizado de toda sua documentação.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-purple-700 font-bold border border-purple-200">🤖 Detecção IA</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-purple-700 font-bold border border-purple-200">📑 Tagging Auto</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-purple-700 font-bold border border-purple-200">🔗 Vincular Cliente</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-purple-700 font-bold border border-purple-200">🔍 Busca Rápida</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTROS DE PESQUISA */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center">
                        <Search className="w-5 h-5 mr-2 text-indigo-600" />
                        Filtros de Pesquisa
                    </h3>
                    <button
                        onClick={handleClearFilters}
                        className="text-xs font-bold px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-white transition"
                    >
                        ✕ Limpar Filtros
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    {/* Filtro Nome */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Nome do Arquivo</label>
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            value={filterName}
                            onChange={e => setFilterName(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Filtro Cliente */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Cliente</label>
                        <select
                            value={filterClientId}
                            onChange={e => setFilterClientId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Todos</option>
                            {crmClients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Tipo */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Tipo</label>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Todos</option>
                            {uniqueTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Tag */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Tag</label>
                        <input
                            type="text"
                            placeholder="Pesquisar tag..."
                            value={filterTag}
                            onChange={e => setFilterTag(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Filtro Data De */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Data De</label>
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={e => setFilterDateFrom(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Filtro Data Até */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Data Até</label>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={e => setFilterDateTo(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* Indicador de resultados */}
                <div className="mt-3 text-xs text-slate-500">
                    <span className="font-bold text-indigo-600">{filteredDocs.length}</span> documento(s) encontrado(s)
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Cliente Vinculado</th>
                            <th className="p-4">Tipo (IA)</th>
                            <th className="p-4">Tags</th>
                            <th className="p-4">Data</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {uploading && (
                            <tr><td colSpan={6} className="p-8 text-center text-indigo-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /> Processando com IA...</td></tr>
                        )}
                        {filteredDocs.length === 0 && !uploading && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">
                                {smartDocs.length === 0 ? 'Nenhum documento. Faça upload para testar a IA.' : 'Nenhum documento corresponde aos filtros aplicados.'}
                            </td></tr>
                        )}
                        {filteredDocs.map(doc => {
                            const clientName = crmClients.find(c => c.id === doc.clientId)?.name;
                            return (
                                <tr key={doc.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-800 flex items-center"><FileText className="w-4 h-4 mr-2 text-slate-400" /> {doc.name}</td>
                                    <td className="p-4 text-slate-600">{clientName ? <span className="flex items-center"><UserIcon className="w-3 h-3 mr-1" /> {clientName}</span> : '-'}</td>
                                    <td className="p-4"><span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{doc.type}</span></td>
                                    <td className="p-4 flex gap-1 flex-wrap">
                                        {doc.tags.map(t => <span key={t} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] border border-slate-200">#{t}</span>)}
                                    </td>
                                    <td className="p-4 text-slate-500">{new Date(doc.date).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                            title="Baixar Documento"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ToolJuris: React.FC = () => {
    const { crmClients } = useApp();
    const { handleClick: recordClick } = useClickLimit();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<JurisprudenceResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [selectedResult, setSelectedResult] = useState<JurisprudenceResult | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    // Filtros avançados
    const [filterTribunal, setFilterTribunal] = useState('');
    const [filterAno, setFilterAno] = useState('');
    const [filterDesfecho, setFilterDesfecho] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const areasJurisprudencia = [
        'Trabalhista', 'Civil', 'Família', 'Penal', 'Tributário',
        'Administrativo', 'Previdenciário', 'Ambiental', 'Consumidor', 'Imobiliário'
    ];

    const tribunaisComuns = [
        'STF', 'STJ', 'TST', 'TRF', 'TJSP', 'TJRJ', 'TJMG', 'TJBA', 'TJRS'
    ];

    const handleSearch = async () => {
        if (!query) return;
        if (!recordClick()) return;
        setLoading(true);
        try {
            const data = await searchJurisprudence(query);
            setResults(data as any);
            setSearchHistory(prev => {
                const updated = [query, ...prev.filter(h => h !== query)].slice(0, 10);
                return updated;
            });
            setShowAnalysis(false);
            setSelectedResult(null);
        } catch (error) {
            console.error('Erro na busca:', error);
            alert('Erro ao buscar jurisprudência');
        } finally {
            setLoading(false);
        }
    };

    const handleAIAnalysis = async (result: JurisprudenceResult) => {
        if (!recordClick()) return;
        setSelectedResult(result);
        setAnalysisLoading(true);
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + (process.env.REACT_APP_GEMINI_API_KEY || ''), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Analise este caso jurisprudencial e forneça:
1. Resumo executivo (2-3 linhas)
2. Impacto na estratégia processual (pontos fortes/fracos)
3. Precedentes relevantes relacionados
4. Recomendação de uso (para meu caso)
5. Taxa de aplicabilidade (%)

Caso: ${result.summary}
Tribunal: ${result.court}
Desfecho: ${result.outcome}
Relevância: ${result.relevance}%`
                        }]
                    }]
                })
            });
            const data = await response.json();
            setAiAnalysis(data.candidates?.[0]?.content?.parts?.[0]?.text || 'Análise não disponível');
            setShowAnalysis(true);
        } catch (error) {
            console.error('Erro na análise AI:', error);
            setAiAnalysis('Erro ao gerar análise. Verifique a configuração da API Gemini.');
        } finally {
            setAnalysisLoading(false);
        }
    };

    // Estatísticas dos resultados
    const stats = {
        total: results.length,
        favoraveis: results.filter(r => r.outcome === 'Favorável').length,
        desfavoraveis: results.filter(r => r.outcome === 'Desfavorável').length,
        taxaVitoria: results.length > 0 ? Math.round((results.filter(r => r.outcome === 'Favorável').length / results.length) * 100) : 0,
        relevanciaMedia: results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.relevance, 0) / results.length) : 0
    };

    // Filtrar resultados
    const filteredResults = results.filter(r => {
        if (filterTribunal && !(r.tribunal || r.court || '').includes(filterTribunal)) return false;
        if (filterAno && !((r.ano || r.year) || '').toString().includes(filterAno)) return false;
        if (filterDesfecho && (r.resultado || r.outcome) !== filterDesfecho) return false;
        if (filterArea && !((r.area as any) || '').includes(filterArea)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-slate-900">Inteligência Jurisprudencial AI</h2>
                <p className="text-slate-500">Análise avançada com IA + Filtros inteligentes + Estatísticas</p>
            </header>

            {/* FERRAMENTA DESCRIPTION CARD */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl flex-shrink-0">
                        <Scale className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">⚖️ Análise Inteligente de Jurisprudência</h3>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3">
                            Busque jurisprudência com filtros avançados (tribunal, ano, área), receba análise AI em tempo real sobre estratégia processual, tendências jurídicas e precedentes. Identifique win rates, compare casos semelhantes e tome decisões baseadas em dados.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-amber-700 font-bold border border-amber-200">🤖 Análise AI</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-amber-700 font-bold border border-amber-200">🔍 Filtros +</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-amber-700 font-bold border border-amber-200">📊 Win Rate</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-amber-700 font-bold border border-amber-200">📈 Tendências</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-amber-700 font-bold border border-amber-200">💡 Insights</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex gap-3 flex-col md:flex-row">
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Ex: Dano moral extravio bagagem, rescisão trabalhista, indenização..."
                        className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-amber-600 text-white px-8 rounded-xl font-bold hover:bg-amber-700 transition flex items-center justify-center whitespace-nowrap"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
                        Pesquisar
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="border border-slate-300 text-slate-600 px-4 rounded-xl font-bold hover:bg-slate-50 transition flex items-center"
                    >
                        <Filter className="w-5 h-5 mr-2" />
                        Filtros
                    </button>
                </div>

                {/* Histórico */}
                {searchHistory.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-2">BUSCAS RECENTES</p>
                        <div className="flex flex-wrap gap-2">
                            {searchHistory.map((h, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setQuery(h); }}
                                    className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200 hover:bg-amber-100 transition"
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-amber-600" />
                            Filtros Avançados
                        </h3>
                        <button onClick={() => { setFilterTribunal(''); setFilterAno(''); setFilterDesfecho(''); setFilterArea(''); }} className="text-xs px-3 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50">
                            Limpar Filtros
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-2 block">Tribunal</label>
                            <select value={filterTribunal} onChange={e => setFilterTribunal(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                                <option value="">Todos</option>
                                {tribunaisComuns.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-2 block">Ano</label>
                            <input type="text" value={filterAno} onChange={e => setFilterAno(e.target.value)} placeholder="Ex: 2024" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-2 block">Desfecho</label>
                            <select value={filterDesfecho} onChange={e => setFilterDesfecho(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                                <option value="">Todos</option>
                                <option value="Favorável">Favorável</option>
                                <option value="Desfavorável">Desfavorável</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 mb-2 block">Área do Direito</label>
                            <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                                <option value="">Todas</option>
                                {areasJurisprudencia.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics Dashboard */}
            {results.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-blue-600 uppercase">Total</p>
                        <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                        <p className="text-xs text-blue-600 mt-1">Casos encontrados</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-green-600 uppercase">Favoráveis</p>
                        <p className="text-3xl font-bold text-green-900">{stats.favoraveis}</p>
                        <p className="text-xs text-green-600 mt-1">Vitórias</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-red-600 uppercase">Desfavoráveis</p>
                        <p className="text-3xl font-bold text-red-900">{stats.desfavoraveis}</p>
                        <p className="text-xs text-red-600 mt-1">Perdas</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-purple-600 uppercase">Win Rate</p>
                        <p className="text-3xl font-bold text-purple-900">{stats.taxaVitoria}%</p>
                        <p className="text-xs text-purple-600 mt-1">Taxa de êxito</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-amber-600 uppercase">Relevância</p>
                        <p className="text-3xl font-bold text-amber-900">{stats.relevanciaMedia}%</p>
                        <p className="text-xs text-amber-600 mt-1">Média</p>
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="grid gap-4">
                {filteredResults.length === 0 && results.length > 0 && (
                    <div className="text-center py-8 text-slate-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum resultado corresponde aos filtros aplicados.</p>
                    </div>
                )}
                {filteredResults.map((res, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-xs">{res.tribunal || res.court}</span>
                                    {res.numero_processo && <span className="text-xs text-slate-500">📋 {res.numero_processo}</span>}
                                    {(res.ano || res.year) && <span className="text-xs text-slate-500">📅 {res.ano || res.year}</span>}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${(res.resultado || res.outcome) === 'Favorável' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {(res.resultado || res.outcome) === 'Favorável' ? '✓ Favorável' : '✗ Desfavorável'}
                                </span>
                            </div>
                            <p className="text-slate-900 font-semibold mb-2">{res.resumo || res.summary}</p>
                            <p className="text-slate-600 text-sm mb-4">{res.details}</p>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-amber-600 h-full" style={{ width: `${res.relevancia || res.relevance}%` }}></div>
                                </div>
                                <span className="text-xs font-bold text-amber-600">{res.relevancia || res.relevance}% Relevância</span>
                            </div>
                            <button
                                onClick={() => handleAIAnalysis(res)}
                                disabled={analysisLoading && selectedResult === res}
                                className="w-full bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 transition text-sm flex items-center justify-center"
                            >
                                {analysisLoading && selectedResult === res ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analisando com AI...</>
                                ) : (
                                    <><BrainCircuit className="w-4 h-4 mr-2" /> Análise AI Completa</>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Analysis Modal */}
            {showAnalysis && selectedResult && aiAnalysis && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-in zoom-in">
                        <div className="sticky top-0 bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                <BrainCircuit className="w-5 h-5 mr-2 text-amber-600" />
                                Análise AI do Precedente
                            </h3>
                            <button onClick={() => setShowAnalysis(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">{aiAnalysis}</p>
                            </div>
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                                <p className="text-xs font-bold text-amber-600 mb-2">📌 RECOMENDAÇÃO DE USO</p>
                                <p className="text-sm text-slate-700">Este precedente apresenta {selectedResult.relevance}% de relevância. Considere citá-lo como jurisprudência pacífica em sua inicial ou petição intermediária.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowAnalysis(false)} className="flex-1 bg-slate-100 text-slate-900 px-4 py-3 rounded-lg font-bold hover:bg-slate-200 transition">
                                    Fechar
                                </button>
                                <button onClick={() => { alert('📋 Copiado para clipboard'); navigator.clipboard.writeText(aiAnalysis); }} className="flex-1 bg-amber-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-amber-700 transition flex items-center justify-center">
                                    <Copy className="w-4 h-4 mr-2" /> Copiar Análise
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ToolWriter: React.FC = () => {
    const { crmClients, addSmartDoc } = useApp();

    // Carregar estado persistido do localStorage
    const loadPersistedState = () => {
        try {
            const saved = localStorage.getItem('toolWriter_state');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Erro ao carregar estado persistido:', e);
        }
        return null;
    };

    const persistedState = loadPersistedState();

    const [config, setConfig] = useState(persistedState?.config || { type: 'Peticao Inicial', clientName: '', facts: '', tone: 'Formal' });
    const [result, setResult] = useState(persistedState?.result || '');
    const [loading, setLoading] = useState(false);
    const [savingToSmartDocs, setSavingToSmartDocs] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Salvar estado no localStorage sempre que muda
    useEffect(() => {
        const stateToSave = { config, result };
        localStorage.setItem('toolWriter_state', JSON.stringify(stateToSave));
    }, [config, result]);

    const handleGenerate = async () => {
        setLoading(true);
        const text = await generateLegalDraft(config);
        setResult(text);
        setLoading(false);
    };

    const handleSelectClient = (clientId: string) => {
        const client = crmClients.find(c => c.id === clientId);
        if (client) {
            const clientContext = `Cliente: ${client.name}, CPF: ${client.cpf_cnpj || 'N/A'}, Endereço: ${client.address || 'N/A'}`;
            setConfig(prev => ({ ...prev, clientName: client.name, facts: clientContext + "\n\n" + prev.facts }));
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        alert('Minuta copiada para clipboard!');
    };

    const handleExportTxt = () => {
        if (!result) return;
        const fileName = `${config.type}_${config.clientName}_${new Date().toISOString().split('T')[0]}.txt`;
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(result));
        element.setAttribute('download', fileName);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleExportPDF = () => {
        if (!result) return;

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
                <div class="content">${result}</div>
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

    const handleSaveToSmartDocs = async () => {
        if (!result) {
            alert('Nenhuma minuta gerada para salvar');
            return;
        }

        setSavingToSmartDocs(true);
        try {
            const fileName = `${config.type}_${config.clientName}_${new Date().toISOString().split('T')[0]}.txt`;
            const sizeInKB = result.length / 1024;

            let smartDocType: 'Peticao' | 'Contrato' | 'Sentenca' | 'Procuracao' | 'Outros' = 'Outros';
            if (config.type.toLowerCase().includes('peticao')) smartDocType = 'Peticao';
            else if (config.type.toLowerCase().includes('contrato')) smartDocType = 'Contrato';
            else if (config.type.toLowerCase().includes('sentenca')) smartDocType = 'Sentenca';
            else if (config.type.toLowerCase().includes('procuracao')) smartDocType = 'Procuracao';

            // Encode UTF-8 string to base64 (handles accents and special characters)
            const utf8String = unescape(encodeURIComponent(result));
            const base64String = btoa(utf8String);

            await addSmartDoc({
                name: fileName,
                type: smartDocType,
                tags: [config.type, config.tone, 'Redator IA'],
                version: 1,
                size: sizeInKB.toFixed(2) + ' KB',
                url: `data:text/plain;base64,${base64String}`
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

    return (
        <div className="space-y-6">
            {/* Índice de Preços de Mercado - Importar MarketPricesIndex */}
            <MarketPricesIndex />

            {/* FERRAMENTA DESCRIPTION CARD */}
            <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-rose-100 rounded-xl flex-shrink-0">
                        <PenTool className="w-6 h-6 text-rose-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">O que você pode fazer:</h3>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3">
                            Gere minutas jurídicas completas com um clique usando inteligência artificial. Configure tipo de peça, tom de voz, dados do cliente (puxados do CRM) e descrição dos fatos. Sistema gera peça profissional, estruturada e pronta para uso. Economize horas de redação.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-rose-700 font-bold border border-rose-200">✍️ Geração IA</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-rose-700 font-bold border border-rose-200">🎯 Múltiplos Tipos</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-rose-700 font-bold border border-rose-200">🗣️ Tom Customizável</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-rose-700 font-bold border border-rose-200">⚡ Instantâneo</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-240px)]">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 overflow-y-auto">
                    <h3 className="font-bold text-lg mb-6 flex items-center"><PenTool className="w-5 h-5 mr-2 text-indigo-500" /> Configuração da Minuta</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Peça</label>
                            <select className="w-full p-2 border rounded-lg" value={config.type} onChange={e => setConfig({ ...config, type: e.target.value })}>
                                <option>Petição Inicial</option>
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
                            <label className="block text-sm font-bold text-slate-700 mb-1">Puxar do CRM</label>
                            <select className="w-full p-2 border rounded-lg mb-2" onChange={e => handleSelectClient(e.target.value)}>
                                <option value="">-- Selecionar Cliente --</option>
                                {crmClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Cliente (Manual)</label>
                            <input className="w-full p-2 border rounded-lg" value={config.clientName} onChange={e => setConfig({ ...config, clientName: e.target.value })} placeholder="Nome do cliente" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Tons de Personalidade</label>
                            <select className="w-full p-2 border rounded-lg" value={config.tone} onChange={e => setConfig({ ...config, tone: e.target.value })}>
                                <option>Formal</option>
                                <option>Agressivo</option>
                                <option>Conciliador</option>
                                <option>Técnico</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Fatos / Resumo</label>
                            <textarea className="w-full p-2 border rounded-lg h-32" value={config.facts} onChange={e => setConfig({ ...config, facts: e.target.value })} placeholder="Descreva os fatos principais..." />
                        </div>
                        <button onClick={handleGenerate} disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">
                            {loading ? 'Escrevendo...' : 'Gerar Minuta com IA'}
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    {/* Toolbar com botões */}
                    {result && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-lg">
                            <p className="text-sm font-bold text-slate-700 mb-3">Ações da Minuta:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                <button onClick={handleCopy} className="bg-slate-600 text-white py-2 px-3 rounded-lg font-bold hover:bg-slate-700 transition flex items-center justify-center gap-2 text-xs">
                                    <Copy className="w-4 h-4" /> Copiar
                                </button>
                                <button onClick={handleExportPDF} className="bg-slate-600 text-white py-2 px-3 rounded-lg font-bold hover:bg-slate-700 transition flex items-center justify-center gap-2 text-xs">
                                    <Printer className="w-4 h-4" /> PDF
                                </button>
                                <button onClick={handleExportTxt} className="bg-slate-600 text-white py-2 px-3 rounded-lg font-bold hover:bg-slate-700 transition flex items-center justify-center gap-2 text-xs">
                                    <Download className="w-4 h-4" /> TXT
                                </button>
                                <button onClick={handleSaveToSmartDocs} disabled={savingToSmartDocs} className="bg-green-600 text-white py-2 px-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs">
                                    {savingToSmartDocs ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Salvando</>
                                    ) : (
                                        <><Save className="w-4 h-4" /> SmartDocs</>
                                    )}
                                </button>
                            </div>
                            {saveSuccess && (
                                <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <div className="text-sm">
                                        <p className="font-bold text-green-900">Sucesso!</p>
                                        <p className="text-xs text-green-700">Minuta salva no SmartDocs</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Area da minuta */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap flex-1">
                        {result || <span className="text-slate-400 italic">A minuta gerada aparecerá aqui...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SystemDocumentation: React.FC = () => {
    const [tab, setTab] = useState('overview');

    return (
        <div className="space-y-6 p-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl">
                <h1 className="text-3xl font-bold mb-2">📖 Documentação do SocialJurídico</h1>
                <p className="text-indigo-100">Guia completo para dominar a plataforma e potencializar sua prática jurídica</p>
            </div>

            <div className="flex flex-wrap gap-2">
                <button onClick={() => setTab('overview')} className={`px-4 py-2 rounded-lg font-bold ${tab === 'overview' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Visão Geral</button>
                <button onClick={() => setTab('marketplace')} className={`px-4 py-2 rounded-lg font-bold ${tab === 'marketplace' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Marketplace</button>
                <button onClick={() => setTab('tools')} className={`px-4 py-2 rounded-lg font-bold ${tab === 'tools' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Ferramentas</button>
                <button onClick={() => setTab('updates')} className={`px-4 py-2 rounded-lg font-bold ${tab === 'updates' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Atualizações</button>
                <button onClick={() => setTab('tutoriais')} className={`px-4 py-2 rounded-lg font-bold ${tab === 'tutoriais' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Tutoriais</button>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200">
                {tab === 'overview' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold mb-6 text-slate-900">O que é SocialJurídico? 🏛️</h2>

                        <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-lg mb-6">
                            <p className="text-slate-800 leading-relaxed text-base">
                                <strong>SocialJuridico</strong> é uma plataforma jurídica revolucionária que democratiza o acesso à Justiça,
                                conectando clientes a advogados especializados em toda a nação. Desenvolvida com <strong>Inteligência Artificial avançada</strong>,
                                oferece ferramentas profissionais que automatizam processos, economizam tempo e potencializam resultados.
                                Seja um cliente em busca de representação ou um advogado expandindo seu portfólio,
                                o SocialJuridico é seu aliado estratégico na carreira jurídica.
                            </p>
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Como Funciona</h3>
                        <p className="text-slate-700 mb-6 leading-relaxed">
                            O SocialJuridico funciona como um intermediário transparente entre clientes que precisam de serviços jurídicos
                            e advogados que desejam expandir seus negócios. A plataforma gerencia todo o ciclo de vida de um case,
                            desde a publicação até a conclusão, com segurança, rastreabilidade e profissionalismo.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg hover:shadow-lg transition">
                                <h4 className="font-bold text-blue-900 mb-4 text-lg">👥 Portal do Cliente</h4>
                                <ul className="text-sm text-blue-800 space-y-2.5 leading-relaxed">
                                    <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">✓</span> <span><strong>Publicar Casos:</strong> Descreva seu problema jurídico e encontre especialistas qualificados</span></li>
                                    <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">✓</span> <span><strong>Chat Seguro:</strong> Comunique-se diretamente com advogados na plataforma</span></li>
                                    <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">✓</span> <span><strong>Avaliações:</strong> Deixe comentários sobre profissionais e construa reputação</span></li>
                                    <li className="flex items-start gap-2"><span className="text-blue-600 font-bold">✓</span> <span><strong>Histórico Completo:</strong> Acompanhe todos seus casos em um único lugar</span></li>
                                </ul>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg hover:shadow-lg transition">
                                <h4 className="font-bold text-purple-900 mb-4 text-lg">⚖️ Portal do Advogado PRO</h4>
                                <ul className="text-sm text-purple-800 space-y-2.5 leading-relaxed">
                                    <li className="flex items-start gap-2"><span className="text-purple-600 font-bold">✓</span> <span><strong>Marketplace de Casos:</strong> Acesso a casos jurídicos pré-qualificados</span></li>
                                    <li className="flex items-start gap-2"><span className="text-purple-600 font-bold">✓</span> <span><strong>Ferramentas IA:</strong> Redator, Jurisprudência, CRM, Agenda, Calculadora</span></li>
                                    <li className="flex items-start gap-2"><span className="text-purple-600 font-bold">✓</span> <span><strong>Gestão de Clientes:</strong> CRM com análise de risco e geração de perfil</span></li>
                                    <li className="flex items-start gap-2"><span className="text-purple-600 font-bold">✓</span> <span><strong>Ampliar Receita:</strong> Crescer cartela sem investimento em marketing</span></li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-300 p-6 rounded-lg mt-6">
                            <h4 className="font-bold text-green-900 mb-4 text-lg">🎯 Por que usar SocialJuridico?</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                                <div><strong>⚡ Economia de Tempo:</strong> IA automatiza tarefas burocráticas repetitivas</div>
                                <div><strong>💼 Profissionalismo:</strong> Documentos em nível enterprise com fundamentação jurídica</div>
                                <div><strong>🔐 Segurança:</strong> Dados protegidos com criptografia de ponta</div>
                                <div><strong>🌍 Alcance Nacional:</strong> Conecte com clientes e colegas em toda a nação</div>
                                <div><strong>💰 ROI Comprovado:</strong> Advogados aumentam faturamento em média 300%</div>
                                <div><strong>📊 Transparência:</strong> Todos os valores, prazos e responsabilidades documentados</div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-300 p-6 rounded-lg mt-6">
                            <h4 className="font-bold text-yellow-900 mb-2">💡 Diferencial SocialJuridico:</h4>
                            <p className="text-sm text-yellow-800">
                                Diferente de outros marketplaces, o SocialJuridico oferece ferramentas IA integradas que multiplicam
                                a eficiência dos advogados. Não é apenas um portal de anúncios — é um ecossistema completo de trabalho.
                            </p>
                        </div>
                    </div>
                )}

                {tab === 'marketplace' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold mb-6 text-slate-900">Como Funciona o Marketplace? 🛍️</h2>

                        <div className="bg-amber-50 border border-amber-300 p-6 rounded-lg mb-6">
                            <p className="text-slate-800 leading-relaxed">
                                O SocialJuridico funciona como um <strong>marketplace profissional</strong> que segue um fluxo intuitivo e transparente.
                                Cada interação é registrada, facilitando o rastreamento e garantindo qualidade em toda a jornada.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="border-l-4 border-blue-600 bg-blue-50 p-5 rounded-lg hover:shadow-md transition">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">1</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-blue-900 text-base mb-2">Cliente Publica um Caso</h4>
                                        <p className="text-sm text-blue-800 leading-relaxed">
                                            O cliente acessa a plataforma e cria um novo caso, fornecendo informações detalhadas sobre seu problema jurídico.
                                            Pode incluir documentos, fotos e contexto completo. A IA automaticamente classifica a categoria (trabalhista, civil, penal, etc.)
                                            e estima a complexidade. O caso é listado no marketplace com visibilidade total para advogados qualificados.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-l-4 border-purple-600 bg-purple-50 p-5 rounded-lg hover:shadow-md transition">
                                <div className="flex items-start gap-3">
                                    <div className="bg-purple-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">2</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-purple-900 text-base mb-2">Advogados Visualizam Casos Disponíveis</h4>
                                        <p className="text-sm text-purple-800 leading-relaxed">
                                            Advogados assinantes (plano PRO) acessam uma dashboard com todos os casos abertos na plataforma.
                                            Podem filtrar por área de expertise, localização, urgência e valor estimado.
                                            Cada caso mostra um resumo detalhado, histórico do cliente, análise de viabilidade gerada pela IA.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-l-4 border-green-600 bg-green-50 p-5 rounded-lg hover:shadow-md transition">
                                <div className="flex items-start gap-3">
                                    <div className="bg-green-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">3</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-green-900 text-base mb-2">Advogado Manifesta Interesse</h4>
                                        <p className="text-sm text-green-800 leading-relaxed">
                                            Quando encontra um caso de seu interesse, o advogado clica em "Manifestar Interesse".
                                            Neste momento, pode enviar uma proposta com sua abordagem estratégica, estimativa de honorários
                                            e cronograma esperado. A plataforma notifica o cliente sobre o novo interessado automaticamente.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-l-4 border-red-600 bg-red-50 p-5 rounded-lg hover:shadow-md transition">
                                <div className="flex items-start gap-3">
                                    <div className="bg-red-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">4</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-900 text-base mb-2">Cliente Escolhe o Advogado</h4>
                                        <p className="text-sm text-red-800 leading-relaxed">
                                            O cliente avalia os advogados interessados, verifica suas avaliações, especialidade e propostas.
                                            Pode conversar com múltiplos candidatos através de chat e então seleciona aquele que melhor se adequa ao seu caso.
                                            Neste momento, o caso é removido do marketplace para evitar duplicidades.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-l-4 border-indigo-600 bg-indigo-50 p-5 rounded-lg hover:shadow-md transition">
                                <div className="flex items-start gap-3">
                                    <div className="bg-indigo-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">5</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-indigo-900 text-base mb-2">Chat Ativo e Desenvolvimento do Caso</h4>
                                        <p className="text-sm text-indigo-800 leading-relaxed">
                                            Advogado e cliente iniciam comunicação permanente via chat integrado. O advogado pode usar
                                            todas as ferramentas PRO para análise jurídica, pesquisa jurisprudencial, redação de peças profissionais,
                                            e compartilhar documentos com o cliente diretamente na plataforma de forma segura.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-l-4 border-emerald-600 bg-emerald-50 p-5 rounded-lg hover:shadow-md transition">
                                <div className="flex items-start gap-3">
                                    <div className="bg-emerald-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">6</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-emerald-900 text-base mb-2">Caso Finalizado com Avaliação</h4>
                                        <p className="text-sm text-emerald-800 leading-relaxed">
                                            Quando o caso é concluído (sentença proferida, acordo celebrado, etc.), o cliente avalia o trabalho do advogado
                                            em uma escala de 5 estrelas com comentário detalhado. Esta avaliação fica registrada no perfil público do profissional,
                                            construindo reputação e confiança na plataforma.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-300 p-6 rounded-lg mt-6">
                            <h4 className="font-bold text-yellow-900 mb-3">💡 Garantias do Marketplace:</h4>
                            <ul className="text-sm text-yellow-800 space-y-2">
                                <li>✓ <strong>Transparência Total:</strong> Todos os valores, prazos e responsabilidades documentados</li>
                                <li>✓ <strong>Segurança de Dados:</strong> Criptografia de ponta a ponta em toda comunicação</li>
                                <li>✓ <strong>Rastreamento Completo:</strong> Histórico de todas as interações preservado</li>
                                <li>✓ <strong>Proteção de Ambas as Partes:</strong> Sistema de avaliação e feedback construindo confiança</li>
                            </ul>
                        </div>
                    </div>
                )}

                {tab === 'tools' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold mb-6 text-slate-900">Ferramentas PRO - Seu Assistente Jurídico 24/7 🚀</h2>

                        <p className="text-slate-700 text-base leading-relaxed bg-slate-50 p-4 rounded-lg">
                            Cada ferramenta foi desenvolvida com especialistas jurídicos e alimentada com jurisprudência brasileira atualizada.
                            Funcionam integradas entre si, criando um fluxo de trabalho eficiente. Acesso ilimitado para planos PRO.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="bg-blue-50 border-2 border-blue-300 p-6 rounded-lg hover:shadow-lg transition">
                                <p className="font-bold text-lg mb-3 text-blue-900">📄 Redator IA Jurídico</p>
                                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                                    Gera peças jurídicas profissionais com múltiplos tons: formal, técnico ou persuasivo.
                                    Inclui fundamentação legal, jurisprudência e argumentações estruturadas. Suporta todas as áreas.
                                </p>
                                <div className="text-xs text-slate-600 space-y-1.5 bg-white p-3 rounded">
                                    <p className="font-bold text-blue-900">Documentos suportados:</p>
                                    <li>✓ Petições iniciais (cível, penal, trabalhista)</li>
                                    <li>✓ Recursos (apelação, embargos, agravo)</li>
                                    <li>✓ Manifestações e pareceres jurídicos</li>
                                    <li>✓ Contratos e acordos</li>
                                    <li>✓ Moções e requerimentos</li>
                                </div>
                            </div>

                            <div className="bg-green-50 border-2 border-green-300 p-6 rounded-lg hover:shadow-lg transition">
                                <p className="font-bold text-lg mb-3 text-green-900">📊 Agenda Inteligente</p>
                                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                                    Otimiza prazos judiciários com sugestões inteligentes baseadas no tipo de processo.
                                    Inclui detecção de conflitos, alertas automáticos e relatórios estratégicos de análise.
                                </p>
                                <div className="text-xs text-slate-600 space-y-1.5 bg-white p-3 rounded">
                                    <p className="font-bold text-green-900">Funcionalidades:</p>
                                    <li>✓ Sugestão inteligente de prazos</li>
                                    <li>✓ Detecção automática de conflitos</li>
                                    <li>✓ Alertas 3 dias antes do vencimento</li>
                                    <li>✓ Checklist de preparação por tipo</li>
                                    <li>✓ Análise semanal e mensal</li>
                                </div>
                            </div>

                            <div className="bg-purple-50 border-2 border-purple-300 p-6 rounded-lg hover:shadow-lg transition">
                                <p className="font-bold text-lg mb-3 text-purple-900">👥 CRM com IA</p>
                                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                                    Gerencia toda sua cartela de clientes com análise de risco automática, geração de perfil inteligente,
                                    chat com IA e relatórios detalhados de comportamento e potencial.
                                </p>
                                <div className="text-xs text-slate-600 space-y-1.5 bg-white p-3 rounded">
                                    <p className="font-bold text-purple-900">Recursos:</p>
                                    <li>✓ Análise de risco por cliente</li>
                                    <li>✓ Geração automática de perfil</li>
                                    <li>✓ Chat com IA por cliente</li>
                                    <li>✓ Relatórios de comportamento</li>
                                    <li>✓ Estimativa de valor do cliente</li>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border-2 border-yellow-300 p-6 rounded-lg hover:shadow-lg transition">
                                <p className="font-bold text-lg mb-3 text-yellow-900">💰 Calculadora Jurídica</p>
                                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                                    Calcula automaticamente rescisão, férias, horas extras, correção monetária, juros,
                                    aposentadoria e honorários com precisão fiscal e índices atualizados.
                                </p>
                                <div className="text-xs text-slate-600 space-y-1.5 bg-white p-3 rounded">
                                    <p className="font-bold text-yellow-900">Cálculos disponíveis:</p>
                                    <li>✓ Rescisão completa e parcial</li>
                                    <li>✓ Índices (SELIC, IGPM, INPC, CDI)</li>
                                    <li>✓ Cálculos trabalhistas completos</li>
                                    <li>✓ Previdenciários e aposentadoria</li>
                                    <li>✓ Export em PDF com detalhamento</li>
                                </div>
                            </div>

                            <div className="bg-red-50 border-2 border-red-300 p-6 rounded-lg hover:shadow-lg transition">
                                <p className="font-bold text-lg mb-3 text-red-900">📚 Jurisprudência Inteligente</p>
                                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                                    Busca decisões STJ e STF com análise contextualizada. Encontra jurisprudência pacífica
                                    relevante para sua estratégia processual com fundamentação completa.
                                </p>
                                <div className="text-xs text-slate-600 space-y-1.5 bg-white p-3 rounded">
                                    <p className="font-bold text-red-900">Características:</p>
                                    <li>✓ Busca avançada por tema</li>
                                    <li>✓ Análise contextualizada</li>
                                    <li>✓ Jurisprudência pacífica</li>
                                    <li>✓ Exportar para peça jurídica</li>
                                    <li>✓ Filtrar por área e período</li>
                                </div>
                            </div>

                            <div className="bg-teal-50 border-2 border-teal-300 p-6 rounded-lg hover:shadow-lg transition">
                                <p className="font-bold text-lg mb-3 text-teal-900">🔍 Triagem Automática</p>
                                <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                                    Analisa descrição do cliente e gera diagnóstico completo: viabilidade jurídica,
                                    riscos, pontos fortes e recomendações estratégicas em segundos.
                                </p>
                                <div className="text-xs text-slate-600 space-y-1.5 bg-white p-3 rounded">
                                    <p className="font-bold text-teal-900">Análises geradas:</p>
                                    <li>✓ Viabilidade jurídica do caso</li>
                                    <li>✓ Identificação de riscos</li>
                                    <li>✓ Pontos fortes e fracos</li>
                                    <li>✓ Estratégia recomendada</li>
                                    <li>✓ Estimativa de valor</li>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-300 p-6 rounded-lg mt-6">
                            <h4 className="font-bold text-indigo-900 mb-4 text-lg">🎁 Benefícios Exclusivos do Plano PRO:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-800">
                                <div className="flex items-start gap-2"><span className="text-indigo-600 font-bold">✓</span> Acesso ilimitado a todas as 6 ferramentas</div>
                                <div className="flex items-start gap-2"><span className="text-indigo-600 font-bold">✓</span> Suporte prioritário 24/7 via chat</div>
                                <div className="flex items-start gap-2"><span className="text-indigo-600 font-bold">✓</span> Atualizações jurisprudenciais diárias</div>
                                <div className="flex items-start gap-2"><span className="text-indigo-600 font-bold">✓</span> Templates personalizáveis por área</div>
                                <div className="flex items-start gap-2"><span className="text-indigo-600 font-bold">✓</span> Integração com sistemas externos</div>
                                <div className="flex items-start gap-2"><span className="text-indigo-600 font-bold">✓</span> Relatórios avançados com insights</div>
                                <div className="flex items-start gap-2"><span className="text-indigo-600 font-bold">✓</span> Acesso ao marketplace de casos</div>
                                <div className="flex items-start gap-2"><span className="text-indigo-600 font-bold">✓</span> Armazenamento ilimitado de documentos</div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'updates' && (
                    <div className="space-y-5">
                        <h2 className="text-3xl font-bold mb-6 text-slate-900">✅ Atualizações & Roadmap (Fev/2026)</h2>

                        <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-lg mb-6">
                            <p className="text-slate-800 font-bold mb-2">🎉 Versão 4.1 — Maior atualização do ano!</p>
                            <p className="text-sm text-slate-700">Concentramos esforços em 8 áreas críticas de melhoria. Veja abaixo as novidades que vão transformar sua prática.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-indigo-50 border-2 border-indigo-300 p-5 rounded-lg hover:shadow-md transition">
                                <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2">🚀 <span>Redator IA Aprimorado</span></p>
                                <p className="text-sm text-slate-700 leading-relaxed">Documentos com tons variáveis (formal, persuasivo, técnico). Agora com templates customizáveis por especialidade jurídica e biblioteca expandida de precedentes jurisprudenciais.</p>
                            </div>

                            <div className="bg-indigo-50 border-2 border-indigo-300 p-5 rounded-lg hover:shadow-md transition">
                                <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2">📚 <span>Jurisprudência Contextualizada</span></p>
                                <p className="text-sm text-slate-700 leading-relaxed">Análise profunda de decisões STJ/STF com contexto jurídico. Sistema agora conecta jurisprudência diretamente às suas peças jurídicas com citações automáticas.</p>
                            </div>

                            <div className="bg-indigo-50 border-2 border-indigo-300 p-5 rounded-lg hover:shadow-md transition">
                                <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2">🔍 <span>Triagem com Diagnóstico Completo</span></p>
                                <p className="text-sm text-slate-700 leading-relaxed">Análise automática aprofundada gerando diagnóstico 360°. Inclui viabilidade, riscos, pontos fortes/fracos, estratégia recomendada e estimativa de valor do caso.</p>
                            </div>

                            <div className="bg-indigo-50 border-2 border-indigo-300 p-5 rounded-lg hover:shadow-md transition">
                                <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2">💰 <span>Calculadora com Índices Atualizados</span></p>
                                <p className="text-sm text-slate-700 leading-relaxed">Suporte a IGPM, INPC, CDI, SELIC, TR com atualização diária. Cálculos precisos para trabalho, previdência, civil e comercial com validação fiscal.</p>
                            </div>

                            <div className="bg-indigo-50 border-2 border-indigo-300 p-5 rounded-lg hover:shadow-md transition">
                                <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2">📄 <span>SmartDocs com Download Integrado</span></p>
                                <p className="text-sm text-slate-700 leading-relaxed">Gerenciador de documentos com download instantâneo. Sincronização automática com Google Drive e OneDrive. Versionamento inteligente de arquivos.</p>
                            </div>

                            <div className="bg-indigo-50 border-2 border-indigo-300 p-5 rounded-lg hover:shadow-md transition">
                                <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2">👥 <span>CRM com IA Completa</span></p>
                                <p className="text-sm text-slate-700 leading-relaxed">Gestão de clientes nível enterprise. Relatórios automáticos, chat com IA por cliente, análise de risco, perfil gerado automaticamente e previsão de valor.</p>
                            </div>

                            <div className="bg-indigo-50 border-2 border-indigo-300 p-5 rounded-lg hover:shadow-md transition">
                                <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2">📊 <span>Agenda com 10 Análises</span></p>
                                <p className="text-sm text-slate-700 leading-relaxed">Dashboard de prazos expandida. Análises semanais e mensais, detecção de conflitos, sugestões inteligentes, checklist de preparação e relatórios estratégicos.</p>
                            </div>

                            <div className="bg-indigo-50 border-2 border-indigo-300 p-5 rounded-lg hover:shadow-md transition">
                                <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2">🔔 <span>Notificações com Redirecionamento</span></p>
                                <p className="text-sm text-slate-700 leading-relaxed">Sistema de notificações inteligente com redirecionamento automático. Push, email e SMS coordenados. Customização por tipo de alerta e urgência.</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-300 p-6 rounded-lg mt-6">
                            <h4 className="font-bold text-blue-900 mb-3">🗓️ Próximas Melhorias (Roadmap):</h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li>✓ <strong>Mar/2026:</strong> Integração com sistemas de automação processual (PROJUDI, e-SAJ)</li>
                                <li>✓ <strong>Abr/2026:</strong> Módulo de educação continuada com certificação (12h)​</li>
                                <li>✓ <strong>Mai/2026:</strong> Marketplace B2B para terceirização de tarefas jurídicas</li>
                                <li>✓ <strong>Jun/2026:</strong> API pública para integração com softwares jurídicos</li>
                            </ul>
                        </div>
                    </div>
                )}

                {tab === 'tutoriais' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold mb-6 text-slate-900">Tutoriais & Guia de Uso 🎓</h2>

                        <div className="bg-blue-50 border border-blue-300 p-6 rounded-lg">
                            <h4 className="font-bold text-blue-900 mb-4 text-lg">📖 Para Clientes</h4>
                            <div className="space-y-3">
                                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                                    <p className="font-bold text-slate-900 mb-2">1️⃣ Como Publicar um Caso</p>
                                    <p className="text-sm text-slate-700 mb-2">Acesse seu perfil, clique em "Novo Caso" e preencha os campos com máximo detalhe. Inclua documentos relevantes (fotos, contratos, etc.). A IA automaticamente classifica seu caso.</p>
                                    <p className="text-xs text-slate-600"><strong>Tempo médio:</strong> 5-10 minutos | <strong>Dica:</strong> Quanto mais detalhes, melhores propostas você receberá.</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                                    <p className="font-bold text-slate-900 mb-2">2️⃣ Avaliando Propostas de Advogados</p>
                                    <p className="text-sm text-slate-700 mb-2">Quando advogados se interessarem, você receberá notificação. Verifique o perfil, avaliações, especialidade e propostas. Use o chat para tirar dúvidas antes de escolher.</p>
                                    <p className="text-xs text-slate-600"><strong>Dica importante:</strong> Não escolha apenas pelo menor preço. Verifique experiência, avaliações e compatibilidade.</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                                    <p className="font-bold text-slate-900 mb-2">3️⃣ Comunicando com o Advogado</p>
                                    <p className="text-sm text-slate-700 mb-2">Após contratar, use o chat integrado para manter contato direto. Compartilhe documentos, atualizações e dúvidas neste canal. Tudo fica registrado como prova.</p>
                                    <p className="text-xs text-slate-600"><strong>Lembrete:</strong> Não compartilhe dados sensíveis em redes sociais. Use apenas a plataforma.</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                                    <p className="font-bold text-slate-900 mb-2">4️⃣ Finalizando e Avaliando</p>
                                    <p className="text-sm text-slate-700 mb-2">Quando o caso terminar, você receberá solicitação para avaliação. Deixe comentário honesto e detalhado sobre a experiência. Isso ajuda a comunidade.</p>
                                    <p className="text-xs text-slate-600"><strong>Benefício:</strong> Boas avaliações também ajudam você a receber melhores propostas futuramente.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-300 p-6 rounded-lg">
                            <h4 className="font-bold text-purple-900 mb-4 text-lg">⚖️ Para Advogados PRO</h4>
                            <div className="space-y-3">
                                <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                                    <p className="font-bold text-slate-900 mb-2">1️⃣ Acessando o Marketplace</p>
                                    <p className="text-sm text-slate-700 mb-2">Navegue para "Marketplace de Casos". Filtre por área de expertise, localização, urgência. Clique em um caso para ver análise completa gerada pela IA. Use os filtros avançados para refinar.</p>
                                    <p className="text-xs text-slate-600"><strong>Dica:</strong> Personalize seus filtros na primeira vez para depois acessar rapidamente.</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                                    <p className="font-bold text-slate-900 mb-2">2️⃣ Manifestando Interesse em um Caso</p>
                                    <p className="text-sm text-slate-700 mb-2">Ao encontrar um caso de seu interesse, clique em "Manifestar Interesse". Preencha a proposta com: abordagem estratégica, estimativa de honorários, cronograma. Quanto melhor a proposta, maior chance de ser escolhido.</p>
                                    <p className="text-xs text-slate-600"><strong>Dica ouro:</strong> Demonstre conhecimento específico da área e cite jurisprudência relevante na proposta.</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                                    <p className="font-bold text-slate-900 mb-2">3️⃣ Usando as Ferramentas PRO</p>
                                    <p className="text-sm text-slate-700 mb-2">Após ser escolhido, acesse a aba "Ferramentas" de seu dashboard. Use Redator IA para gerar peças, Jurisprudência para encontrar precedentes, Calculadora para cálculos precisos, CRM para gerenciar cliente.</p>
                                    <p className="text-xs text-slate-600"><strong>Automação:</strong> Usar as ferramentas pode economizar até 70% do tempo em tarefas burocráticas.</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                                    <p className="font-bold text-slate-900 mb-2">4️⃣ Gerenciando sua Cartela no CRM</p>
                                    <p className="text-sm text-slate-700 mb-2">No CRM, registre todos os clientes com seus dados, histórico de casos e análise de risco. Use os relatórios automáticos para identificar oportunidades de up-sell. Chat com IA gera insights por cliente.</p>
                                    <p className="text-xs text-slate-600"><strong>Estratégia:</strong> Clientes satisfeitos tendem a voltar. Invista em bom atendimento.</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                                    <p className="font-bold text-slate-900 mb-2">5️⃣ Crescendo suas Avaliações</p>
                                    <p className="text-sm text-slate-700 mb-2">Cada caso finalizado é uma oportunidade de avaliar. Quanto melhor sua avaliação, mais clientes te procurarão. Respeite prazos, comunique-se bem e entregue resultados.</p>
                                    <p className="text-xs text-slate-600"><strong>Fato:</strong> Advogados com 5⭐ recebem 3x mais propostas que os com 3⭐.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-300 p-6 rounded-lg">
                            <h4 className="font-bold text-green-900 mb-4 text-lg">🎯 Dicas Gerais de Sucesso</h4>
                            <ul className="text-sm text-green-800 space-y-2.5">
                                <li className="flex items-start gap-2"><span className="text-green-600 font-bold">✓</span> <span><strong>Seja Responsivo:</strong> Responda mensagens dentro de 24h. Responsividade é fator crucial no sucesso.</span></li>
                                <li className="flex items-start gap-2"><span className="text-green-600 font-bold">✓</span> <span><strong>Documentação Clara:</strong> Registre tudo na plataforma. Whatsapp e email deixam margem para desentendidos.</span></li>
                                <li className="flex items-start gap-2"><span className="text-green-600 font-bold">✓</span> <span><strong>Use as Ferramentas:</strong> Quanto mais usar IA, mais tempo economiza e melhor qualidade entrega.</span></li>
                                <li className="flex items-start gap-2"><span className="text-green-600 font-bold">✓</span> <span><strong>Comunicação Honesta:</strong> Se um caso é inviável, diga logo. Confiança é construída com honestidade.</span></li>
                                <li className="flex items-start gap-2"><span className="text-green-600 font-bold">✓</span> <span><strong>Atualizações Regulares:</strong> Mantenha cliente informado. Falta de notícias gera ansiedade.</span></li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ToolAgenda: React.FC = () => {
    const { agendaItems, addAgendaItem, updateAgendaItem, deleteAgendaItem, crmClients } = useApp();
    const { handleClick: recordClick } = useClickLimit();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [showPeriodSummary, setShowPeriodSummary] = useState<'semanal' | 'mensal' | null>(null);
    const [periodSummary, setPeriodSummary] = useState<any>(null);
    const [selectedItemForChecklist, setSelectedItemForChecklist] = useState<AgendaItem | null>(null);
    const [checklist, setChecklist] = useState<any>(null);
    const [conflicts, setConflicts] = useState<any>(null);
    const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
    const [upcomingAlerts, setUpcomingAlerts] = useState<AgendaItem[]>([]);

    // Form State
    const [newItem, setNewItem] = useState({
        title: '', date: '', time: '09:00', type: 'Judicial' as any, urgency: 'Média' as any, clientId: '', description: '', suggestedDate: ''
    });
    const [deadlineSuggestion, setDeadlineSuggestion] = useState<any>(null);

    // Verificar alertas de prazos vencendo em 3 dias
    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alerts = agendaItems.filter(item => {
            const itemDate = new Date(item.date);
            itemDate.setHours(0, 0, 0, 0);

            const daysUntil = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Mostrar alerta se faltam 1 a 3 dias (excluir hoje e datas passadas)
            return daysUntil <= 3 && daysUntil > 0 && item.status !== 'DONE';
        });

        setUpcomingAlerts(alerts);
    }, [agendaItems]);

    // Resetar form para novo compromisso
    const resetForm = () => {
        setNewItem({ title: '', date: '', time: '09:00', type: 'Judicial', urgency: 'Média', clientId: '', description: '', suggestedDate: '' });
        setDeadlineSuggestion(null);
        setEditingItem(null);
    };

    // Abrir modal para editar
    const handleEditItem = (item: AgendaItem) => {
        setEditingItem(item);
        setNewItem({
            title: item.title,
            date: item.date.split('T')[0],
            time: item.date.split('T')[1]?.substring(0, 5) || '09:00',
            type: item.type,
            urgency: item.urgency,
            clientId: item.clientId || '',
            description: item.description || '',
            suggestedDate: ''
        });
        setIsModalOpen(true);
    };

    // Salvar edição ou novo
    const handleSave = async () => {
        if (!newItem.title || !newItem.date || !newItem.time) return alert("Preencha título, data e hora.");
        setLoading(true);

        const dateTime = new Date(`${newItem.date}T${newItem.time}`).toISOString();

        try {
            if (editingItem) {
                // Atualizar existente
                await updateAgendaItem(editingItem.id, {
                    title: newItem.title,
                    description: newItem.description,
                    date: dateTime,
                    type: newItem.type,
                    urgency: newItem.urgency,
                    clientId: newItem.clientId || undefined
                });
            } else {
                // Adicionar novo
                await addAgendaItem({
                    title: newItem.title,
                    description: newItem.description,
                    date: dateTime,
                    type: newItem.type,
                    urgency: newItem.urgency,
                    clientId: newItem.clientId || undefined
                });
            }
        } catch (e) {
            console.error('Erro ao salvar:', e);
        }

        setLoading(false);
        setIsModalOpen(false);
        resetForm();
    };

    // Gerar sugestão de prazo inteligente
    const handleSuggestDeadline = async () => {
        if (!newItem.title) return alert("Por favor, digite um título para o compromisso");
        if (!recordClick()) return;

        console.log('handleSuggestDeadline called');
        setAiLoading(true);

        try {
            console.log('Calling suggestDeadlines with:', newItem.title, newItem.type);
            const suggestion = await suggestDeadlines(
                newItem.title,
                newItem.description || `Tipo: ${newItem.type}`,
                newItem.type
            );

            console.log('Suggestion received:', suggestion);

            // Parse the suggested date
            let isoDate = '';
            if (suggestion.suggestedDate) {
                // Handle both ISO format and YYYY-MM-DD format
                const dateStr = suggestion.suggestedDate.includes('T')
                    ? suggestion.suggestedDate.split('T')[0]
                    : suggestion.suggestedDate;

                const dateObj = new Date(dateStr + 'T00:00:00Z');
                if (!isNaN(dateObj.getTime())) {
                    isoDate = dateStr;
                }
            }

            // If still no date, use default (7 days from now)
            if (!isoDate) {
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + 7);
                isoDate = defaultDate.toISOString().split('T')[0];
            }

            console.log('Final ISO date:', isoDate);

            // Update form with suggestion
            setNewItem(prev => ({
                ...prev,
                date: isoDate,
                time: '09:00'
            }));

            // Show suggestion panel
            setDeadlineSuggestion(suggestion);

        } catch (e) {
            console.error('Erro ao sugerir prazo:', e);

            // Fallback: use 7 days from now
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 7);
            const isoDate = defaultDate.toISOString().split('T')[0];

            setNewItem(prev => ({
                ...prev,
                date: isoDate,
                time: '09:00'
            }));

            setDeadlineSuggestion({
                suggestedDate: isoDate,
                reasoning: 'Usando sugestão padrão (7 dias). Verifique a data no calendário judiciário.',
                preparationDays: 7,
                relatedDeadlines: []
            });
        }

        setAiLoading(false);
    };

    // Gerar checklist de preparação
    const handleGenerateChecklist = async (item: AgendaItem) => {
        setAiLoading(true);
        setSelectedItemForChecklist(item);
        try {
            const result = await generatePreparationChecklist(item.title, item.type, 'Geral');
            setChecklist(result);
        } catch (e) {
            console.error('Erro ao gerar checklist:', e);
        }
        setAiLoading(false);
    };

    // Analisar conflitos na agenda
    const handleAnalyzeConflicts = async () => {
        setAiLoading(true);
        try {
            const result = await analyzeAgendaConflicts(agendaItems.map(i => ({
                title: i.title,
                date: i.date,
                type: i.type
            })));
            setConflicts(result);
        } catch (e) {
            console.error('Erro ao analisar conflitos:', e);
        }
        setAiLoading(false);
    };

    // Gerar resumo de período
    const handleGenerateSummary = async (period: 'semanal' | 'mensal') => {
        setAiLoading(true);
        try {
            const result = await generateAgendaSummary(agendaItems.map(i => ({
                title: i.title,
                date: i.date,
                type: i.type,
                urgency: i.urgency
            })), period);
            setPeriodSummary(result);
            setShowPeriodSummary(period);
        } catch (e) {
            console.error('Erro ao gerar resumo:', e);
        }
        setAiLoading(false);
    };

    // Helper to group items by timeline
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const getGroup = (dateStr: string) => {
        // Parse de forma segura para evitar problemas de timezone
        const parts = dateStr.split('T')[0].split('-'); // YYYY-MM-DD
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        d.setHours(0, 0, 0, 0);

        const todayDate = today.toLocaleDateString('pt-BR');
        const itemDate = d.toLocaleDateString('pt-BR');
        const tomorrowDate = tomorrow.toLocaleDateString('pt-BR');

        if (itemDate === todayDate) return 'Hoje';
        if (itemDate === tomorrowDate) return 'Amanhã';
        return 'Próximos Dias';
    };

    const groupedItems = {
        'Hoje': agendaItems.filter(i => getGroup(i.date) === 'Hoje').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        'Amanhã': agendaItems.filter(i => getGroup(i.date) === 'Amanhã').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        'Próximos Dias': agendaItems.filter(i => getGroup(i.date) === 'Próximos Dias').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };

    return (
        <div className="space-y-6">
            {/* ALERTA DE PRAZOS VENCENDO */}
            {upcomingAlerts.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-bold text-red-900 mb-2">⚠️ {upcomingAlerts.length} Prazo{upcomingAlerts.length > 1 ? 's' : ''} Vencendo em 3 Dias!</h3>
                            <div className="space-y-1">
                                {upcomingAlerts.slice(0, 5).map(alert => (
                                    <p key={alert.id} className="text-sm text-red-800">
                                        <span className="font-bold">• {alert.title}</span> - {new Date(alert.date).toLocaleDateString('pt-BR')}
                                    </p>
                                ))}
                                {upcomingAlerts.length > 5 && <p className="text-sm text-red-700">... e {upcomingAlerts.length - 5} mais</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Agenda Inteligente</h2>
                    <p className="text-slate-500">Prazos e audiências com IA. Detecção de conflitos e recomendações.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleAnalyzeConflicts} disabled={aiLoading || agendaItems.length === 0} className="bg-orange-600 text-white px-3 py-2 rounded-lg font-bold flex items-center shadow-lg hover:bg-orange-700 transition disabled:opacity-50">
                        {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                        Analisar
                    </button>
                    <button onClick={() => handleGenerateSummary('semanal')} disabled={aiLoading || agendaItems.length === 0} className="bg-purple-600 text-white px-3 py-2 rounded-lg font-bold flex items-center shadow-lg hover:bg-purple-700 transition disabled:opacity-50">
                        {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                        Resumo
                    </button>
                    <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-lg hover:bg-indigo-700 transition">
                        <Plus className="w-4 h-4 mr-2" /> Novo
                    </button>
                </div>
            </header>

            {/* FERRAMENTA DESCRIPTION CARD */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-100 rounded-xl flex-shrink-0">
                        <Calendar className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">O que você pode fazer:</h3>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3">
                            Organize sua agenda com IA inteligente. Sugestões automáticas de prazos, detecção de conflitos de agenda, geração de checklists de preparação e resumos estratégicos. Categorize por tipo (Judicial, Administrativo, Interno, Diligência), defina urgência e receba análises que economizam horas.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
                            <span className="bg-white px-2.5 py-1.5 rounded-lg text-cyan-700 font-bold border border-cyan-200">🤖 Sugestão IA</span>
                            <span className="bg-white px-2.5 py-1.5 rounded-lg text-cyan-700 font-bold border border-cyan-200">📋 Checklist</span>
                            <span className="bg-white px-2.5 py-1.5 rounded-lg text-cyan-700 font-bold border border-cyan-200">⚠️ Conflitos</span>
                            <span className="bg-white px-2.5 py-1.5 rounded-lg text-cyan-700 font-bold border border-cyan-200">📊 Resumo</span>
                            <span className="bg-white px-2.5 py-1.5 rounded-lg text-cyan-700 font-bold border border-cyan-200">🔗 Vincular</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ANÁLISE COMPLETA DE AGENDA */}
            {conflicts && (
                <div className="space-y-4">
                    {/* CONFLITOS PANEL */}
                    {conflicts.conflicts && conflicts.conflicts.length > 0 && (
                        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <h4 className="font-bold text-red-900">⚠️ Conflitos Detectados ({conflicts.conflicts.length})</h4>
                            </div>
                            <div className="space-y-2">
                                {conflicts.conflicts.map((c: any, i: number) => (
                                    <div key={i} className="bg-white p-3 rounded-lg border-l-4 border-red-500 text-sm">
                                        <p className="font-bold text-slate-900">{c.event1} × {c.event2}</p>
                                        <p className="text-slate-600 text-xs mt-1">{c.suggestion}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-2 inline-block ${c.riskLevel === 'Alta' ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'}`}>{c.riskLevel}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DIAS SOBRECARREGADOS */}
                    {conflicts.overloadedDays && conflicts.overloadedDays.length > 0 && (
                        <div className="bg-orange-50 border border-orange-300 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                <h4 className="font-bold text-orange-900">📅 Dias Sobrecarregados ({conflicts.overloadedDays.length})</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {conflicts.overloadedDays.map((day: string, i: number) => (
                                    <div key={i} className="bg-white p-3 rounded-lg border border-orange-200 text-center">
                                        <p className="text-sm font-bold text-orange-700">{new Date(day).toLocaleDateString('pt-BR')}</p>
                                        <p className="text-[10px] text-orange-600 mt-1">Múltiplos eventos</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* REAGENDAMENTOS RECOMENDADOS */}
                    {conflicts.recommendedReschedules && conflicts.recommendedReschedules.length > 0 && (
                        <div className="bg-blue-50 border border-blue-300 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <h4 className="font-bold text-blue-900">🔄 Reagendamentos Recomendados ({conflicts.recommendedReschedules.length})</h4>
                            </div>
                            <div className="space-y-2">
                                {conflicts.recommendedReschedules.map((r: any, i: number) => (
                                    <div key={i} className="bg-white p-3 rounded-lg border-l-4 border-blue-500 text-sm">
                                        <p className="font-bold text-slate-900">{r.event}</p>
                                        <p className="text-slate-600 text-xs mt-1"><span className="font-bold">Nova data:</span> {new Date(r.suggestedNewDate).toLocaleDateString('pt-BR')}</p>
                                        <p className="text-slate-600 text-xs mt-1"><span className="font-bold">Motivo:</span> {r.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MENSAGEM QUANDO NÃO HÁ PROBLEMAS */}
                    {(!conflicts.conflicts || conflicts.conflicts.length === 0) &&
                        (!conflicts.overloadedDays || conflicts.overloadedDays.length === 0) && (
                            <div className="bg-green-50 border border-green-300 rounded-xl p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <p className="font-bold text-green-900">✓ Agenda otimizada - Sem conflitos detectados</p>
                                </div>
                            </div>
                        )}
                </div>
            )}

            {/* RESUMO PANEL */}
            {showPeriodSummary && periodSummary && (
                <div className="space-y-4">
                    {/* VISÃO GERAL */}
                    {periodSummary.visaoGeral && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-300 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-6 h-6 text-purple-600" />
                                <h4 className="font-bold text-purple-900 text-lg">Resumo {showPeriodSummary === 'semanal' ? 'Semanal' : 'Mensal'}</h4>
                                <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${periodSummary.metricas?.indicadorSaude === 'Crítica' ? 'bg-red-200 text-red-800' : periodSummary.metricas?.indicadorSaude === 'Atenção' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                                    {periodSummary.metricas?.indicadorSaude || 'N/A'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-white p-3 rounded-lg border border-purple-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
                                    <p className="text-2xl font-bold text-purple-700">{periodSummary.visaoGeral.totalCompromisos}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-red-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Alta Urgência</p>
                                    <p className="text-2xl font-bold text-red-600">{periodSummary.visaoGeral.urgenciaDistribuicao?.alta || 0}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-yellow-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Stress</p>
                                    <p className="text-sm font-bold text-yellow-700">{periodSummary.metricas?.nivelStress || 'N/A'}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-blue-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Dias</p>
                                    <p className="text-sm font-bold text-blue-700">{periodSummary.metricas?.balanceWorkLife?.substring(0, 30) || 'Bem distribuído'}</p>
                                </div>
                            </div>
                            <p className="text-slate-700 text-sm">{periodSummary.visaoGeral.resumoUltilizado}</p>
                        </div>
                    )}

                    {/* PRIORIDADES CRÍTICAS */}
                    {periodSummary.prioridadesCriticas && periodSummary.prioridadesCriticas.length > 0 && (
                        <div className="bg-red-50 border border-red-300 rounded-xl p-6">
                            <h5 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> {periodSummary.prioridadesCriticas.length} Prioridades Críticas
                            </h5>
                            <div className="space-y-3">
                                {periodSummary.prioridadesCriticas.map((p: any, i: number) => (
                                    <div key={i} className="bg-white p-4 rounded-lg border-l-4 border-red-500">
                                        <p className="font-bold text-slate-900">{p.titulo}</p>
                                        <p className="text-xs text-slate-600 mt-1"><span className="font-bold">Razão:</span> {p.razao}</p>
                                        <p className="text-xs text-red-700 mt-1"><span className="font-bold">⚠️ Impacto:</span> {p.impactoAusencia}</p>
                                        <p className="text-xs text-emerald-700 mt-1"><span className="font-bold">✓ Ação:</span> {p.acaoRecomendada}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CARGA DE TRABALHO */}
                    {periodSummary.cargaTrabalho && (
                        <div className="bg-blue-50 border border-blue-300 rounded-xl p-6">
                            <h5 className="font-bold text-blue-900 mb-4">📅 Análise de Carga</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase mb-2">Dias Mais Carregados</p>
                                    <div className="space-y-1">
                                        {periodSummary.cargaTrabalho.diasMaisCarregados?.slice(0, 3).map((d: any, i: number) => (
                                            <div key={i} className="bg-white p-2 rounded text-xs border-l-2 border-blue-500">
                                                <p className="font-bold text-slate-900">{new Date(d.data).toLocaleDateString('pt-BR')} • {d.quantidade} compromissos</p>
                                                <p className="text-slate-600 text-[10px]">{d.compromissos?.substring(0, 50)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-600 uppercase mb-2">Indicador</p>
                                    <div className={`bg-white p-3 rounded border-l-4 ${periodSummary.cargaTrabalho.indicador?.includes('Sobrecarregado') ? 'border-red-500' : periodSummary.cargaTrabalho.indicador?.includes('Bem') ? 'border-green-500' : 'border-yellow-500'}`}>
                                        <p className="text-sm font-bold">{periodSummary.cargaTrabalho.indicador}</p>
                                        <p className="text-[10px] text-slate-600">{periodSummary.cargaTrabalho.percentualUsoSemanal}</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-700 text-xs">{periodSummary.cargaTrabalho.analiseDistribuicao}</p>
                        </div>
                    )}

                    {/* PRAZOS E PRECEDÊNCIAS */}
                    {periodSummary.prazos && (
                        <div className="bg-orange-50 border border-orange-300 rounded-xl p-6">
                            <h5 className="font-bold text-orange-900 mb-4">⏰ Prazos Críticos</h5>
                            <div className="space-y-3">
                                {periodSummary.prazos.vencimentosProximos?.slice(0, 4).map((v: any, i: number) => (
                                    <div key={i} className={`bg-white p-3 rounded border-l-4 ${v.prioridade === 'Alta' ? 'border-red-500' : 'border-orange-500'}`}>
                                        <p className="font-bold text-slate-900 text-sm">{v.titulo}</p>
                                        <p className="text-[10px] text-slate-600"><span className="font-bold">Data:</span> {new Date(v.data).toLocaleDateString('pt-BR')} ({v.diasRestantes} dias)</p>
                                    </div>
                                ))}
                            </div>
                            {periodSummary.prazos.precedencias && periodSummary.prazos.precedencias.length > 0 && (
                                <div className="bg-white border border-orange-200 p-3 rounded mt-3">
                                    <p className="text-xs font-bold text-slate-600 mb-2">Dependências:</p>
                                    <p className="text-xs text-slate-700">{periodSummary.prazos.dependencias}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* RECOMENDAÇÕES ESTRATÉGICAS */}
                    {periodSummary.recomendacoesEstrategicas && periodSummary.recomendacoesEstrategicas.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6">
                            <h5 className="font-bold text-emerald-900 mb-4">🎯 {periodSummary.recomendacoesEstrategicas.length} Recomendações Estratégicas</h5>
                            <div className="space-y-3">
                                {periodSummary.recomendacoesEstrategicas.slice(0, 5).map((r: any, i: number) => (
                                    <div key={i} className="bg-white p-3 rounded border-l-4 border-emerald-500">
                                        <p className="font-bold text-slate-900 text-sm">{r.numero}. {r.acao}</p>
                                        <p className="text-[10px] text-slate-600 mt-1"><span className="font-bold">Prazo:</span> {r.prazo}</p>
                                        <p className="text-[10px] text-emerald-700"><span className="font-bold">✓ Benefício:</span> {r.beneficio}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RISCOS */}
                    {periodSummary.riscos && periodSummary.riscos.length > 0 && (
                        <div className="bg-rose-50 border border-rose-300 rounded-xl p-6">
                            <h5 className="font-bold text-rose-900 mb-4">⚠️ {periodSummary.riscos.length} Riscos Identificados</h5>
                            <div className="space-y-2">
                                {periodSummary.riscos.slice(0, 4).map((r: any, i: number) => (
                                    <div key={i} className="bg-white p-3 rounded border-l-4 border-rose-500">
                                        <p className="font-bold text-slate-900 text-sm">{r.risco}</p>
                                        <p className="text-[10px] text-slate-600"><span className="font-bold">Probabilidade:</span> {r.probabilidade} | <span className="font-bold">Mitigação:</span> {r.mitigacao}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* OPORTUNIDADES */}
                    {periodSummary.oportunidades && (
                        <div className="bg-teal-50 border border-teal-300 rounded-xl p-6">
                            <h5 className="font-bold text-teal-900 mb-4">💡 Oportunidades de Otimização</h5>
                            <div className="space-y-3">
                                {periodSummary.oportunidades.eficiencia?.slice(0, 2).map((e: string, i: number) => (
                                    <div key={i} className="bg-white p-2 rounded border-l-4 border-teal-500 text-xs">
                                        <p className="font-bold">⚡ {e}</p>
                                    </div>
                                ))}
                                {periodSummary.oportunidades.otimizacaoTempo && (
                                    <div className="bg-teal-100 p-3 rounded text-xs font-bold text-teal-800 mt-2">
                                        💰 {periodSummary.oportunidades.otimizacaoTempo}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PRÓXIMAS AÇÕES */}
                    {periodSummary.proximasAcoes && periodSummary.proximasAcoes.length > 0 && (
                        <div className="bg-indigo-50 border border-indigo-300 rounded-xl p-6">
                            <h5 className="font-bold text-indigo-900 mb-4">📍 Próximas Ações Imediatas</h5>
                            <ol className="space-y-2">
                                {periodSummary.proximasAcoes.map((a: any, i: number) => (
                                    <li key={i} className="bg-white p-3 rounded border-l-4 border-indigo-500 text-sm">
                                        <p className="font-bold text-slate-900">{a.ordem}. {a.acao}</p>
                                        <p className="text-xs text-indigo-700"><span className="font-bold">Até:</span> {a.prazo}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['Hoje', 'Amanhã', 'Próximos Dias'].map((col) => (
                    <div key={col} className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[200px]">
                        <h3 className="font-bold text-slate-500 uppercase text-xs mb-4 flex justify-between items-center">
                            {col}
                            <span className="bg-slate-200 text-slate-600 px-2 rounded-full text-[10px]">{groupedItems[col as keyof typeof groupedItems].length}</span>
                        </h3>
                        <div className="space-y-3">
                            {groupedItems[col as keyof typeof groupedItems].length === 0 && (
                                <p className="text-center text-slate-400 text-xs py-4 italic">Livre</p>
                            )}
                            {groupedItems[col as keyof typeof groupedItems].map(item => {
                                const clientName = crmClients.find(c => c.id === item.clientId)?.name;
                                const daysUntil = Math.ceil((new Date(item.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                const isUrgent = daysUntil <= 3 && daysUntil > 0;

                                return (
                                    <div key={item.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 hover:shadow-md transition ${isUrgent ? 'border-red-500 bg-red-50' : 'border-indigo-500'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex gap-2 items-center">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.urgency === 'Alta' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{item.urgency}</span>
                                                {isUrgent && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">VENCE EM {daysUntil}d</span>}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-500">{new Date(item.date).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                                        {clientName && <p className="text-xs text-slate-500 mt-1 flex items-center"><UserIcon className="w-3 h-3 mr-1" /> {clientName}</p>}
                                        <div className="mt-3 flex gap-2 items-center flex-wrap justify-between">
                                            <div className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded inline-block">{item.type}</div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleGenerateChecklist(item)} disabled={aiLoading} className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 transition disabled:opacity-50" title="Ver checklist">
                                                    {aiLoading && selectedItemForChecklist?.id === item.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <ClipboardList className="w-3 h-3 inline" />}
                                                </button>
                                                <button onClick={() => handleEditItem(item)} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200 transition" title="Editar">
                                                    <Edit2 className="w-3 h-3 inline" />
                                                </button>
                                                <button onClick={() => deleteAgendaItem(item.id)} className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition" title="Deletar">
                                                    <X className="w-3 h-3 inline" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL: NOVO/EDITAR COMPROMISSO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 animate-in zoom-in duration-300 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{editingItem ? '✏️ Editar Compromisso' : '➕ Novo Compromisso'}</h3>
                                {editingItem && <p className="text-xs text-slate-500 mt-1">ID: {editingItem.id}</p>}
                            </div>
                            <button onClick={() => { setIsModalOpen(false); setDeadlineSuggestion(null); resetForm(); }}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* COLUNA 1: DADOS BÁSICOS */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Título *</label>
                                    <input value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Ex: Audiência de Instrução" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Descrição (para IA)</label>
                                    <textarea value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg h-20 resize-none text-sm" placeholder="Descreva o compromisso, contexto, área jurídica..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                                    <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value as any })} className="w-full p-3 border border-slate-200 rounded-lg text-sm">
                                        <option>Judicial</option>
                                        <option>Administrativo</option>
                                        <option>Interno</option>
                                        <option>Diligencia</option>
                                        <option>Extra Judicial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Urgência</label>
                                    <select value={newItem.urgency} onChange={e => setNewItem({ ...newItem, urgency: e.target.value as any })} className="w-full p-3 border border-slate-200 rounded-lg text-sm">
                                        <option>Baixa</option>
                                        <option>Média</option>
                                        <option>Alta</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Cliente (Opcional)</label>
                                    <select value={newItem.clientId} onChange={e => setNewItem({ ...newItem, clientId: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm">
                                        <option value="">-- Selecione --</option>
                                        {crmClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* COLUNA 2: DATA/HORA + SUGESTÃO IA */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Data *</label>
                                    <input type="date" value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Hora *</label>
                                    <input type="time" value={newItem.time} onChange={e => setNewItem({ ...newItem, time: e.target.value })} className="w-full p-3 border border-slate-200 rounded-lg text-sm" />
                                </div>

                                {/* SUGESTÃO DE PRAZO COM IA */}
                                <button
                                    onClick={handleSuggestDeadline}
                                    disabled={aiLoading || !newItem.title}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-bold hover:from-emerald-600 hover:to-teal-700 transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-md"
                                    title={!newItem.title ? "Preencha o título primeiro" : "Clique para sugerir prazo inteligente"}
                                >
                                    {aiLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            <span>Analisando com IA...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            <span>Sugerir Prazo com IA</span>
                                        </>
                                    )}
                                </button>

                                {/* RESULTADO DA SUGESTÃO */}
                                {deadlineSuggestion && (
                                    <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-emerald-900 mb-1">✨ Sugestão de IA:</p>
                                            <p className="text-sm text-emerald-800 leading-relaxed">{deadlineSuggestion.reasoning}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded border border-emerald-200 space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600"><span className="font-bold">Data sugerida:</span> {newItem.date ? new Date(newItem.date + 'T00:00').toLocaleDateString('pt-BR') : 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-600"><span className="font-bold">Tempo de prep:</span> {deadlineSuggestion.preparationDays} dias antes</span>
                                            </div>
                                            {deadlineSuggestion.relatedDeadlines && deadlineSuggestion.relatedDeadlines.length > 0 && (
                                                <div>
                                                    <span className="text-slate-600 block"><span className="font-bold mb-1">Prazos relacionados:</span></span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {deadlineSuggestion.relatedDeadlines.slice(0, 3).map((d: string, i: number) => (
                                                            <span key={i} className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">{d}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setDeadlineSuggestion(null)} className="flex-1 bg-white text-slate-700 border border-slate-300 py-1.5 rounded font-bold text-xs hover:bg-slate-50 transition">
                                                Ignorar
                                            </button>
                                            <button onClick={() => { /* Data já está preenchida */ }} className="flex-1 bg-emerald-600 text-white py-1.5 rounded font-bold text-xs hover:bg-emerald-700 transition">
                                                ✓ Usar Data
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BOTÃO SALVAR - FULL WIDTH */}
                        <button onClick={handleSave} disabled={loading || !newItem.title || !newItem.date || !newItem.time} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center mt-6 disabled:opacity-50">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            Salvar na Agenda
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL: CHECKLIST DE PREPARAÇÃO */}
            {checklist && selectedItemForChecklist && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 animate-in zoom-in duration-300 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Checklist: {selectedItemForChecklist.title}</h3>
                            <button onClick={() => { setChecklist(null); setSelectedItemForChecklist(null); }}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                                <p className="text-sm text-slate-700"><span className="font-bold">Tempo estimado:</span> {checklist.estimatedPrepTime} horas</p>
                            </div>

                            {checklist.checklist && checklist.checklist.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-3">Tarefas de Preparação:</h4>
                                    <div className="space-y-2">
                                        {checklist.checklist.map((task: any, i: number) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                                <input type="checkbox" className="w-4 h-4 mt-1" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-900">{task.task}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{task.daysBeforeEvent} dias antes do evento</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-2 ${task.priority === 'Alta' ? 'bg-red-100 text-red-700' : task.priority === 'Média' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{task.priority}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {checklist.criticalTasks && checklist.criticalTasks.length > 0 && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                    <h4 className="font-bold text-red-900 mb-2">⚠️ Tarefas Críticas:</h4>
                                    <ul className="space-y-1 text-sm">
                                        {checklist.criticalTasks.map((task: string, i: number) => (
                                            <li key={i} className="text-red-800">• {task}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button onClick={() => { setChecklist(null); setSelectedItemForChecklist(null); }} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ToolIntake: React.FC = () => {
    const { handleClick: recordClick } = useClickLimit();
    const [step, setStep] = useState(1);
    const [answers, setAnswers] = useState('');
    const [diagnosis, setDiagnosis] = useState<any>(null);
    const [caseValue, setCaseValue] = useState<any>(null);
    const [viability, setViability] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

    const handleDiagnose = async () => {
        if (!recordClick()) return;
        setLoading(true);
        try {
            const diag = await diagnoseIntake(answers);
            setDiagnosis(diag);

            // Obter análise de viabilidade e valor em paralelo
            const [valueAnalysis, viabilityAnalysis] = await Promise.all([
                estimateCaseValue(diag.area, answers),
                analyzeViability(diag.area, answers)
            ]);

            setCaseValue(valueAnalysis);
            setViability(viabilityAnalysis);
            setStep(2);
        } catch (e) {
            console.error('Erro ao diagnosticar:', e);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* FERRAMENTA DESCRIPTION CARD */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-teal-100 rounded-xl flex-shrink-0">
                        <ClipboardList className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">O que você pode fazer:</h3>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3">
                            Triagem inteligente com IA. Digite o relato do cliente e receba diagnóstico completo: área jurídica, urgência, complexidade, documentos necessários, análise de viabilidade e estimativa de valor. Tome decisões informadas sobre novos casos em segundos.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
                            <span className="bg-white px-2.5 py-1.5 rounded-lg text-teal-700 font-bold border border-teal-200">🤖 Diagnóstico IA</span>
                            <span className="bg-white px-2.5 py-1.5 rounded-lg text-teal-700 font-bold border border-teal-200">📋 Documentos</span>
                            <span className="bg-white px-2.5 py-1.5 rounded-lg text-teal-700 font-bold border border-teal-200">💰 Estimativa</span>
                            <span className="bg-white px-2.5 py-1.5 rounded-lg text-teal-700 font-bold border border-teal-200">✅ Viabilidade</span>
                            <span className="bg-white px-2.5 py-1.5 rounded-lg text-teal-700 font-bold border border-teal-200">📊 Análise</span>
                        </div>
                    </div>
                </div>
            </div>

            {step === 1 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Assistente de Triagem Inteligente</h2>
                    <p className="text-slate-500 mb-6">Digite o relato inicial do cliente para receber diagnóstico automático completo com análise de viabilidade e estimativa de valor.</p>

                    <textarea
                        className="w-full h-48 p-4 border border-slate-200 rounded-xl mb-6 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                        placeholder="Ex: Cliente foi demitido sem aviso prévio após 8 anos na empresa. Empresa não pagou rescisão nem FGTS. Trabalhou 40h/semana. Últimos 3 meses ganhou R$ 4.000. Gostaria de reaver valores e possível indenização..."
                        value={answers}
                        onChange={e => setAnswers(e.target.value)}
                    />

                    <button
                        onClick={handleDiagnose}
                        disabled={loading || !answers.trim()}
                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center hover:from-teal-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Analisando caso com IA...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6 mr-2" />
                                Realizar Triagem Completa
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* RESULTADO PRINCIPAL */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-teal-200 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">✅ Resultado da Triagem</h2>
                            <button
                                onClick={() => { setStep(1); setAnswers(''); setDiagnosis(null); setCaseValue(null); setViability(null); }}
                                className="text-teal-600 hover:text-teal-700 font-bold text-sm"
                            >
                                ← Nova Triagem
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Área Jurídica */}
                            <div className="bg-white p-4 rounded-xl border border-teal-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Área Jurídica</p>
                                <p className="font-bold text-lg text-slate-900">{diagnosis?.area}</p>
                            </div>

                            {/* Urgência */}
                            <div className={`p-4 rounded-xl border-2 ${diagnosis?.urgency === 'Alta' ? 'bg-red-50 border-red-300' :
                                diagnosis?.urgency === 'Média' ? 'bg-yellow-50 border-yellow-300' :
                                    'bg-green-50 border-green-300'
                                }`}>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Urgência</p>
                                <p className={`font-bold text-lg ${diagnosis?.urgency === 'Alta' ? 'text-red-700' :
                                    diagnosis?.urgency === 'Média' ? 'text-yellow-700' :
                                        'text-green-700'
                                    }`}>{diagnosis?.urgency}</p>
                            </div>

                            {/* Complexidade */}
                            <div className="bg-white p-4 rounded-xl border border-teal-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Complexidade Estimada</p>
                                <p className="font-bold text-lg text-slate-900">{diagnosis?.estimatedComplexity}</p>
                            </div>

                            {/* Nível de Risco */}
                            <div className={`p-4 rounded-xl border-2 ${diagnosis?.riskLevel === 'Alto' ? 'bg-red-50 border-red-300' :
                                diagnosis?.riskLevel === 'Médio' ? 'bg-blue-50 border-blue-300' :
                                    'bg-emerald-50 border-emerald-300'
                                }`}>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Nível de Risco</p>
                                <p className={`font-bold text-lg ${diagnosis?.riskLevel === 'Alto' ? 'text-red-700' :
                                    diagnosis?.riskLevel === 'Médio' ? 'text-blue-700' :
                                        'text-emerald-700'
                                    }`}>{diagnosis?.riskLevel}</p>
                            </div>
                        </div>

                        {/* Ação Sugerida */}
                        <div className="bg-white p-4 rounded-xl border border-teal-100 mb-6">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Ação Recomendada</p>
                            <p className="text-slate-700 font-semibold">{diagnosis?.suggestedAction}</p>
                        </div>

                        {/* Próximos Passos */}
                        {diagnosis?.nextSteps && diagnosis.nextSteps.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                <p className="text-xs font-bold text-blue-900 uppercase mb-3">Próximos Passos</p>
                                <ol className="space-y-2">
                                    {diagnosis.nextSteps.map((step: string, i: number) => (
                                        <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                                            <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>

                    {/* DOCUMENTOS NECESSÁRIOS */}
                    {diagnosis?.requiredDocuments && diagnosis.requiredDocuments.length > 0 && (
                        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                            <h3 className="text-lg font-bold text-purple-900 mb-4">📋 Documentos Necessários</h3>
                            <ul className="space-y-2">
                                {diagnosis.requiredDocuments.map((doc: string, i: number) => (
                                    <li key={i} className="text-sm text-purple-800 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                        {doc}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ANÁLISE FINANCEIRA */}
                    {caseValue && (
                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200">
                            <h3 className="text-lg font-bold text-emerald-900 mb-4">💰 Análise de Valor</h3>
                            <div className="space-y-3">
                                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Estimativa de Valor</p>
                                    <p className="font-bold text-2xl text-emerald-700 mt-1">{caseValue.estimatedRange}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Potencial de Resultado</p>
                                    <p className="text-sm text-slate-700">{caseValue.potentialOutcome}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Abordagem Recomendada</p>
                                    <p className="text-sm text-slate-700">{caseValue.recommendedApproach}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANÁLISE DE VIABILIDADE */}
                    {viability && (
                        <div className={`p-6 rounded-2xl border-2 ${viability.viability === 'Alta' ? 'bg-green-50 border-green-300' :
                            viability.viability === 'Média' ? 'bg-yellow-50 border-yellow-300' :
                                'bg-red-50 border-red-300'
                            }`}>
                            <h3 className={`text-lg font-bold mb-4 ${viability.viability === 'Alta' ? 'text-green-900' :
                                viability.viability === 'Média' ? 'text-yellow-900' :
                                    'text-red-900'
                                }`}>✅ Análise de Viabilidade</h3>

                            <div className="space-y-3">
                                <div className={`p-3 rounded-lg border ${viability.viability === 'Alta' ? 'bg-green-100 border-green-300' :
                                    viability.viability === 'Média' ? 'bg-yellow-100 border-yellow-300' :
                                        'bg-red-100 border-red-300'
                                    }`}>
                                    <p className="text-xs font-bold uppercase mb-1">Viabilidade: {viability.viability}</p>
                                    <p className="text-sm font-semibold">{viability.reasoning}</p>
                                </div>

                                {viability.risks && viability.risks.length > 0 && (
                                    <div className="bg-white p-3 rounded-lg border border-red-200">
                                        <p className="text-xs font-bold text-red-700 uppercase mb-2">⚠️ Riscos Identificados</p>
                                        <ul className="space-y-1">
                                            {viability.risks.map((risk: string, i: number) => (
                                                <li key={i} className="text-sm text-red-700">• {risk}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {viability.opportunities && viability.opportunities.length > 0 && (
                                    <div className="bg-white p-3 rounded-lg border border-green-200">
                                        <p className="text-xs font-bold text-green-700 uppercase mb-2">🎯 Oportunidades</p>
                                        <ul className="space-y-1">
                                            {viability.opportunities.map((opp: string, i: number) => (
                                                <li key={i} className="text-sm text-green-700">✓ {opp}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <p className="text-xs font-bold text-slate-600 uppercase mb-1">Recomendação</p>
                                    <p className="text-sm text-slate-700 font-semibold">{viability.recommendation}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BOTÃO NOVA TRIAGEM */}
                    <button
                        onClick={() => { setStep(1); setAnswers(''); setDiagnosis(null); setCaseValue(null); setViability(null); }}
                        className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
                    >
                        ← Voltar para Nova Triagem
                    </button>
                </div>
            )}
        </div>
    );
};

const ToolCalculators: React.FC = () => {
    const { saveCalculation, crmClients, addSmartDoc } = useApp();
    const [selectedCategory, setSelectedCategory] = useState<string>('Trabalhista');
    const [selectedType, setSelectedType] = useState<string>('Rescisão Completa');
    const [inputs, setInputs] = useState<any>({});
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [savingToSmartDoc, setSavingToSmartDoc] = useState(false);

    const categories = {
        'Trabalhista': ['Rescisão Completa', 'Férias', 'Horas Extras'],
        'Cível': ['Correção Monetária', 'Juros Moratórios'],
        'Previdenciário': ['Aposentadoria por Idade'],
        'Tributário': ['SELIC'],
        'Família': ['Pensão Alimentícia'],
        'Processual': ['Prazos CPC', 'Honorários']
    };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            let calcResult = null;

            switch (selectedType) {
                case 'Rescisão Completa':
                    calcResult = await calculateRescisaoCompleta(inputs);
                    break;
                case 'Férias':
                    calcResult = await calculateFerias(inputs);
                    break;
                case 'Horas Extras':
                    calcResult = await calculateHorasExtras(inputs);
                    break;
                case 'Correção Monetária':
                    calcResult = await calculateCorrecaoMonetaria(inputs);
                    break;
                case 'Juros Moratórios':
                    calcResult = await calculateJurosMoratorios(inputs);
                    break;
                case 'Aposentadoria por Idade':
                    calcResult = await calculateAposentadoriaIdade(inputs);
                    break;
                case 'SELIC':
                    calcResult = await calculateSELIC(inputs);
                    break;
                case 'Pensão Alimentícia':
                    calcResult = await calculatePensaoAlimenticia(inputs);
                    break;
                case 'Honorários':
                    calcResult = await calculateHonorarios(inputs);
                    break;
                case 'Prazos CPC':
                    calcResult = calculatePrazoCPC(inputs);
                    break;
            }

            setResult(calcResult);
        } catch (error) {
            console.error('Erro ao calcular:', error);
            alert('Erro ao realizar cálculo. Verifique os dados informados.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        setSavingToSmartDoc(true);
        try {
            const clientName = selectedClient
                ? crmClients.find(c => c.id === selectedClient)?.name
                : '';

            // Salvar no histórico de cálculos
            await saveCalculation({
                category: selectedCategory,
                type: selectedType,
                title: `${selectedType} - ${new Date().toLocaleDateString()}`,
                inputData: inputs,
                resultData: result,
                clientId: selectedClient || undefined,
                clientName: clientName || undefined,
                savedToSmartDoc: false
            });

            // Também salvar no SmartDocs (se cliente selecionado)
            if (selectedClient) {
                const fileName = `Cálculo_${selectedType}_${clientName}_${new Date().toISOString().split('T')[0]}.txt`;

                // Gerar conteúdo formatado
                const docContent = generateCalculationDocument(selectedType, inputs, result, clientName);

                // Converter para base64 UTF-8
                const utf8String = unescape(encodeURIComponent(docContent));
                const base64String = btoa(utf8String);

                await addSmartDoc({
                    name: fileName,
                    type: 'Outros',
                    tags: [selectedCategory, selectedType, 'Cálculo', 'Automático'],
                    version: 1,
                    size: (docContent.length / 1024).toFixed(2) + ' KB',
                    url: `data:text/plain;base64,${base64String}`,
                    clientId: selectedClient
                });

                alert('✅ Cálculo salvo no histórico E anexado ao cliente no SmartDocs!');
            } else {
                alert('✓ Cálculo salvo no histórico (sem cliente selecionado)');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro ao salvar cálculo');
        } finally {
            setSavingToSmartDoc(false);
        }
    };

    // Gera documento formatado para salvar
    const generateCalculationDocument = (type: string, inputs: any, result: any, clientName: string) => {
        let doc = `╔════════════════════════════════════════════════════════════════════════════╗
║                         CÁLCULO JURÍDICO AUTOMÁTICO                        ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 TIPO DE CÁLCULO: ${type}
👤 CLIENTE: ${clientName}
📅 DATA: ${new Date().toLocaleDateString('pt-BR')}
⏰ HORA: ${new Date().toLocaleTimeString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DADOS DE ENTRADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Object.entries(inputs)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 RESULTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VALOR TOTAL: R$ ${typeof result.total === 'number' ? result.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : result.total}

${result.summary ? `RESUMO: ${result.summary}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DETALHAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${result.details
                .map((item: any) =>
                    `${item.label}
  Valor: ${item.value}
  Fundamento: ${item.description}\n`)
                .join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documento gerado automaticamente pelo Sistema SocialJurídico
Ferramenta: Calculadoras Jurídicas v2.0
`;
        return doc;
    };

    const renderInputs = () => {
        switch (selectedType) {
            case 'Rescisão Completa':
                return (
                    <>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Salário Base (R$)</label><input type="text" value={inputs.salarioBase || ''} onChange={e => setInputs({ ...inputs, salarioBase: parseFloat(e.target.value) || 0 })} placeholder="Ex: 5000,00 ou 5000" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data de Admissão</label><input type="date" value={inputs.dataAdmissao || ''} onChange={e => setInputs({ ...inputs, dataAdmissao: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data de Rescisão</label><input type="date" value={inputs.dataRescisao || ''} onChange={e => setInputs({ ...inputs, dataRescisao: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Comissões/Outras (R$)</label><input type="text" value={inputs.teveComissoes || ''} onChange={e => setInputs({ ...inputs, teveComissoes: parseFloat(e.target.value) || 0 })} placeholder="Ex: 1000,00 ou 1000" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div className="flex items-center gap-2"><input type="checkbox" id="aviso" checked={inputs.temAviso || false} onChange={e => setInputs({ ...inputs, temAviso: e.target.checked })} /><label htmlFor="aviso" className="text-xs font-bold text-slate-600">Sem Aviso Prévio?</label></div>
                    </>
                );
            case 'Férias':
                return (
                    <>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Salário Base (R$)</label><input type="text" value={inputs.salarioBase || ''} onChange={e => setInputs({ ...inputs, salarioBase: parseFloat(e.target.value) || 0 })} placeholder="Ex: 5000,00 ou 5000" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Dias de Férias</label><select value={inputs.diasFeria || 30} onChange={e => setInputs({ ...inputs, diasFeria: parseInt(e.target.value) })} className="w-full p-2 border border-slate-300 rounded-lg"><option value="30">30 dias (completas)</option><option value="20">20 dias</option><option value="10">10 dias (proporcionais)</option></select></div>
                        <div className="flex items-center gap-2"><input type="checkbox" id="terco" checked={inputs.incluirTerco || true} onChange={e => setInputs({ ...inputs, incluirTerco: e.target.checked })} /><label htmlFor="terco" className="text-xs font-bold text-slate-600">Incluir 1/3 Constitucional?</label></div>
                    </>
                );
            case 'Horas Extras':
                return (
                    <>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Salário Base (R$)</label><input type="text" value={inputs.salarioBase || ''} onChange={e => setInputs({ ...inputs, salarioBase: parseFloat(e.target.value) || 0 })} placeholder="Ex: 5000,00 ou 5000" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Horas Extras (mês)</label><input type="text" value={inputs.horasExtrasMes || ''} onChange={e => setInputs({ ...inputs, horasExtrasMes: parseFloat(e.target.value) })} placeholder="Ex: 10 ou 10,5" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Adicional (%)</label><select value={inputs.adicional || 50} onChange={e => setInputs({ ...inputs, adicional: parseInt(e.target.value) })} className="w-full p-2 border border-slate-300 rounded-lg"><option value="50">50% (noturna)</option><option value="100">100% (feriado/domingo)</option></select></div>
                    </>
                );
            case 'Correção Monetária':
                return (
                    <>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Valor Original (R$)</label><input type="text" value={inputs.valorOriginal || ''} onChange={e => setInputs({ ...inputs, valorOriginal: parseFloat(e.target.value) || 0 })} placeholder="Ex: 10000,00 ou 10000" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data Inicial</label><input type="date" value={inputs.dataInicial || ''} onChange={e => setInputs({ ...inputs, dataInicial: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data Final</label><input type="date" value={inputs.dataFinal || ''} onChange={e => setInputs({ ...inputs, dataFinal: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Índice de Correção</label><select value={inputs.indice || 'IPCA'} onChange={e => setInputs({ ...inputs, indice: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg"><option value="IPCA">IPCA - Consumidor Amplo (IBGE)</option><option value="INPC">INPC - Consumidor (IBGE)</option><option value="IGPM">IGP-M - Reajuste de Contratos (FGV)</option><option value="TR">TR - Taxa Referencial (BCB)</option><option value="SELIC">SELIC - Sistema Banco Central (BCB)</option><option value="CDI">CDI - Certificado Interbancário</option></select></div>
                    </>
                );
            case 'Juros Moratórios':
                return (
                    <>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Valor Devido (R$)</label><input type="text" value={inputs.valorDevido || ''} onChange={e => setInputs({ ...inputs, valorDevido: parseFloat(e.target.value) || 0 })} placeholder="Ex: 5000,00 ou 5000" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data de Vencimento</label><input type="date" value={inputs.dataVencimento || ''} onChange={e => setInputs({ ...inputs, dataVencimento: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data de Pagamento</label><input type="date" value={inputs.dataPagamento || ''} onChange={e => setInputs({ ...inputs, dataPagamento: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Tipo</label><select value={inputs.tipoDebito || 'Legal'} onChange={e => setInputs({ ...inputs, tipoDebito: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg"><option value="Legal">Legal (1% a.m. - CC Art. 406)</option><option value="Contratual">Contratual</option></select></div>
                    </>
                );
            case 'Aposentadoria por Idade':
                return (
                    <>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data de Nascimento</label><input type="date" value={inputs.dataNascimento || ''} onChange={e => setInputs({ ...inputs, dataNascimento: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data da Primeira Contribuição</label><input type="date" value={inputs.dataInicio || ''} onChange={e => setInputs({ ...inputs, dataInicio: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Sexo</label><select value={inputs.sexo || 'M'} onChange={e => setInputs({ ...inputs, sexo: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg"><option value="M">Masculino</option><option value="F">Feminino</option></select></div>
                    </>
                );
            case 'SELIC':
                return (
                    <>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Valor do Débito (R$)</label><input type="text" value={inputs.valorDebito || ''} onChange={e => setInputs({ ...inputs, valorDebito: parseFloat(e.target.value) || 0 })} placeholder="Ex: 5000,00 ou 5000" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data Principal</label><input type="date" value={inputs.dataPrincipal || ''} onChange={e => setInputs({ ...inputs, dataPrincipal: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data de Pagamento</label><input type="date" value={inputs.dataPagamento || ''} onChange={e => setInputs({ ...inputs, dataPagamento: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                    </>
                );
            case 'Pensão Alimentícia':
                return (
                    <>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Renda Mensal (R$)</label><input type="text" value={inputs.rendaMensal || ''} onChange={e => setInputs({ ...inputs, rendaMensal: parseFloat(e.target.value) || 0 })} placeholder="Ex: 5000,00 ou 5000" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Número de Filhos</label><input type="text" value={inputs.numeroFilhos || ''} onChange={e => setInputs({ ...inputs, numeroFilhos: parseInt(e.target.value) || 1 })} placeholder="Ex: 2" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Percentual (%)</label><input type="text" value={inputs.percentualAlimentista || ''} onChange={e => setInputs({ ...inputs, percentualAlimentista: parseInt(e.target.value) || 20 })} placeholder="Ex: 20" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div className="flex items-center gap-2"><input type="checkbox" id="outras" checked={inputs.temOutrasObrigacoes || false} onChange={e => setInputs({ ...inputs, temOutrasObrigacoes: e.target.checked })} /><label htmlFor="outras" className="text-xs font-bold text-slate-600">Tem Outras Obrigações?</label></div>
                    </>
                );
            case 'Honorários':
                return (
                    <>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Valor da Causa (R$)</label><input type="text" value={inputs.causaValor || ''} onChange={e => setInputs({ ...inputs, causaValor: parseFloat(e.target.value) || 0 })} placeholder="Ex: 50000,00 ou 50000" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Complexidade</label><select value={inputs.complexidade || 'Média'} onChange={e => setInputs({ ...inputs, complexidade: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg"><option value="Baixa">Baixa (10%)</option><option value="Média">Média (15%)</option><option value="Alta">Alta (20%)</option></select></div>
                        <div className="flex items-center gap-2"><input type="checkbox" id="vencido" checked={inputs.foiVencido || false} onChange={e => setInputs({ ...inputs, foiVencido: e.target.checked })} /><label htmlFor="vencido" className="text-xs font-bold text-slate-600">Cliente Vencido (Sucumbência)?</label></div>
                    </>
                );
            case 'Prazos CPC':
                return (
                    <>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data do Evento</label><input type="date" value={inputs.eventoDatas || ''} onChange={e => setInputs({ ...inputs, eventoDatas: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-600 mb-1 block">Tipo de Prazo</label><select value={inputs.tipoPrazo || 'Resposta'} onChange={e => setInputs({ ...inputs, tipoPrazo: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg"><option value="Resposta">Resposta/Contestação (15 dias)</option><option value="Recurso">Recurso (15 dias)</option><option value="Intimacao">Comparecimento (5 dias)</option></select></div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* FERRAMENTA DESCRIPTION CARD */}
            <div className="bg-gradient-to-r from-lime-50 to-green-50 border border-lime-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-lime-100 rounded-xl flex-shrink-0">
                        <Calculator className="w-6 h-6 text-lime-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">⚖️ Calculadoras Jurídicas Profissionais</h3>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3">
                            Calculadoras especializadas com fórmulas fiéis à legislação brasileira (CLT, CC, CPC, Lei INSS). Rescisões trabalhistas, correção monetária, juros moratórios, prazos processuais, honorários OAB, pensão alimentícia e muito mais. Resultados detalhados com fundamentos legais.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-lime-700 font-bold border border-lime-200">📊 9 Cálculos</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-lime-700 font-bold border border-lime-200">⚖️ CLT/CC/CPC</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-lime-700 font-bold border border-lime-200">💰 Precisão</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-lime-700 font-bold border border-lime-200">🔍 Detalhado</span>
                            <span className="text-xs bg-white px-2.5 py-1.5 rounded-lg text-lime-700 font-bold border border-lime-200">💾 Salvar</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Sidebar Categories */}
                <div className="col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[600px]">
                    <div className="p-4 bg-gradient-to-r from-lime-50 to-green-50 border-b border-slate-100 font-bold text-slate-700 flex items-center"><Calculator className="w-4 h-4 mr-2 text-lime-600" /> Áreas de Cálculo</div>
                    <div className="flex-1 overflow-y-auto">
                        {Object.keys(categories).map(cat => (
                            <div key={cat}>
                                <div className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-100">{cat}</div>
                                {categories[cat as keyof typeof categories].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => { setSelectedCategory(cat); setSelectedType(t); setResult(null); setInputs({}); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition border-l-4 ${selectedType === t ? 'bg-indigo-100 border-indigo-600 text-indigo-700 font-bold' : 'border-transparent text-slate-600'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calculator Area */}
                <div className="col-span-9 flex flex-col gap-6">
                    {/* Type Selection & Input */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center">
                                <Zap className="w-5 h-5 mr-2 text-lime-600" />
                                {selectedType}
                            </h2>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 mb-6 space-y-4">
                            {/* Seletor de Cliente */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <label className="text-xs font-bold text-slate-600 mb-2 block">👤 Associar a Cliente (Opcional)</label>
                                <select
                                    value={selectedClient}
                                    onChange={e => setSelectedClient(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">-- Sem cliente associado --</option>
                                    {crmClients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.name} ({client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-2">💡 Se selecionar cliente, o resultado será automaticamente anexado ao SmartDocs do cliente</p>
                            </div>

                            {renderInputs()}
                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    onClick={() => { setInputs({}); setResult(null); }}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm"
                                >
                                    Limpar
                                </button>
                                <button
                                    onClick={handleCalculate}
                                    disabled={loading}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center text-sm shadow-lg shadow-indigo-600/20"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                                    Calcular
                                </button>
                            </div>
                        </div>

                        {/* Results Area */}
                        {result && (
                            <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-6">
                                {/* Big Number Result */}
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">💰 Resultado Total</p>
                                    <p className="text-5xl font-bold text-indigo-700 mb-3">
                                        {typeof result.total === 'number' ? `R$ ${result.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : result.total}
                                    </p>
                                    <p className="text-sm text-slate-600">{result.summary}</p>
                                </div>

                                {/* Details Table */}
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 text-left">Item</th>
                                                <th className="p-3 text-right">Valor</th>
                                                <th className="p-3 text-left">Fundamento Legal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {result.details && result.details.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="p-3 font-medium text-slate-800">{item.label}</td>
                                                    <td className="p-3 font-bold text-slate-900 text-right">{item.value}</td>
                                                    <td className="p-3 text-slate-500 text-xs italic">{item.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => alert("PDF Gerado com sucesso!")} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-bold flex items-center"><Printer className="w-4 h-4 mr-2" /> Exportar PDF</button>
                                    <button
                                        onClick={handleSave}
                                        disabled={savingToSmartDoc}
                                        className={`px-4 py-2 rounded-lg font-bold flex items-center transition ${selectedClient
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        {savingToSmartDoc ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                {selectedClient ? 'Salvar + Anexar ao Cliente' : 'Salvar Cálculo'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- DASHBOARDS ---

export const ClientDashboard: React.FC = () => {
    const { currentUser, cases, logout, createCase, hireLawyer, openChatWithLawyer, buyJuris, users, rateOtherUser } = useApp();
    const [view, setView] = useState<ViewType>('dashboard');
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingStars, setRatingStars] = useState(4.5);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // New Case Form State
    const [description, setDescription] = useState('');
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [city, setCity] = useState('');
    const [uf, setUf] = useState('');
    const [caseImages, setCaseImages] = useState<any[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);

    const myCases = cases.filter(c => c.clientId === currentUser?.id);

    const [processingPayment, setProcessingPayment] = useState(false);

    const BuyJurisModal = () => (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in">
                <h2 className="text-2xl font-bold mb-2">Comprar Juris</h2>
                <p className="text-slate-500 mb-2">Escolha um pacote para créditos instantâneos</p>
                <p className="text-slate-400 text-sm mb-8">Adicione créditos e encontre profissionais especializados para a sua demanda.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { juris: 10, price: 9.90, popular: false },
                        { juris: 20, price: 16.90, popular: true },
                        { juris: 50, price: 39.90, popular: false }
                    ].map(pkg => (
                        <div key={pkg.juris} className={`p-6 rounded-xl border-2 transition cursor-pointer ${pkg.popular ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-slate-200 hover:border-indigo-300'}`}>
                            {pkg.popular && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full mb-3 inline-block">Mais Popular</span>}
                            <p className="text-3xl font-bold text-slate-900">{pkg.juris}</p>
                            <p className="text-sm text-slate-500 mb-4">Juris</p>
                            <p className="text-2xl font-bold text-indigo-600 mb-4">R$ {pkg.price.toFixed(2)}</p>
                            <button
                                onClick={async () => {
                                    setProcessingPayment(true);
                                    try {
                                        await buyJuris(pkg.juris);
                                    } finally {
                                        setProcessingPayment(false);
                                    }
                                }}
                                disabled={processingPayment}
                                className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center ${pkg.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50' : 'bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-50'}`}
                            >
                                {processingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {processingPayment ? 'Processando...' : 'Comprar'}
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => setShowBuyModal(false)}
                    disabled={processingPayment}
                    className="w-full py-3 text-slate-600 hover:text-slate-900 font-medium disabled:opacity-50"
                >
                    Fechar
                </button>
            </div>
        </div>
    );

    const RatingModal = () => (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in">
                <h2 className="text-2xl font-bold mb-2">Avaliar Advogado</h2>
                <p className="text-slate-500 mb-6">Sua opinião ajuda a melhorar a plataforma</p>

                <div className="flex justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setRatingStars(i + 1)}
                            className="transition transform hover:scale-110"
                        >
                            <span className={`text-4xl ${i < ratingStars ? 'text-yellow-400' : 'text-slate-300'}`}>★</span>
                        </button>
                    ))}
                </div>

                <p className="text-center text-lg font-bold text-slate-900 mb-6">{ratingStars.toFixed(1)} / 5</p>

                <button
                    onClick={async () => {
                        if (selectedCase) {
                            await rateOtherUser(selectedCase.id, ratingStars);
                            setShowRatingModal(false);
                            setRatingStars(4.5);
                        }
                    }}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mb-3"
                >
                    Confirmar Avaliação
                </button>
                <button
                    onClick={() => {
                        setShowRatingModal(false);
                        setRatingStars(4.5);
                    }}
                    className="w-full py-3 text-slate-600 hover:text-slate-900 font-medium"
                >
                    Depois
                </button>
            </div>
        </div>
    );

    // Verificar se passou 3 dias desde o match
    useEffect(() => {
        if (selectedCase && selectedCase.ratingDeadlineAt && selectedCase.lawyerId && !selectedCase.clientRatedAt) {
            const deadline = new Date(selectedCase.ratingDeadlineAt);
            const now = new Date();
            if (now >= deadline) {
                setShowRatingModal(true);
            }
        }
    }, [selectedCase]);

    const handleAnalyze = async () => {
        if (!description) return;
        setLoading(true);
        const result = await analyzeCaseDescription(description);
        setAnalysis(result);
        setLoading(false);
        setStep(2);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setUploadingImage(true);
        const newImages: any[] = [];

        for (let i = 0; i < Math.min(files.length, 5); i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = async (event) => {
                const base64 = event.target?.result as string;
                newImages.push({
                    name: file.name,
                    size: file.size,
                    data: base64,
                    uploadedAt: new Date().toISOString()
                });

                if (newImages.length === Math.min(files.length, 5)) {
                    setCaseImages(prev => [...prev, ...newImages]);
                    setUploadingImage(false);
                }
            };

            reader.readAsDataURL(file);
        }
    };

    const removeImage = (index: number) => {
        setCaseImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!analysis) return;

        await createCase({
            title: analysis.title,
            description: description,
            area: analysis.area,
            complexity: analysis.complexity,
            city: city || 'Online',
            uf: uf || 'BR',
            price: 0,
            images: caseImages.length > 0 ? caseImages : null
        });
        setStep(1);
        setDescription('');
        setAnalysis(null);
        setCaseImages([]);
        setView('dashboard');
    };

    const renderContent = () => {
        switch (view) {
            case 'profile': return <UserProfile />;
            case 'notifications': return <NotificationList />;
            case 'new-case':
                return (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                        {step === 1 ? (
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                <h2 className="text-2xl font-bold mb-4">Novo Caso</h2>
                                <p className="text-slate-500 mb-6">Descreva seu problema jurídico. Nossa IA irá analisar e categorizar para você.</p>
                                <textarea
                                    className="w-full h-40 p-4 border border-slate-200 rounded-xl mb-6 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Ex: Comprei um produto que veio com defeito e a loja se recusa a trocar..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />

                                {/* Image Upload Section */}
                                <div className="mb-6 p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 transition">
                                    <label className="cursor-pointer flex flex-col items-center justify-center">
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <p className="text-sm font-medium text-slate-600">Clique para adicionar imagens (até 5)</p>
                                        <p className="text-xs text-slate-500 mt-1">JPG, PNG ou GIF - Até 5MB cada</p>
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                                    </label>
                                </div>

                                {/* Image Preview */}
                                {caseImages.length > 0 && (
                                    <div className="mb-6 grid grid-cols-3 gap-3">
                                        {caseImages.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img src={img.data} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded-lg" />
                                                <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button onClick={handleAnalyze} disabled={loading || !description} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center hover:bg-slate-800 transition">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analisar Caso'}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                <h2 className="text-2xl font-bold mb-6">Revisão do Caso</h2>

                                <div className="space-y-4 mb-8">
                                    <div className="bg-indigo-50 p-4 rounded-xl">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Título Sugerido</span>
                                        <p className="font-bold text-lg text-indigo-900">{analysis?.title}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-xl">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Área</span>
                                            <p className="font-bold text-slate-900">{analysis?.area}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Complexidade</span>
                                            <p className="font-bold text-slate-900">{analysis?.complexity}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Cidade</label>
                                            <input value={city} onChange={e => setCity(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50" placeholder="Ex: São Paulo" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Estado</label>
                                            <select value={uf} onChange={e => setUf(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50">
                                                <option value="">UF</option>
                                                {BRAZIL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(1)} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-800 transition">Voltar</button>
                                    <button onClick={handleCreate} disabled={!city || !uf} className="flex-[2] bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                        Confirmar e Publicar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl font-bold text-slate-900">Meus Casos</h2>
                                <button onClick={() => setView('new-case')} className="text-sm font-bold text-indigo-600 hover:underline">+ Novo</button>
                            </div>
                            {myCases.length === 0 ? (
                                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                                    <p className="text-slate-500 mb-4">Você ainda não tem casos.</p>
                                    <button onClick={() => setView('new-case')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Começar Agora</button>
                                </div>
                            ) : (
                                myCases.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedCase(c)}
                                        className={`p-4 rounded-xl border cursor-pointer transition ${selectedCase?.id === c.id ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                                    >
                                        <div className="flex justify-between mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === 'OPEN' ? 'bg-green-100 text-green-700' : c.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {c.status === 'OPEN' ? 'Aguardando' : c.status === 'ACTIVE' ? 'Em Andamento' : 'Encerrado'}
                                            </span>
                                            <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 line-clamp-1">{c.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="lg:col-span-2">
                            {selectedCase ? (
                                selectedCase.status === 'OPEN' ? (
                                    <div className="bg-white h-full min-h-[400px] rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-8">
                                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                            <Briefcase className="w-6 h-6 text-indigo-600" />
                                            Advogados Interessados
                                        </h3>

                                        {selectedCase.interestedLawyers && selectedCase.interestedLawyers.length > 0 ? (
                                            <div className="w-full max-w-lg space-y-4">
                                                <p className="text-center text-slate-500 text-sm mb-4">Selecione um advogado abaixo para iniciar o atendimento.</p>
                                                {selectedCase.interestedLawyers.map(lawyer => (
                                                    <div key={lawyer.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition bg-slate-50 group">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="relative">
                                                                    <img src={lawyer.avatar} alt="Avatar" className="w-12 h-12 rounded-full border border-slate-200" />
                                                                    {lawyer.verified && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white"><Check className="w-2 h-2 text-white" /></div>}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center">
                                                                        <p className="font-bold text-slate-900">{lawyer.name}</p>
                                                                        {lawyer.verified && <LawyerVerificationBadge lawyer={lawyer} />}
                                                                    </div>
                                                                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                                                                        <span>OAB: {lawyer.oab || 'N/A'}</span>
                                                                        {lawyer.isPremium && <span className="bg-yellow-100 text-yellow-700 px-1.5 rounded-full flex items-center"><Sparkles className="w-2 h-2 mr-0.5" /> PRO</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await openChatWithLawyer(selectedCase.id, lawyer.id);
                                                                        await hireLawyer(selectedCase.id, lawyer.id);
                                                                    } catch (error: any) {
                                                                        if (error.message === 'INSUFFICIENT_BALANCE') {
                                                                            setShowBuyModal(true);
                                                                        } else {
                                                                            alert('Erro ao abrir chat. Tente novamente.');
                                                                        }
                                                                    }
                                                                }}
                                                                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-600 transition shadow-sm group-hover:shadow-md"
                                                            >
                                                                Contratar
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                                            <div>
                                                                <label className="text-slate-600 font-bold">Email</label>
                                                                <p className="text-slate-700">{lawyer.email || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-slate-600 font-bold">OAB</label>
                                                                <p className="text-slate-700">{lawyer.oab || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        {lawyer.bio && (
                                                            <div className="text-xs mb-3">
                                                                <label className="text-slate-600 font-bold">Biografia</label>
                                                                <p className="text-slate-700 line-clamp-2">{lawyer.bio}</p>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center space-x-1 text-xs">
                                                            <span className="text-slate-600 font-bold">Avaliação:</span>
                                                            <div className="flex items-center">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i} className={`text-lg ${i < Math.floor(selectedCase.clientRating || 4.5) ? 'text-yellow-400' : 'text-slate-300'}`}>★</span>
                                                                ))}
                                                                <span className="ml-1 text-slate-600 font-bold">{selectedCase.clientRating?.toFixed(1) || '4.5'}/5</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative mb-6">
                                                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center animate-pulse">
                                                        <Search className="w-8 h-8 text-indigo-400" />
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-slate-700 mb-2">Buscando Advogados...</h4>
                                                <p className="text-slate-500 max-w-md text-center text-sm leading-relaxed">
                                                    Seu caso está visível na vitrine de oportunidades. Assim que um advogado manifestar interesse, você receberá uma notificação e o perfil dele aparecerá aqui para você aprovar.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <Chat
                                        currentCase={selectedCase}
                                        currentUser={currentUser!}
                                        otherPartyName={selectedCase.lawyerId ? (users.find(u => u.id === selectedCase.lawyerId)?.name || "Dr. Advogado") : "Dr. Advogado"}
                                        otherParty={selectedCase.lawyerId ? users.find(u => u.id === selectedCase.lawyerId) : undefined}
                                        onClose={() => setSelectedCase(null)}
                                    />
                                )
                            ) : (
                                <div className="bg-slate-50 h-full min-h-[400px] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                    <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                                    <p>Selecione um caso para ver detalhes</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-20'} lg:w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 transition-all duration-300`}>
                <div className="lg:hidden p-3 flex justify-center">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 hover:bg-slate-700 rounded-lg transition text-indigo-300">
                        {sidebarOpen ? (
                            <X className="w-7 h-7" />
                        ) : (
                            <Menu className="w-7 h-7" />
                        )}
                    </button>
                </div>
                <div className="p-4 lg:p-6 flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg flex-shrink-0">
                        <Scale className="w-6 h-6 text-white" />
                    </div>
                    <div className={`text-xl font-bold ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
                        <span className="text-indigo-300">Social</span><span className="text-violet-300">Jurídico</span>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-8">
                    <button onClick={() => setView('dashboard')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <LayoutGrid className="w-5 h-5 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block font-medium`}>Painel</span>
                    </button>
                    <button onClick={() => setView('new-case')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition ${view === 'new-case' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Plus className="w-5 h-5 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block font-medium`}>Novo Caso</span>
                    </button>
                    <button onClick={() => setView('notifications')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition ${view === 'notifications' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Bell className="w-5 h-5 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block font-medium`}>Notificações</span>
                    </button>
                    <button onClick={() => setView('profile')} className={`w-full flex items-center space-x-3 p-3 rounded-xl transition ${view === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <UserIcon className="w-5 h-5 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block font-medium`}>Meu Perfil</span>
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-800 space-y-4">
                    <button onClick={logout} className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-400 hover:bg-red-900/20 transition">
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block font-medium`}>Sair</span>
                    </button>
                    <div className={`text-center ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
                        <p className="text-xs text-slate-400">
                            Powered by <a href="https://nexos-digital.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">NexosDigital</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 overflow-y-auto flex flex-col">
                <div className="flex-1">
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {view === 'new-case' ? 'Novo Caso' : view === 'dashboard' ? 'Painel' : view.replace('-', ' ').charAt(0).toUpperCase() + view.replace('-', ' ').slice(1)}
                            </h1>
                            <p className="text-slate-500">Bem-vindo, {currentUser?.name}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <img src={currentUser?.avatar} alt="Profile" className="w-10 h-10 rounded-full border border-slate-200" />
                        </div>
                    </header>
                    {renderContent()}
                </div>
                <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                    Powered by <a href="https://nexos-digital.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 font-semibold transition">NexosDigital</a>
                </footer>
            </div>
            {showBuyModal && <BuyJurisModal />}
            {showRatingModal && <RatingModal />}
        </div>
    );
};

export const LawyerDashboard: React.FC = () => {
    const { currentUser, cases, acceptCase, logout, subscribePremium, buyJuris, notifications, banners, fetchBanners } = useApp();
    const { handleClick: recordClick, showLimitModal, setShowLimitModal } = useClickLimit();
    const [view, setView] = useState<ViewType>('market');
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [filterArea, setFilterArea] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [interestedCaseIds, setInterestedCaseIds] = useState<Set<string>>(new Set());
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Garantir que banners são carregados
    useEffect(() => {
        console.log('🔍 LawyerDashboard montado, buscando banners...');
        fetchBanners();
    }, []);

    // Buscar casos onde o advogado manifestou interesse
    useEffect(() => {
        const fetchInterestedCases = async () => {
            if (!currentUser?.id) return;
            const { data } = await supabase
                .from('case_interests')
                .select('case_id')
                .eq('lawyer_id', currentUser.id);
            if (data) setInterestedCaseIds(new Set(data.map((i: any) => i.case_id)));
        };
        fetchInterestedCases();
    }, [currentUser?.id]);

    // Normalizar termos jurídicos duplicados
    const normalizeArea = (area: string) => {
        if (!area) return '';
        const normalized = area.toLowerCase()
            .replace(/direito\s+(?:do\s+)?trabalho|direito\s+trabalhista/gi, 'trabalho')
            .replace(/direito\s+(?:da\s+)?família|direito\s+familiarista/gi, 'família')
            .replace(/direito\s+(?:do\s+)?consumidor|direito\s+consumerista/gi, 'consumidor');
        return normalized;
    };

    const availableCases = cases.filter(c => {
        if (c.status !== 'OPEN') return false;
        if (!searchKeyword) return true;
        const keyword = normalizeArea(searchKeyword);
        const normalizedArea = normalizeArea(c.area || '');
        return (
            normalizedArea.includes(keyword) ||
            c.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            c.city?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            c.uf?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            c.complexity?.toLowerCase().includes(searchKeyword.toLowerCase())
        );
    });
    const myActiveCases = cases.filter(c =>
        c.lawyerId === currentUser?.id || interestedCaseIds.has(c.id)
    );

    const [processingPaymentLawyer, setProcessingPaymentLawyer] = useState(false);

    const BuyJurisModal = () => (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in">
                <h2 className="text-2xl font-bold mb-2">Comprar Juris</h2>
                <p className="text-slate-500 mb-2">Escolha um pacote para créditos instantâneos</p>
                <p className="text-slate-400 text-sm mb-8">Adicione créditos e manifeste interesse em demandas de seus clientes.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { juris: 10, price: 9.90, popular: false },
                        { juris: 20, price: 16.90, popular: true },
                        { juris: 50, price: 39.90, popular: false }
                    ].map(pkg => (
                        <div key={pkg.juris} className={`p-6 rounded-xl border-2 transition cursor-pointer ${pkg.popular ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-slate-200 hover:border-indigo-300'}`}>
                            {pkg.popular && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full mb-3 inline-block">Mais Popular</span>}
                            <p className="text-3xl font-bold text-slate-900">{pkg.juris}</p>
                            <p className="text-sm text-slate-500 mb-4">Juris</p>
                            <p className="text-2xl font-bold text-indigo-600 mb-4">R$ {pkg.price.toFixed(2)}</p>
                            <button
                                onClick={async () => {
                                    setProcessingPaymentLawyer(true);
                                    try {
                                        await buyJuris(pkg.juris);
                                    } finally {
                                        setProcessingPaymentLawyer(false);
                                    }
                                }}
                                disabled={processingPaymentLawyer}
                                className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center ${pkg.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50' : 'bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-50'}`}
                            >
                                {processingPaymentLawyer ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {processingPaymentLawyer ? 'Processando...' : 'Comprar'}
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => setShowBuyModal(false)}
                    disabled={processingPaymentLawyer}
                    className="w-full py-3 text-slate-600 hover:text-slate-900 font-medium disabled:opacity-50"
                >
                    Fechar
                </button>
            </div>
        </div>
    );

    const handleNavigate = (targetView: ViewType) => {
        const proTools: ViewType[] = ['tool-crm', 'tool-docs', 'tool-writer', 'tool-calc', 'tool-juris', 'tool-agenda', 'tool-intake'];

        if (proTools.includes(targetView) && !currentUser?.isPremium) {
            setShowPremiumModal(true);
        } else {
            setView(targetView);
        }
    };

    const [processingSubscription, setProcessingSubscription] = useState(false);

    const handleSubscribe = async () => {
        setProcessingSubscription(true);
        try {
            await subscribePremium();
        } finally {
            setProcessingSubscription(false);
        }
    }

    const PremiumModal = () => (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden relative border border-slate-700">
                <button
                    onClick={() => setShowPremiumModal(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-700 rounded-full transition"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                <div className="grid md:grid-cols-5 h-full">
                    <div className="md:col-span-2 bg-gradient-to-b from-indigo-600 to-purple-800 p-8 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <div className="bg-white/10 backdrop-blur-md inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border border-white/20 mb-6">
                                <Sparkles className="w-3 h-3 mr-1 text-yellow-300" /> <span className="text-yellow-100">Social</span><span className="text-amber-100">Jurídico</span> PRO
                            </div>
                            <h2 className="text-3xl font-extrabold mb-2 leading-tight">Desbloqueie o poder máximo da advocacia.</h2>
                            <p className="text-indigo-100 text-sm">Ferramentas de IA e gestão para quem joga em outro nível.</p>
                        </div>
                        <div className="relative z-10">
                            <p className="text-5xl font-extrabold text-white">R$ 69<span className="text-2xl text-indigo-200">,99</span></p>
                            <p className="text-indigo-200 text-xs mt-1">cobrado mensalmente</p>
                        </div>
                    </div>

                    <div className="md:col-span-3 p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center">
                            O que está incluído:
                        </h3>
                        <div className="grid grid-cols-1 gap-4 mb-8">
                            <div className="flex items-start space-x-3">
                                <div className="bg-indigo-900/50 p-2 rounded-lg"><Users className="w-5 h-5 text-indigo-400" /></div>
                                <div>
                                    <h4 className="font-bold text-sm">CRM & KYC Avançado</h4>
                                    <p className="text-xs text-slate-400">Gestão de clientes com análise de risco e dossiê completo.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="bg-indigo-900/50 p-2 rounded-lg"><Folders className="w-5 h-5 text-indigo-400" /></div>
                                <div>
                                    <h4 className="font-bold text-sm">Smart Docs</h4>
                                    <p className="text-xs text-slate-400">Organização automática e vinculação de arquivos.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="bg-indigo-900/50 p-2 rounded-lg"><PenTool className="w-5 h-5 text-indigo-400" /></div>
                                <div>
                                    <h4 className="font-bold text-sm">Redator IA</h4>
                                    <p className="text-xs text-slate-400">Geração de minutas com um clique usando dados do CRM.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="bg-indigo-900/50 p-2 rounded-lg"><Calculator className="w-5 h-5 text-indigo-400" /></div>
                                <div>
                                    <h4 className="font-bold text-sm">Calculadoras Jurídicas</h4>
                                    <p className="text-xs text-slate-400">Trabalhista, Cível, Penal, Família e mais.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="bg-indigo-900/50 p-2 rounded-lg"><BrainCircuit className="w-5 h-5 text-indigo-400" /></div>
                                <div>
                                    <h4 className="font-bold text-sm">Inteligência Estratégica</h4>
                                    <p className="text-xs text-slate-400">Análise de jurisprudência e triagem automática.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-xl mb-6 flex items-center justify-between border border-slate-700">
                            <div className="flex items-center space-x-2">
                                <Coins className="w-5 h-5 text-yellow-400" />
                                <span className="font-bold text-sm text-yellow-400">BÔNUS EXCLUSIVO</span>
                            </div>
                            <span className="text-white text-sm font-bold">+20 Juris todo mês</span>
                        </div>

                        <button
                            onClick={handleSubscribe}
                            disabled={processingSubscription}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center text-lg"
                        >
                            {processingSubscription ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    Assinar Agora <ChevronRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (view) {
            case 'tool-crm': return <ToolCRM />;
            case 'tool-docs': return <ToolDocs />;
            case 'tool-juris': return <ToolJuris />;
            case 'tool-writer': return <ToolWriter />;
            case 'tool-agenda': return <ToolAgenda />;
            case 'tool-intake': return <ToolIntake />;
            case 'tool-calc': return <ToolCalculators />;
            case 'system-docs': return <SystemDocumentation />;
            case 'profile': return <UserProfile />;
            case 'notifications': return <NotificationList />;
            case 'market':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-full mx-auto px-4 pt-8">
                        {/* Banner Esquerdo */}
                        <div className="hidden lg:flex flex-col">
                            {(() => {
                                console.log('🎯 Renderizando Banner 1. Total banners:', banners.length, 'Dados:', banners);
                                const banner1 = banners.find(b => b.name === 'banner_1');
                                console.log('✅ Banner 1 encontrado?', !!banner1, 'URL:', banner1?.imageUrl);
                                return (
                                    <a href={banner1?.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="fixed hover:opacity-85 transition group" style={{ top: '160px', left: 'calc(50% - 648px)', width: '280px' }}>
                                        <div className="bg-white rounded-xl overflow-hidden shadow-2xl hover:shadow-indigo-300 transition border border-slate-200 group-hover:border-indigo-400 h-[584px]">
                                            <img src={banner1?.imageUrl || bannerTeste} alt="Banner" className="w-full h-full object-cover" />
                                        </div>
                                    </a>
                                );
                            })()}
                        </div>

                        {/* Feed do Meio */}
                        <div className="lg:col-span-3">
                            <div className="flex gap-4 mb-6 sticky top-0 bg-white/95 backdrop-blur-sm z-10 pb-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por qualquer coisa..."
                                        value={searchKeyword}
                                        onChange={e => setSearchKeyword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 pb-12">
                                {availableCases.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 text-lg">Nenhum caso para sua busca</p>
                                    </div>
                                ) : (
                                    availableCases.map(c => {
                                        const hasShownInterest = c.interestedLawyers?.some(l => l.id === currentUser?.id);
                                        const interestCount = c.interestedLawyers?.length || 0;

                                        return (
                                            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all">
                                                {/* Card Header */}
                                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                                                            {c.area?.charAt(0) || 'C'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-900 text-sm">{c.area}</p>
                                                            <p className="text-xs text-slate-500">{c.city}/{c.uf}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${c.complexity === 'Alta' ? 'bg-red-100 text-red-700' : c.complexity === 'Média' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                        {c.complexity}
                                                    </span>
                                                </div>

                                                {/* Card Images */}
                                                {c.images && Array.isArray(c.images) && c.images.length > 0 && (
                                                    <div className="w-full bg-slate-100 mt-2 pt-3">
                                                        <div className="flex overflow-x-auto gap-2 px-5 pb-3">
                                                            {c.images.map((img: any, idx: number) => (
                                                                <img key={idx} src={img.data || img} alt={`Case ${idx}`} className="h-80 w-80 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 hover:shadow-lg transition-all" onClick={() => setSelectedImage(img.data || img)} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Card Content */}
                                                <div className="px-5 py-4">
                                                    <h3 className="font-bold text-slate-900 text-lg mb-2">{c.title}</h3>
                                                    <p className="text-slate-600 text-base leading-relaxed mb-3">{c.description}</p>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-slate-400" /> {new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                                                        {interestCount > 0 && (
                                                            <span className="flex items-center text-indigo-600 font-bold"><Users className="w-4 h-4 mr-1" /> {interestCount}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Card Footer */}
                                                <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-900 flex items-center"><Coins className="w-4 h-4 text-yellow-500 mr-1" /> 5 Juris</span>
                                                        <ShareButton caseData={c} />
                                                    </div>
                                                    {hasShownInterest ? (
                                                        <button disabled className="flex-1 bg-green-100 text-green-700 px-4 py-2.5 rounded-full text-sm font-bold flex items-center justify-center cursor-default">
                                                            <Check className="w-4 h-4 mr-1.5" /> Interesse Enviado
                                                        </button>
                                                    ) : (
                                                        <button onClick={async () => {
                                                            try {
                                                                await acceptCase(c.id);
                                                            } catch (error: any) {
                                                                if (error.message === 'INSUFFICIENT_BALANCE') {
                                                                    setShowBuyModal(true);
                                                                } else if (error.message === 'DUPLICATE_INTEREST') {
                                                                    alert('Você já manifestou interesse neste caso!');
                                                                } else {
                                                                    alert('Erro ao manifestar interesse. Tente novamente.');
                                                                }
                                                            }
                                                        }} className="flex-1 bg-slate-900 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-full text-sm font-bold transition-colors">
                                                            Manifestar Interesse
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Banner Direito */}
                        <div className="hidden lg:flex flex-col">
                            {(() => {
                                const banner2 = banners.find(b => b.name === 'banner_2');
                                return (
                                    <a href={banner2?.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="fixed hover:opacity-85 transition group" style={{ top: '160px', right: 'calc(50% - 898px)', width: '280px' }}>
                                        <div className="bg-white rounded-xl overflow-hidden shadow-2xl hover:shadow-purple-300 transition border border-slate-200 group-hover:border-indigo-400 h-[584px]">
                                            <img src={banner2?.imageUrl || bannerTeste} alt="Banner" className="w-full h-full object-cover" />
                                        </div>
                                    </a>
                                );
                            })()}
                        </div>
                    </div>
                );
            case 'my-cases':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
                        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="font-bold text-slate-700">Casos Ativos</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {myActiveCases.length === 0 && (
                                    <p className="text-center text-slate-400 text-sm py-8">Nenhum caso ativo.</p>
                                )}
                                {myActiveCases.map(c => {
                                    const isInterested = interestedCaseIds.has(c.id) && c.lawyerId !== currentUser?.id;
                                    const isActive = c.lawyerId === currentUser?.id;
                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => !isInterested && setSelectedCase(c)}
                                            className={`p-4 rounded-xl cursor-pointer transition border relative ${selectedCase?.id === c.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'} ${isInterested ? 'opacity-75 bg-amber-50' : ''}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-800 text-sm">{c.title}</h4>
                                                    <p className="text-xs text-slate-500 mt-1 truncate">Cliente ID: {c.clientId.substring(0, 8)}</p>
                                                </div>
                                                {isInterested && <Lock className="w-4 h-4 text-amber-600 ml-2 flex-shrink-0 mt-1" />}
                                            </div>
                                            {isInterested && (
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 mt-2 inline-block">Aguardando Cliente</span>
                                            )}
                                            {isActive && (
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 mt-2 inline-block">Em Andamento</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="lg:col-span-2 flex flex-col">
                            {selectedCase ? (
                                <Chat
                                    currentCase={selectedCase}
                                    currentUser={currentUser!}
                                    otherPartyName="Cliente"
                                    onClose={() => setSelectedCase(null)}
                                />
                            ) : (
                                <div className="flex-1 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                                    <Briefcase className="w-16 h-16 mb-4 opacity-50" />
                                    <p className="font-medium">Selecione um caso para iniciar o atendimento</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            default: return <div className="p-8 text-center text-slate-500">Selecione uma ferramenta no menu.</div>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Modal de Paywall */}
            {showPremiumModal && <PremiumModal />}
            {/* Modal de Limite de Cliques */}
            {showBuyModal && <BuyJurisModal />}
            {/* Modal de Imagem */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 bg-slate-900 text-white p-2 rounded-lg hover:bg-indigo-600 transition z-10">
                            <X className="w-6 h-6" />
                        </button>
                        <img src={selectedImage} alt="Caso em detalhe" className="w-full h-auto object-contain" />
                    </div>
                </div>
            )}

            {/* Lawyer Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-20'} lg:w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 transition-all duration-300`}>
                <div className="lg:hidden p-3 flex justify-center">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 hover:bg-slate-700 rounded-lg transition text-indigo-300">
                        {sidebarOpen ? (
                            <X className="w-7 h-7" />
                        ) : (
                            <Menu className="w-7 h-7" />
                        )}
                    </button>
                </div>
                <div className="p-4 lg:p-6 flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg flex-shrink-0">
                        <Scale className="w-6 h-6 text-white" />
                    </div>
                    <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
                        <div className="text-xl font-bold">
                            <span className="text-indigo-300">Social</span><span className="text-violet-300">Jurídico</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-indigo-400">Advogado</span>
                    </div>
                </div>

                <div className="px-4 mb-4 space-y-2 hidden lg:flex flex-col">
                    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                        {!currentUser?.isPremium && (
                            <button onClick={() => setShowPremiumModal(true)} className="w-full bg-gradient-to-r from-amber-400 to-yellow-600 text-black text-xs font-bold py-1.5 rounded-lg hover:brightness-110 transition">
                                Seja Premium
                            </button>
                        )}
                    </div>
                    <ClickCounter />
                </div>

                <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto pb-2">
                    <p className={`px-2 text-[9px] font-bold text-slate-500 uppercase mt-2 mb-1 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>Navegação</p>
                    <button onClick={() => handleNavigate('market')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'market' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Oportunidades</span>
                    </button>
                    <button onClick={() => handleNavigate('my-cases')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'my-cases' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Meus Casos</span>
                    </button>

                    <p className={`px-2 text-[8px] font-bold text-slate-500 uppercase mt-3 mb-1 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>Ferramentas Pro</p>
                    <button onClick={() => handleNavigate('tool-crm')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'tool-crm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>CRM & KYC</span>
                    </button>
                    <button onClick={() => handleNavigate('tool-docs')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'tool-docs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Folders className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Smart Docs</span>
                    </button>
                    <button onClick={() => handleNavigate('tool-writer')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'tool-writer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <PenTool className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Redator IA</span>
                    </button>
                    <button onClick={() => handleNavigate('tool-calc')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'tool-calc' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Calculator className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Calculadoras</span>
                    </button>
                    <button onClick={() => handleNavigate('tool-juris')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'tool-juris' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Scale className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Jurisprudência</span>
                    </button>
                    <button onClick={() => handleNavigate('tool-agenda')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'tool-agenda' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Agenda</span>
                    </button>
                    <button onClick={() => handleNavigate('tool-intake')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'tool-intake' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <ClipboardList className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Triagem</span>
                    </button>

                    <p className={`px-2 text-[8px] font-bold text-slate-500 uppercase mt-4 mb-1 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>Sistema</p>
                    <button onClick={() => handleNavigate('system-docs')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'system-docs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <BookOpen className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>📖 Documentação</span>
                    </button>
                </nav>

                <div className="border-t border-slate-800 pt-2">
                    <button onClick={() => handleNavigate('notifications')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'notifications' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <div className="relative flex-shrink-0">
                            <Bell className="w-4 h-4" />
                            {Array.isArray(notifications) && notifications.filter(n => n?.userId === currentUser?.id && !n?.read).length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[7px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                    {notifications.filter(n => n?.userId === currentUser?.id && !n?.read).length}
                                </span>
                            )}
                        </div>
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Notificações</span>
                    </button>
                    <button onClick={() => handleNavigate('profile')} className={`w-full flex items-center space-x-2.5 p-2.5 rounded-lg transition ${view === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Settings className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Ajustes</span>
                    </button>
                </div>
                <div className="px-2 py-2 border-t border-slate-800 space-y-1">
                    <button onClick={logout} className="w-full flex items-center space-x-2.5 p-2.5 rounded-lg text-red-400 hover:bg-red-900/20 transition">
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span className={`${sidebarOpen ? 'block' : 'hidden'} lg:block text-sm font-medium`}>Sair</span>
                    </button>
                    <div className={`text-center ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
                        <p className="text-[10px] text-slate-400">
                            Powered by <a href="https://nexos-digital.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">NexosDigital</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Lawyer Main Content */}
            <div className="flex-1 ml-20 lg:ml-64 p-8 overflow-y-auto flex flex-col">
                <div className="flex-1">
                    <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <h1 className="text-xl font-bold text-slate-900 flex items-center">
                            {view === 'market' && <><Globe className="w-6 h-6 mr-2 text-indigo-600" /> Oportunidades em Aberto</>}
                            {view === 'my-cases' && <><Briefcase className="w-6 h-6 mr-2 text-indigo-600" /> Meus Casos Ativos</>}
                            {view.startsWith('tool') && <><Sparkles className="w-6 h-6 mr-2 text-indigo-600" /> Ferramentas Inteligentes</>}
                            {view === 'profile' && 'Meu Perfil'}
                            {view === 'notifications' && 'Central de Notificações'}
                        </h1>
                        <div className="flex items-center space-x-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-900">{currentUser?.name}</p>
                                <div className="flex items-center justify-end space-x-1">
                                    <p className="text-xs text-slate-500">OAB {currentUser?.oab}</p>
                                    {currentUser?.isPremium && <Sparkles className="w-3 h-3 text-yellow-500" />}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs font-bold text-indigo-600">💰 {currentUser?.balance || 0} Juris</p>
                                    <button onClick={() => setShowBuyModal(true)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded transition font-bold">
                                        Comprar
                                    </button>
                                </div>
                            </div>
                            <img src={currentUser?.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt="Avatar" />
                        </div>
                    </header>
                    {renderContent()}
                </div>
            </div>
            {showBuyModal && <BuyJurisModal />}
        </div>
    );
};

export const AdminDashboard: React.FC = () => {
    const { users, toggleLawyerVerification, togglePremiumStatus, logout, banners, updateBanner, addCreditsToUser, deleteUser } = useApp();
    const lawyers = users.filter(u => u.role === UserRole.LAWYER);
    const [searchTerm, setSearchTerm] = useState('');
    const filteredLawyers = lawyers.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Estado para resetar senha
    const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Estado para upload de banners
    const [banner1Image, setBanner1Image] = useState<string>('');
    const [banner1Link, setBanner1Link] = useState<string>('');
    const [banner2Image, setBanner2Image] = useState<string>('');
    const [banner2Link, setBanner2Link] = useState<string>('');
    const [savingBanner1, setSavingBanner1] = useState(false);
    const [savingBanner2, setSavingBanner2] = useState(false);

    // Estados para modal de mudança de senha
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // Handler para alterar senha direto
    const handleChangePassword = async () => {
        setPasswordError('');

        if (!newPassword) {
            setPasswordError('Informe uma nova senha');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas não conferem');
            return;
        }

        if (!selectedUserForPassword?.email) return;

        setPasswordLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000';
            const response = await fetch(`${apiUrl}/api/auth/admin-reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUserForPassword.id,
                    newPassword: newPassword
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                console.error('Erro ao parsear JSON:', e, 'Response status:', response.status);
                throw new Error('Servidor retornou resposta inválida');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao alterar senha');
            }

            alert(`✅ Senha alterada com sucesso para ${selectedUserForPassword.name}!`);
            setShowPasswordModal(false);
            setSelectedUserForPassword(null);
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
        } catch (error: any) {
            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
            setPasswordError(errorMsg);
            console.error('Password change error:', error);
        } finally {
            setPasswordLoading(false);
        }
    };

    // Carregar dados dos banners ao montar
    useEffect(() => {
        const banner1 = banners.find(b => b.name === 'banner_1');
        const banner2 = banners.find(b => b.name === 'banner_2');

        if (banner1) {
            setBanner1Image(banner1.imageUrl);
            setBanner1Link(banner1.linkUrl);
        }
        if (banner2) {
            setBanner2Image(banner2.imageUrl);
            setBanner2Link(banner2.linkUrl);
        }
    }, [banners]);

    // Upload de imagem para Supabase Storage
    const uploadBannerImage = async (file: File, bannerName: string): Promise<string> => {
        const fileName = `${bannerName}_${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('banners')
            .upload(fileName, file);

        if (error) throw error;

        // Gerar URL pública
        const { data: publicUrl } = supabase.storage
            .from('banners')
            .getPublicUrl(fileName);

        return publicUrl.publicUrl;
    };

    const handleBanner1ImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                setSavingBanner1(true);
                const imageUrl = await uploadBannerImage(file, 'banner_1');
                setBanner1Image(imageUrl);
                await updateBanner('banner_1', imageUrl, banner1Link);
                alert('Banner 1 atualizado com sucesso!');
            } catch (error: any) {
                alert('Erro ao fazer upload: ' + error.message);
            } finally {
                setSavingBanner1(false);
            }
        }
    };

    const normalizeUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return 'https://' + url;
    };

    const handleBanner1LinkChange = async () => {
        if (!banner1Image) {
            alert('Por favor, primeiro adicione uma imagem para o Banner 1');
            return;
        }
        try {
            setSavingBanner1(true);
            const normalizedLink = normalizeUrl(banner1Link);
            await updateBanner('banner_1', banner1Image, normalizedLink);
            setBanner1Link(normalizedLink);
            alert('Link do Banner 1 atualizado com sucesso!');
        } catch (error: any) {
            alert('Erro ao atualizar link: ' + error.message);
        } finally {
            setSavingBanner1(false);
        }
    };

    const handleBanner2ImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                setSavingBanner2(true);
                const imageUrl = await uploadBannerImage(file, 'banner_2');
                setBanner2Image(imageUrl);
                await updateBanner('banner_2', imageUrl, banner2Link);
                alert('Banner 2 atualizado com sucesso!');
            } catch (error: any) {
                alert('Erro ao fazer upload: ' + error.message);
            } finally {
                setSavingBanner2(false);
            }
        }
    };

    const handleBanner2LinkChange = async () => {
        if (!banner2Image) {
            alert('Por favor, primeiro adicione uma imagem para o Banner 2');
            return;
        }
        try {
            setSavingBanner2(true);
            const normalizedLink = normalizeUrl(banner2Link);
            await updateBanner('banner_2', banner2Image, normalizedLink);
            setBanner2Link(normalizedLink);
            alert('Link do Banner 2 atualizado com sucesso!');
        } catch (error: any) {
            alert('Erro ao atualizar link: ' + error.message);
        } finally {
            setSavingBanner2(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans">
            <header className="flex justify-between items-center mb-12 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center space-x-3">
                    <div className="bg-slate-900 p-2.5 rounded-lg">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Painel Administrativo</h1>
                        <p className="text-slate-500 text-sm">Controle Geral do Sistema</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={logout} className="flex items-center text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition border border-transparent hover:border-red-200">
                        <LogOut className="w-5 h-5 mr-2" /> Sair
                    </button>
                    <span className="text-xs text-slate-500">
                        Powered by <a href="https://wa.me/5532991075164" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-slate-900 font-semibold transition">NexosDigital</a>
                    </span>
                </div>
            </header>

            {/* Seção de Gerenciamento de Banners */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-indigo-600" />
                    Gerenciamento de Banners
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Banner 1 */}
                    <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                        <h3 className="font-bold text-slate-900 mb-4">Banner 1 (Esquerdo)</h3>

                        {/* Preview da imagem */}
                        <div className="mb-4 bg-white rounded-lg border-2 border-dashed border-slate-300 p-4 h-40 flex items-center justify-center overflow-hidden">
                            {banner1Image ? (
                                <img src={banner1Image} alt="Banner 1 Preview" className="max-h-full max-w-full object-cover rounded" />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Nenhuma imagem</p>
                                </div>
                            )}
                        </div>

                        {/* Input de arquivo */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Foto do Banner</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBanner1ImageChange}
                                disabled={savingBanner1}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 cursor-pointer"
                            />
                        </div>

                        {/* Input de link */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Link do Banner</label>
                            <input
                                type="text"
                                placeholder="https://exemplo.com"
                                value={banner1Link}
                                onChange={(e) => setBanner1Link(e.target.value)}
                                disabled={savingBanner1}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                            />
                        </div>

                        {/* Botão de salvar */}
                        <button
                            onClick={handleBanner1LinkChange}
                            disabled={savingBanner1 || !banner1Image}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center"
                        >
                            {savingBanner1 ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Banner 1
                                </>
                            )}
                        </button>
                    </div>

                    {/* Banner 2 */}
                    <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                        <h3 className="font-bold text-slate-900 mb-4">Banner 2 (Direito)</h3>

                        {/* Preview da imagem */}
                        <div className="mb-4 bg-white rounded-lg border-2 border-dashed border-slate-300 p-4 h-40 flex items-center justify-center overflow-hidden">
                            {banner2Image ? (
                                <img src={banner2Image} alt="Banner 2 Preview" className="max-h-full max-w-full object-cover rounded" />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Nenhuma imagem</p>
                                </div>
                            )}
                        </div>

                        {/* Input de arquivo */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Foto do Banner</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBanner2ImageChange}
                                disabled={savingBanner2}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 cursor-pointer"
                            />
                        </div>

                        {/* Input de link */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Link do Banner</label>
                            <input
                                type="text"
                                placeholder="https://exemplo.com"
                                value={banner2Link}
                                onChange={(e) => setBanner2Link(e.target.value)}
                                disabled={savingBanner2}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                            />
                        </div>

                        {/* Botão de salvar */}
                        <button
                            onClick={handleBanner2LinkChange}
                            disabled={savingBanner2 || !banner2Image}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center"
                        >
                            {savingBanner2 ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Banner 2
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Total Usuários</p>
                    <p className="text-3xl font-bold text-slate-900">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Advogados</p>
                    <p className="text-3xl font-bold text-slate-900">{lawyers.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Pendentes</p>
                    <p className="text-3xl font-bold text-amber-500">{lawyers.filter(l => !l.verified).length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-bold text-slate-500 uppercase">Assinantes PRO</p>
                    <p className="text-3xl font-bold text-indigo-600">{lawyers.filter(l => l.isPremium).length}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
                        Gestão de Advogados
                    </h2>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
                        <tr>
                            <th className="p-4">Advogado</th>
                            <th className="p-4">OAB</th>
                            <th className="p-4">Email</th>
                            <th className="p-4 text-center">Créditos Juris</th>
                            <th className="p-4 text-center">Grupo Facebook</th>
                            <th className="p-4 text-center">Status Verificação</th>
                            <th className="p-4 text-center">Plano PRO</th>
                            <th className="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLawyers.map(lawyer => (
                            <tr key={lawyer.id} className="hover:bg-slate-50 transition">
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <img src={lawyer.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200" />
                                        <span className="font-bold text-slate-900">{lawyer.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-slate-600">{lawyer.oab || 'N/A'}</td>
                                <td className="p-4 text-slate-600">{lawyer.email}</td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button
                                            onClick={() => addCreditsToUser(lawyer.id, Math.max(0, (lawyer.balance || 0) - 5))}
                                            className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold px-2.5 py-1 rounded-lg transition"
                                            title="Remover 5 créditos"
                                        >
                                            −5
                                        </button>
                                        <span className="font-bold text-slate-900 min-w-12 text-center">{lawyer.balance || 0}</span>
                                        <button
                                            onClick={() => addCreditsToUser(lawyer.id, (lawyer.balance || 0) + 5)}
                                            className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-2.5 py-1 rounded-lg transition"
                                            title="Adicionar 5 créditos"
                                        >
                                            +5
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${lawyer.fromFacebookGroup ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {lawyer.fromFacebookGroup ? '✓ Sim' : 'Não'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => toggleLawyerVerification(lawyer.id, !lawyer.verified)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${lawyer.verified ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                    >
                                        {lawyer.verified ? 'Verificado' : 'Pendente/Bloqueado'}
                                    </button>
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => togglePremiumStatus(lawyer.id, !lawyer.isPremium)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center justify-center mx-auto ${lawyer.isPremium ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        {lawyer.isPremium ? <><Sparkles className="w-3 h-3 mr-1" /> Ativo</> : 'Básico'}
                                    </button>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedUserForPassword(lawyer);
                                                setShowPasswordModal(true);
                                            }}
                                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition inline-flex items-center"
                                            title="Resetar senha do usuário"
                                        >
                                            <Lock className="w-4 h-4 mr-1" />
                                            Senha
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Tem certeza que deseja deletar ${lawyer.name}? Esta ação é irreversível.`)) {
                                                    deleteUser(lawyer.id);
                                                }
                                            }}
                                            className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg transition inline-flex items-center"
                                            title="Deletar usuário"
                                        >
                                            <XCircle className="w-4 h-4 mr-1" />
                                            Deletar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Alterar Senha - Direto */}
            {showPasswordModal && selectedUserForPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900">Alterar Senha</h3>
                            <p className="text-sm text-slate-500 mt-1">{selectedUserForPassword.name}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {passwordError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">{passwordError}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Nova Senha</label>
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Digite a nova senha"
                                    disabled={passwordLoading}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Confirmar Senha</label>
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a nova senha"
                                    disabled={passwordLoading}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                                />
                            </div>

                            <label className="flex items-center space-x-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={showNewPassword}
                                    onChange={(e) => setShowNewPassword(e.target.checked)}
                                    disabled={passwordLoading}
                                    className="rounded border-slate-300"
                                />
                                <span>Mostrar Senha</span>
                            </label>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setSelectedUserForPassword(null);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setPasswordError('');
                                }}
                                disabled={passwordLoading}
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-lg transition disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={passwordLoading}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {passwordLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Alterando...</span>
                                    </>
                                ) : (
                                    <span>Alterar Senha</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
