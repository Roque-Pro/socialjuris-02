
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Case, Message, UserRole, CaseStatus, Notification, CRMProfile, SmartDoc, AgendaItem, SavedCalculation, Banner } from './types';
import { supabase } from './services/supabaseClient';
import { createJurisCheckoutSession, createSubscriptionCheckoutSession, redirectToCheckout } from './services/stripeCheckoutService';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  cases: Case[];
  notifications: Notification[];
  crmClients: CRMProfile[]; // Estado global de clientes do CRM
  smartDocs: SmartDoc[]; // Estado global de documentos
  agendaItems: AgendaItem[]; // Estado global da agenda
  savedCalculations: SavedCalculation[]; // Estado global de calculos
  banners: Banner[]; // Estado global de banners
  
  // Click counter
  clicksUsed: number;
  clicksLimit: number;
  clicksResetDate: string;
  recordClick: () => void;
  
  login: (email: string, role: UserRole, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (user: Omit<User, 'id' | 'createdAt' | 'avatar'>, password?: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateUserProfile: (userId: string, data: Partial<User>) => Promise<void>;
  addCreditsToUser: (userId: string, amount: number) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  createCase: (data: { title: string; description: string; area: string; city: string; uf: string; price: number; complexity: string }) => Promise<void>;
  acceptCase: (caseId: string) => Promise<void>; // Manifestar Interesse com travamento de crédito
  hireLawyer: (caseId: string, lawyerId: string) => Promise<void>; // Nova função para o cliente escolher
  openChatWithLawyer: (caseId: string, lawyerId: string) => Promise<void>; // Novo: Abrir chat e consumir créditos
  sendMessage: (caseId: string, content: string, type?: 'text' | 'image' | 'file') => Promise<void>;
  toggleLawyerVerification: (userId: string, status: boolean) => Promise<void>;
  closeCase: (caseId: string, rating: number, comment: string) => Promise<void>;
  rateOtherUser: (caseId: string, rating: number) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  buyJuris: (amount: number) => Promise<void>;
  subscribePremium: () => Promise<void>;
  togglePremiumStatus: (userId: string, status: boolean) => Promise<void>;
  
  // Funções CRM, Docs, Agenda e Calc
  fetchCRMClients: () => Promise<void>;
  addCRMClient: (clientData: Omit<CRMProfile, 'id' | 'lawyerId' | 'createdAt'>) => Promise<void>;
  updateCRMClient: (id: string, data: Partial<CRMProfile>) => Promise<void>;
  fetchSmartDocs: () => Promise<void>;
  addSmartDoc: (docData: Omit<SmartDoc, 'id' | 'lawyerId' | 'date'>) => Promise<void>;
  fetchAgendaItems: () => Promise<void>;
  addAgendaItem: (itemData: Omit<AgendaItem, 'id' | 'lawyerId' | 'status' | 'clientName'>) => Promise<void>;
  updateAgendaItem: (id: string, data: Partial<AgendaItem>) => Promise<void>;
  deleteAgendaItem: (id: string) => Promise<void>;
  fetchSavedCalculations: () => Promise<void>;
  saveCalculation: (calcData: Omit<SavedCalculation, 'id' | 'lawyerId' | 'createdAt'>) => Promise<void>;
  
  // Funções de Banners (Admin)
  fetchBanners: () => Promise<void>;
  updateBanner: (name: string, imageUrl: string, linkUrl: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [crmClients, setCrmClients] = useState<CRMProfile[]>([]);
  const [smartDocs, setSmartDocs] = useState<SmartDoc[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [session, setSession] = useState<any>(null);
  
  // Click counter
  const [clicksUsed, setClicksUsed] = useState<number>(0);
  const clicksLimit = 5000;
  const [clicksResetDate, setClicksResetDate] = useState<string>(new Date().toISOString());

  // Carregar clicks do localStorage ao montar
  useEffect(() => {
    if (currentUser) {
      const savedClicks = localStorage.getItem(`clicks_${currentUser.id}`);
      let savedResetDate = localStorage.getItem(`clicksResetDate_${currentUser.id}`);
      
      if (!savedResetDate) {
        // Primeira vez - inicializar data de reset
        savedResetDate = new Date().toISOString();
        localStorage.setItem(`clicksResetDate_${currentUser.id}`, savedResetDate);
      }
      
      const lastReset = new Date(savedResetDate);
      const now = new Date();
      
      // Se passou 30 dias, reset
      if ((now.getTime() - lastReset.getTime()) > (30 * 24 * 60 * 60 * 1000)) {
        setClicksUsed(0);
        localStorage.setItem(`clicks_${currentUser.id}`, '0');
        const newResetDate = now.toISOString();
        localStorage.setItem(`clicksResetDate_${currentUser.id}`, newResetDate);
        setClicksResetDate(newResetDate);
      } else {
        setClicksUsed(savedClicks ? parseInt(savedClicks) : 0);
        setClicksResetDate(savedResetDate);
      }
    }
  }, [currentUser?.id]);

  const recordClick = () => {
    if (currentUser) {
      const newCount = clicksUsed + 1;
      setClicksUsed(newCount);
      localStorage.setItem(`clicks_${currentUser.id}`, newCount.toString());
    }
  };

  // 1. Monitorar estado de autenticação
  useEffect(() => {
    console.log("🔍 AppProvider: Iniciando verificação de sessão Supabase");
    
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("✅ AppProvider: Session carregada:", session?.user?.email || "sem sessão");
        setSession(session);
        if (session?.user) fetchUserProfile(session.user.id);
      }).catch((error) => {
        console.error("❌ AppProvider: Erro ao carregar sessão:", error);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("🔄 AppProvider: Estado de autenticação mudou:", _event);
        setSession(session);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setCurrentUser(null);
          setCases([]);
          setNotifications([]);
          setCrmClients([]);
          setSmartDocs([]);
          setAgendaItems([]);
          setSavedCalculations([]);
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error("❌ AppProvider: Erro geral no useEffect:", error);
    }
    }, []);

  // 2. Buscar dados quando o usuário estiver logado
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchCases();
      fetchNotifications();
      fetchBanners(); // Buscar banners para todos
      expireLockedCredits();
      
      if (currentUser.role === UserRole.LAWYER) {
          fetchCRMClients();
          fetchSmartDocs();
          fetchAgendaItems();
          fetchSavedCalculations();
      }

      // Configurar Realtime para atualizações
      const channel = supabase
         .channel('public_updates')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, (payload) => {
            fetchCases();
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'case_interests' }, (payload) => {
            fetchCases(); // Atualizar casos quando há novo interesse
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
            fetchCases(); // Atualizar casos para refletir novos messages no chat
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
            fetchNotifications();
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
              fetchUsers();
              if (currentUser) fetchUserProfile(currentUser.id); 
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_clients' }, (payload) => {
            fetchCRMClients();
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'smart_docs' }, (payload) => {
            fetchSmartDocs();
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'agenda_items' }, (payload) => {
            fetchAgendaItems();
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_calculations' }, (payload) => {
            fetchSavedCalculations();
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_banners' }, (payload) => {
            fetchBanners();
         })
         .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser?.id]);

  // --- FUNÇÕES DE BUSCA ---

  const fetchUserProfile = async (userId: string) => {
    console.log("🔍 fetchUserProfile: Buscando perfil do usuário:", userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
      } else if (data) {
        console.log("✅ fetchUserProfile: Perfil carregado com sucesso");
        setCurrentUser({
          ...data,
          createdAt: data.created_at,
          oab: data.oab || undefined,
          verified: data.verified || false,
          isPremium: data.is_premium || false,
          balance: data.balance || 0,
          fromFacebookGroup: data.from_facebook_group || false
        });
      }
    } catch (error) {
      console.error("❌ fetchUserProfile: Erro geral:", error);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
      setUsers(data.map((u: any) => ({ 
        ...u, 
        createdAt: u.created_at,
        isPremium: u.is_premium || false,
        fromFacebookGroup: u.from_facebook_group || false
      })));
    }
  };

  const expireLockedCredits = async () => {
    const now = new Date().toISOString();
    
    // 1. Buscar credit_locks que expiraram
    const { data: expiredLocks, error: selectError } = await supabase
      .from('credit_locks')
      .select('*')
      .eq('status', 'ACTIVE')
      .lt('expires_at', now);

    if (selectError || !expiredLocks || expiredLocks.length === 0) return;

    // 2. Atualizar status para EXPIRED
    const { error: updateError } = await supabase
      .from('credit_locks')
      .update({ status: 'EXPIRED' })
      .lt('expires_at', now)
      .eq('status', 'ACTIVE');

    if (updateError) return;

    // 3. Devolver créditos para cada advogado
    for (const lock of expiredLocks) {
      const { data: lawyerData } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', lock.lawyer_id)
        .single();

      if (lawyerData) {
        await supabase
          .from('profiles')
          .update({ balance: (lawyerData.balance || 0) + lock.locked_credits })
          .eq('id', lock.lawyer_id);
      }
    }

    fetchUsers();
  };

  const fetchCases = async () => {
    // Busca casos, mensagens e agora interesses (com perfil do advogado)
    const { data: casesData } = await supabase
      .from('cases')
      .select(`*, messages (*), case_interests ( lawyer_id, profiles (*) )`)
      .order('created_at', { ascending: false });

    if (casesData) {
      const formattedCases: Case[] = casesData.map((c: any) => {
        // Mapeamento robusto para advogados interessados
        const interested = c.case_interests ? c.case_interests.map((i: any) => {
           // Supabase pode retornar array ou objeto dependendo da relação, garantimos que seja objeto
           const profile = Array.isArray(i.profiles) ? i.profiles[0] : i.profiles;
           if (!profile) return null;
           return {
             ...profile,
             id: i.lawyer_id, // Forçar ID correto
             isPremium: profile.is_premium
           };
        }).filter(Boolean) : [];

        return {
          id: c.id,
          clientId: c.client_id,
          lawyerId: c.lawyer_id,
          title: c.title,
          description: c.description,
          area: c.area,
          status: c.status as CaseStatus,
          city: c.city,
          uf: c.uf,
          createdAt: c.created_at,
          price: c.price,
          complexity: c.complexity,
          isPaid: c.is_paid,
          feedback: c.feedback_rating ? { rating: c.feedback_rating, comment: c.feedback_comment } : undefined,
          interestedLawyers: interested,
          images: c.images || [],
          messages: (c.messages || []).map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            content: m.content,
            type: m.type,
            fileUrl: m.file_url,
            timestamp: m.timestamp
          })).sort((a: Message, b: Message) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        };
      });
      setCases(formattedCases);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('timestamp', { ascending: false });
    
    if (data) {
      const formatted: Notification[] = data.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          read: n.read,
          type: n.type,
          timestamp: n.timestamp || n.created_at 
      }));
      setNotifications(formatted);
    }
  };

  const fetchCRMClients = async () => {
      if (!currentUser) return;
      const { data } = await supabase
        .from('crm_clients')
        .select('*')
        .eq('lawyer_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (data) {
          const formatted: CRMProfile[] = data.map((c: any) => ({
              id: c.id,
              lawyerId: c.lawyer_id,
              name: c.name,
              type: c.type,
              cpf_cnpj: c.cpf_cnpj,
              rg: c.rg,
              email: c.email,
              phone: c.phone,
              address: c.address,
              profession: c.profession,
              civil_status: c.civil_status,
              riskScore: c.risk_score,
              status: c.status,
              notes: c.notes,
              createdAt: c.created_at
          }));
          setCrmClients(formatted);
      }
  };

  const fetchSmartDocs = async () => {
      if (!currentUser) return;
      const { data } = await supabase
        .from('smart_docs')
        .select('*')
        .eq('lawyer_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (data) {
           const formatted: SmartDoc[] = data.map((d: any) => ({
               id: d.id,
               lawyerId: d.lawyer_id,
               clientId: d.client_id,
               name: d.name,
               type: d.type,
               tags: d.tags || [],
               version: d.version,
               date: d.created_at,
               size: d.size,
               url: d.url
           }));
           setSmartDocs(formatted);
      }
  };

  const fetchAgendaItems = async () => {
      if (!currentUser) return;
      const { data } = await supabase
          .from('agenda_items')
          .select('*')
          .eq('lawyer_id', currentUser.id)
          .order('date', { ascending: true });
      
      if (data) {
          const formatted: AgendaItem[] = data.map((i: any) => ({
              id: i.id,
              lawyerId: i.lawyer_id,
              title: i.title,
              description: i.description,
              date: i.date,
              type: i.type,
              urgency: i.urgency,
              clientId: i.client_id,
              status: i.status
          }));
          setAgendaItems(formatted);

          // VERIFICAÇÃO DE PRAZOS VENCENDO (NOTIFICAÇÃO AUTOMÁTICA)
          const now = new Date();
          const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
          
          formatted.forEach(async (item) => {
              const itemDate = new Date(item.date);
              if (item.status === 'PENDING' && itemDate > now && itemDate < next48h) {
                  if (item.urgency === 'Alta') {
                      const { data: existingNotif } = await supabase.from('notifications')
                          .select('*')
                          .eq('user_id', currentUser.id)
                          .eq('title', 'Prazo Próximo!')
                          .ilike('message', `%${item.title}%`)
                          .eq('read', false);
                      
                      if (!existingNotif || existingNotif.length === 0) {
                          await supabase.from('notifications').insert({
                              user_id: currentUser.id,
                              title: 'Prazo Próximo!',
                              message: `Atenção: "${item.title}" vence em breve (${itemDate.toLocaleDateString()}).`,
                              type: 'warning'
                          });
                      }
                  }
              }
          });
      }
  };

  const fetchSavedCalculations = async () => {
      if (!currentUser) return;
      const { data } = await supabase
          .from('saved_calculations')
          .select('*')
          .eq('lawyer_id', currentUser.id)
          .order('created_at', { ascending: false });
      
      if (data) {
          const formatted: SavedCalculation[] = data.map((c: any) => ({
              id: c.id,
              lawyerId: c.lawyer_id,
              category: c.category,
              type: c.type,
              title: c.title,
              inputData: c.input_data,
              resultData: c.result_data,
              createdAt: c.created_at
          }));
          setSavedCalculations(formatted);
      }
  }

  const saveCalculation = async (calcData: Omit<SavedCalculation, 'id' | 'lawyerId' | 'createdAt'>) => {
      if (!currentUser) return;
      const { error } = await supabase.from('saved_calculations').insert({
          lawyer_id: currentUser.id,
          category: calcData.category,
          type: calcData.type,
          title: calcData.title,
          input_data: calcData.inputData,
          result_data: calcData.resultData
      });
      if (error) alert("Erro ao salvar cálculo: " + error.message);
      else {
          alert("Cálculo salvo no histórico!");
          fetchSavedCalculations();
      }
  }

  // --- AÇÕES ---

  const login = async (email: string, role: UserRole, password?: string, userData?: { name?: string; avatar?: string; googleId?: string; facebookId?: string }) => {
    const pwd = password || '123456';
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });

    // Se o login falhar e vem do Google (sem password), criar novo usuário
    if (error && !password && userData) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password: pwd });
      
      if (!signUpError && signUpData.user) {
        const username = userData.name || email.split('@')[0];
        const avatar = userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
        
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          email,
          name: username,
          role,
          verified: true,
          is_premium: false,
          avatar,
          google_id: userData.googleId,
          facebook_id: userData.facebookId,
          created_at: new Date().toISOString()
        });

        if (profileError) {
          console.error("Erro ao criar perfil:", profileError);
          throw profileError;
        }

        await fetchUserProfile(signUpData.user.id);
        return;
      } else {
        throw signUpError || new Error('Erro ao criar conta');
      }
    }

    if (error) {
      if (email === 'admin@socialjuris.com' && error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: 'admin@socialjuris.com', password: pwd });
        if (!signUpError && signUpData.user) {
           await supabase.from('profiles').upsert({
              id: signUpData.user.id,
              email: 'admin@socialjuris.com',
              name: 'Administrador',
              role: 'ADMIN',
              verified: true,
              is_premium: true,
              avatar: `https://ui-avatars.com/api/?name=Admin&background=random`,
              created_at: new Date().toISOString()
           });
           await fetchUserProfile(signUpData.user.id);
           return;
        }
      }
      if (error.message.includes("Email not confirmed")) {
         alert("⚠️ ACESSO BLOQUEADO: EMAIL NÃO CONFIRMADO\n\nVerifique seu email ou desabilite a confirmação no painel do Supabase.");
      } else {
         alert("Erro ao entrar: " + error.message);
      }
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt' | 'avatar'>, password?: string) => {
    if (!password) { alert("Senha obrigatória"); return; }
    const { data: authData, error: authError } = await supabase.auth.signUp({ email: userData.email, password: password });

    if (authError) { alert("Erro no cadastro: " + authError.message); throw authError; }

    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        oab: userData.role === 'LAWYER' ? userData.oab : null,
        verified: userData.role === 'CLIENT',
        balance: userData.role === 'LAWYER' ? 0 : null,
        is_premium: false,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
        created_at: new Date().toISOString()
      });

      if (profileError) alert("Erro ao criar perfil: " + profileError.message);
      else if (!authData.session) alert("✅ Cadastro realizado! Verifique seu email.");
      else await fetchUserProfile(authData.user.id);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    const { error } = await supabase.from('profiles').update({
        name: data.name, phone: data.phone, bio: data.bio, oab: data.oab
      }).eq('id', currentUser.id);
    if (!error) { alert("Perfil atualizado!"); fetchUserProfile(currentUser.id); }
  };

  const updateUserProfile = async (userId: string, data: Partial<User>) => {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.oab !== undefined) updateData.oab = data.oab;
    if (data.fromFacebookGroup !== undefined) updateData.from_facebook_group = data.fromFacebookGroup;

    const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
    if (!error) {
      console.log('✅ updateUserProfile: Dados salvos com sucesso:', updateData);
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
      // Refrescar dados do usuário e lista global
      setTimeout(() => {
        fetchUserProfile(userId);
        fetchUsers(); // Atualiza lista global para admin ver a mudança
      }, 300);
    } else {
      console.error('❌ updateUserProfile: Erro ao salvar:', error);
    }
  };

  const addCreditsToUser = async (userId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: amount }, { count: 'exact' })
        .eq('id', userId);

      if (error) throw error;

      // Atualizar lista global de usuários
      await fetchUsers();
      
      // Se for o usuário atual, atualizar também
      if (currentUser?.id === userId) {
        await fetchUserProfile(userId);
      }
      
      console.log('✅ addCreditsToUser: Créditos adicionados com sucesso');
    } catch (error) {
      console.error('❌ addCreditsToUser: Erro ao adicionar créditos:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      console.log(`🗑️ Iniciando deleção do usuário: ${userId}`);

      // PASSO 1: Buscar todos os case IDs onde é lawyer ou cliente
      const { data: userCases } = await supabase
        .from('cases')
        .select('id')
        .or(`lawyer_id.eq.${userId},client_id.eq.${userId}`);

      const caseIds = userCases?.map(c => c.id) || [];
      console.log(`📋 Encontrados ${caseIds.length} casos do usuário`);

      // PASSO 2: Deletar messages de TODOS os casos do usuário
      if (caseIds.length > 0) {
        for (const caseId of caseIds) {
          const { error: eMsg } = await supabase.from('messages').delete().eq('case_id', caseId);
          if (eMsg) console.warn(`⚠️ Erro ao deletar messages do caso ${caseId}:`, eMsg);
        }
      }

      // PASSO 3: Deletar messages onde sender_id = userId
      const { error: e1 } = await supabase.from('messages').delete().eq('sender_id', userId);
      if (e1) console.warn('⚠️ Erro ao deletar messages (sender_id):', e1);

      // PASSO 4: Deletar case_ratings
      const { error: e2 } = await supabase.from('case_ratings').delete().eq('rater_id', userId);
      if (e2) console.warn('⚠️ Erro ao deletar case_ratings:', e2);

      // PASSO 5: Deletar case_views
      const { error: e3 } = await supabase.from('case_views').delete().eq('user_id', userId);
      if (e3) console.warn('⚠️ Erro ao deletar case_views:', e3);

      // PASSO 6: Deletar case_interests
      const { error: e4 } = await supabase.from('case_interests').delete().eq('lawyer_id', userId);
      if (e4) console.warn('⚠️ Erro ao deletar case_interests:', e4);

      // PASSO 7: Deletar credit_locks
      const { error: e5 } = await supabase.from('credit_locks').delete().eq('lawyer_id', userId);
      if (e5) console.warn('⚠️ Erro ao deletar credit_locks:', e5);

      // PASSO 8: Agora SIM deletar cases
      const { error: e6 } = await supabase.from('cases').delete().eq('lawyer_id', userId);
      if (e6) console.warn('⚠️ Erro ao deletar cases (lawyer_id):', e6);

      const { error: e7 } = await supabase.from('cases').delete().eq('client_id', userId);
      if (e7) console.warn('⚠️ Erro ao deletar cases (client_id):', e7);

      // PASSO 9: Deletar notifications
      const { error: e8 } = await supabase.from('notifications').delete().eq('user_id', userId);
      if (e8) console.warn('⚠️ Erro ao deletar notifications:', e8);

      // PASSO 10: Deletar email_campaigns
      const { error: e9 } = await supabase.from('email_campaigns').delete().eq('sender_id', userId);
      if (e9) console.warn('⚠️ Erro ao deletar email_campaigns:', e9);

      // PASSO 11: Deletar CRM clients
      const { error: e10 } = await supabase.from('crm_clients').delete().eq('lawyer_id', userId);
      if (e10) console.warn('⚠️ Erro ao deletar crm_clients:', e10);

      // PASSO 12: Deletar smart_docs
      const { error: e11 } = await supabase.from('smart_docs').delete().eq('lawyer_id', userId);
      if (e11) console.warn('⚠️ Erro ao deletar smart_docs:', e11);

      // PASSO 13: Deletar agenda_items
      const { error: e12 } = await supabase.from('agenda_items').delete().eq('lawyer_id', userId);
      if (e12) console.warn('⚠️ Erro ao deletar agenda_items:', e12);

      // PASSO 14: Deletar saved_calculations
      const { error: e13 } = await supabase.from('saved_calculations').delete().eq('lawyer_id', userId);
      if (e13) console.warn('⚠️ Erro ao deletar saved_calculations:', e13);

      // PASSO 15: Por fim, deletar o profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Atualizar lista global de usuários
      await fetchUsers();
      
      console.log('✅ deleteUser: Usuário e todos os dados associados deletados com sucesso');
    } catch (error) {
      console.error('❌ deleteUser: Erro ao deletar usuário:', error);
      throw error;
    }
  };

  const createCase = async (data: { title: string; description: string; area: string; city: string; uf: string; price: number; complexity: string; images?: any[] | null }) => {
    if (!currentUser) return;
    const { data: newCase, error } = await supabase.from('cases').insert({
        client_id: currentUser.id, title: data.title, description: data.description, area: data.area, city: data.city, uf: data.uf, status: 'OPEN', price: data.price, complexity: data.complexity, is_paid: true, images: data.images || []
      }).select().single();

    if (!error && newCase) {
      await supabase.from('messages').insert({ case_id: newCase.id, sender_id: currentUser.id, content: `Caso criado com sucesso. Taxa de publicação (R$ ${data.price.toFixed(2)}) confirmada.`, type: 'system' });
      fetchCases();
    }
  };

  // --- NOVA LÓGICA DE MATCH (INTERESSE) ---
  
  const acceptCase = async (caseId: string) => {
    if (!currentUser || currentUser.role !== UserRole.LAWYER) return;
    const LOCK_COST = 1; // 1 crédito travado

    // 1. Verificar saldo disponível
    if ((currentUser.balance || 0) < LOCK_COST) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    // 2. Verificar duplicidade
    const { data: existing } = await supabase
      .from('credit_locks')
      .select('id')
      .eq('lawyer_id', currentUser.id)
      .eq('case_id', caseId)
      .single();

    if (existing) {
      throw new Error("DUPLICATE_INTEREST");
    }

    // 3. Criar travamento de crédito (7 dias de expiração)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const { error: lockError } = await supabase.from('credit_locks').insert({
      lawyer_id: currentUser.id,
      case_id: caseId,
      locked_credits: LOCK_COST,
      status: 'ACTIVE',
      expires_at: expiryDate.toISOString()
    });

    if (lockError) {
      throw new Error("LOCK_CREATE_FAILED");
    }

    // 4. Debitar saldo (travado, não consumido ainda)
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: (currentUser.balance || 0) - LOCK_COST })
      .eq('id', currentUser.id);

    if (balanceError) {
      throw new Error("BALANCE_UPDATE_FAILED");
    }

    // 5. Registrar interesse em case_interests
    await supabase.from('case_interests').insert({
      case_id: caseId,
      lawyer_id: currentUser.id
    }).then(() => {
      setCurrentUser(prev => prev ? ({ ...prev, balance: (prev.balance || 0) - LOCK_COST }) : null);
      
      // Notificar Cliente
      const targetCase = cases.find(c => c.id === caseId);
      if (targetCase) {
        supabase.from('notifications').insert({
          user_id: targetCase.clientId,
          title: 'Nova Proposta',
          message: `O Dr(a). ${currentUser.name} manifestou interesse no seu caso. Vá até Meus Casos para responder.`,
          type: 'success'
        });
      }
      fetchCases();
    });
  };

  const hireLawyer = async (caseId: string, lawyerId: string) => {
       // Cliente escolhe o advogado -> Match definitivo
       const ratingDeadline = new Date();
       ratingDeadline.setDate(ratingDeadline.getDate() + 3);
       
       const { error } = await supabase.from('cases').update({
           lawyer_id: lawyerId,
           status: 'ACTIVE',
           rating_deadline_at: ratingDeadline.toISOString(),
           lawyer_rating: 4.5,
           client_rating: 4.5
       }).eq('id', caseId);

       if (!error) {
           const lawyer = users.find(u => u.id === lawyerId);
           await supabase.from('notifications').insert({
               user_id: lawyerId,
               title: 'Proposta Aceita!',
               message: 'O cliente escolheu você para o caso. O chat está liberado.',
               type: 'success'
           });
            await supabase.from('messages').insert({ case_id: caseId, sender_id: lawyerId, content: `Olá, agradeço a oportunidade. Vamos resolver seu caso!`, type: 'system' });
           fetchCases();
       }
   };

  const openChatWithLawyer = async (caseId: string, lawyerId: string) => {
    if (!currentUser) return;
    
    const ADDITIONAL_COST = 3; // +3 créditos adicionais após consumo do travado
    
    // 1. Buscar credit_lock ativo
    const { data: lock, error: lockError } = await supabase
      .from('credit_locks')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .eq('case_id', caseId)
      .eq('status', 'ACTIVE')
      .single();

    if (lockError || !lock) {
      throw new Error("LOCK_NOT_FOUND");
    }

    // 2. Verificar se advogado tem saldo para +3 adicionais
    const lawyer = users.find(u => u.id === lawyerId);
    if (!lawyer || (lawyer.balance || 0) < ADDITIONAL_COST) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

   // 3. Consumir o crédito travado + cobrar +3 adicionais
   const { error: updateLockError } = await supabase
     .from('credit_locks')
     .update({ 
       status: 'CONSUMED',
       consumed_at: new Date().toISOString()
     })
     .eq('id', lock.id);

   if (updateLockError) {
     throw new Error("LOCK_UPDATE_FAILED");
   }

   // 4. Debitar +3 adicionais do saldo do advogado
   const { error: balanceError } = await supabase
     .from('profiles')
     .update({ balance: (lawyer.balance || 0) - ADDITIONAL_COST })
     .eq('id', lawyerId);

   if (balanceError) {
     throw new Error("BALANCE_DEBIT_FAILED");
   }

   // 5. Atualizar estado local
   setUsers(prev => prev.map(u => 
     u.id === lawyerId 
       ? { ...u, balance: (u.balance || 0) - ADDITIONAL_COST }
       : u
   ));

   fetchCases();
  };

  // ------------------------------------------

  const buyJuris = async (amount: number) => {
      if (!currentUser) return;
      
      try {
          const result = await createJurisCheckoutSession(currentUser.id, amount);
          
          if (result.success && result.sessionId) {
              await redirectToCheckout(result.sessionId);
          } else {
              alert(`Erro ao processar pagamento: ${result.error}`);
          }
      } catch (error) {
          console.error('Erro ao iniciar compra de Juris:', error);
          alert('Erro ao iniciar compra. Tente novamente.');
      }
  };

  const subscribePremium = async () => {
      if (!currentUser) return;
      
      try {
          const result = await createSubscriptionCheckoutSession(currentUser.id);
          
          if (result.success && result.sessionId) {
              await redirectToCheckout(result.sessionId);
          } else {
              alert(`Erro ao processar assinatura: ${result.error}`);
          }
      } catch (error) {
          console.error('Erro ao iniciar assinatura PRO:', error);
          alert('Erro ao iniciar assinatura. Tente novamente.');
      }
  };

  const togglePremiumStatus = async (userId: string, status: boolean) => {
      await supabase.from('profiles').update({ is_premium: status }).eq('id', userId);
      fetchUsers();
  };

  const sendMessage = async (caseId: string, content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!currentUser) return;
    const { error } = await supabase.from('messages').insert({ case_id: caseId, sender_id: currentUser.id, content, type, file_url: type !== 'text' ? 'https://picsum.photos/400/300' : null });
    if (!error) {
        const currentCase = cases.find(c => c.id === caseId);
        if (currentCase) {
            const recipientId = currentUser.id === currentCase.clientId ? currentCase.lawyerId : currentCase.clientId;
            if (recipientId) await supabase.from('notifications').insert({ user_id: recipientId, title: 'Nova Mensagem', message: `${currentUser.name} enviou uma mensagem.`, type: 'info', read: false });
        }
        fetchCases();
    }
  };

  const toggleLawyerVerification = async (userId: string, status: boolean) => {
    const { error } = await supabase.from('profiles').update({ verified: status }).eq('id', userId);
    
    if (!error) {
        if (status) {
            await supabase.from('notifications').insert({ user_id: userId, title: 'Perfil Verificado', message: 'Sua conta foi aprovada.', type: 'success' });
        } else {
             await supabase.from('notifications').insert({ user_id: userId, title: 'Verificação Suspensa', message: 'Seu acesso foi temporariamente suspenso.', type: 'warning' });
        }
        fetchUsers();
    }
  };

  const closeCase = async (caseId: string, rating: number, comment: string) => {
    await supabase.from('cases').update({ status: 'CLOSED', feedback_rating: rating, feedback_comment: comment }).eq('id', caseId);
    fetchCases();
  };

  const rateOtherUser = async (caseId: string, rating: number) => {
    if (!currentUser) return;
    
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;

    // Armazenar avaliação no histórico
    const { error: insertError } = await supabase.from('case_ratings').insert({
      case_id: caseId,
      rater_id: currentUser.id,
      rating: rating
    });

    if (insertError) return;

    // Determinar se é advogado ou cliente avaliando
    const isLawyer = currentUser.role === UserRole.LAWYER;
    const otherUserId = isLawyer ? targetCase.clientId : targetCase.lawyerId;

    // Buscar todas as avaliações da parte oposta
    const { data: ratings } = await supabase
      .from('case_ratings')
      .select('rating')
      .eq('case_id', caseId)
      .eq('rater_id', otherUserId);

    // Calcular média (inclui as anteriores + a nova)
    let averageRating = 4.5;
    if (ratings && ratings.length > 0) {
      averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    }
    
    const updateData = isLawyer 
      ? { lawyer_rating: averageRating, lawyer_rated_at: new Date().toISOString() }
      : { client_rating: averageRating, client_rated_at: new Date().toISOString() };

    const { error } = await supabase.from('cases').update(updateData).eq('id', caseId);
    
    if (!error) {
      // Notificar a outra parte
      if (otherUserId) {
        await supabase.from('notifications').insert({
          user_id: otherUserId,
          title: 'Você foi avaliado!',
          message: `${currentUser.name} deixou uma avaliação de ${rating} estrela${rating > 1 ? 's' : ''} para o caso.`,
          type: 'info'
        });
      }
      fetchCases();
    }
  };

  const markNotificationAsRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  // --- CRM, DOCS & AGENDA ACTIONS ---
  
  const addCRMClient = async (clientData: Omit<CRMProfile, 'id' | 'lawyerId' | 'createdAt'>) => {
      if (!currentUser) return;
      const { error } = await supabase.from('crm_clients').insert({
          lawyer_id: currentUser.id,
          name: clientData.name,
          type: clientData.type,
          cpf_cnpj: clientData.cpf_cnpj,
          rg: clientData.rg,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          profession: clientData.profession,
          civil_status: clientData.civil_status,
          risk_score: clientData.riskScore,
          status: clientData.status,
          notes: clientData.notes
      });

      if (error) alert("Erro ao salvar cliente: " + error.message);
      else {
          alert("Cliente salvo com sucesso!");
          fetchCRMClients();
      }
  };

  const updateCRMClient = async (id: string, data: Partial<CRMProfile>) => {
      const { error } = await supabase.from('crm_clients').update({
          name: data.name,
          type: data.type,
          cpf_cnpj: data.cpf_cnpj,
          rg: data.rg,
          email: data.email,
          phone: data.phone,
          address: data.address,
          profession: data.profession,
          civil_status: data.civil_status,
          notes: data.notes,
          status: data.status,
          risk_score: data.riskScore
      }).eq('id', id);

      if (error) {
          alert("Erro ao atualizar cliente: " + error.message);
      } else {
          alert("Dados do cliente atualizados!");
          fetchCRMClients();
      }
  };

  const addSmartDoc = async (docData: Omit<SmartDoc, 'id' | 'lawyerId' | 'date'>) => {
      if (!currentUser) return;
      const { error } = await supabase.from('smart_docs').insert({
          lawyer_id: currentUser.id,
          client_id: docData.clientId || null, // Link opcional
          name: docData.name,
          type: docData.type,
          tags: docData.tags,
          version: docData.version,
          size: docData.size,
          url: docData.url
      });
      if (error) alert("Erro ao salvar documento: " + error.message);
      else fetchSmartDocs();
  };

  const addAgendaItem = async (itemData: Omit<AgendaItem, 'id' | 'lawyerId' | 'status' | 'clientName'>) => {
      if (!currentUser) return;
      const { error } = await supabase.from('agenda_items').insert({
          lawyer_id: currentUser.id,
          title: itemData.title,
          description: itemData.description,
          date: itemData.date,
          type: itemData.type,
          urgency: itemData.urgency,
          client_id: itemData.clientId || null,
          status: 'PENDING'
      });
      
      if (error) alert("Erro ao agendar: " + error.message);
      else {
          alert("Compromisso agendado!");
          fetchAgendaItems();
      }
  };

  const updateAgendaItem = async (id: string, data: Partial<AgendaItem>) => {
      if (!currentUser) return;
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.urgency !== undefined) updateData.urgency = data.urgency;
      if (data.clientId !== undefined) updateData.client_id = data.clientId;
      if (data.status !== undefined) updateData.status = data.status;
      
      const { error } = await supabase.from('agenda_items').update(updateData).eq('id', id).eq('lawyer_id', currentUser.id);
      
      if (error) alert("Erro ao atualizar: " + error.message);
      else {
          alert("Compromisso atualizado!");
          fetchAgendaItems();
      }
  };

  const deleteAgendaItem = async (id: string) => {
       if (!currentUser) return;
       if (!confirm('Tem certeza que deseja deletar este compromisso?')) return;
       
       const { error } = await supabase.from('agenda_items').delete().eq('id', id).eq('lawyer_id', currentUser.id);
       
       if (error) alert("Erro ao deletar: " + error.message);
       else {
           alert("Compromisso deletado!");
           fetchAgendaItems();
       }
   };

   // Funções de Banners (Admin)
   const fetchBanners = async () => {
       try {
           const { data, error } = await supabase.from('admin_banners').select('*');
           console.log('🎨 BANNERS CARREGADOS DO BD:', data);
           if (error) throw error;
           
           // Converter snake_case para camelCase
           const bannersFormatted = (data || []).map((b: any) => ({
               id: b.id,
               name: b.name,
               imageUrl: b.image_url,
               linkUrl: b.link_url,
               updatedAt: b.updated_at
           }));
           
           console.log('✅ BANNERS FORMATADOS:', bannersFormatted);
           setBanners(bannersFormatted);
       } catch (error: any) {
           console.error('❌ Erro ao buscar banners:', error.message);
       }
   };

   const updateBanner = async (name: string, imageUrl: string, linkUrl: string) => {
       try {
           // Tentar atualizar se já existe
           const { data: existing } = await supabase.from('admin_banners').select('id').eq('name', name).single();
           
           if (existing) {
               const { error } = await supabase.from('admin_banners').update({
                   image_url: imageUrl,
                   link_url: linkUrl,
                   updated_at: new Date().toISOString()
               }).eq('name', name);
               
               if (error) throw error;
           } else {
               // Criar novo banner se não existe
               const { error } = await supabase.from('admin_banners').insert({
                   name,
                   image_url: imageUrl,
                   link_url: linkUrl,
                   updated_at: new Date().toISOString()
               });
               
               if (error) throw error;
           }
           
           await fetchBanners();
       } catch (error: any) {
           console.error('Erro ao atualizar banner:', error.message);
           throw error;
       }
   };

   return (
     <AppContext.Provider value={{ currentUser, users, cases, notifications, crmClients, smartDocs, agendaItems, savedCalculations, banners, clicksUsed, clicksLimit, clicksResetDate, recordClick, login, logout, register, updateProfile, updateUserProfile, addCreditsToUser, deleteUser, createCase, acceptCase, hireLawyer, openChatWithLawyer, sendMessage, toggleLawyerVerification, closeCase, rateOtherUser, markNotificationAsRead, buyJuris, subscribePremium, togglePremiumStatus, fetchCRMClients, addCRMClient, updateCRMClient, fetchSmartDocs, addSmartDoc, fetchAgendaItems, addAgendaItem, updateAgendaItem, deleteAgendaItem, fetchSavedCalculations, saveCalculation, fetchBanners, updateBanner }}>
       {children}
     </AppContext.Provider>
   );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
