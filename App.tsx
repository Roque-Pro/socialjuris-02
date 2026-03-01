import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store';
import { UserRole } from './types';
import { Landing } from './components/Landing';
import { ClientDashboard, LawyerDashboard, AdminDashboard } from './components/Dashboards';
import { Loader2, Mail, Lock, User, Briefcase, ChevronRight } from 'lucide-react';
import { GoogleLogin } from './components/GoogleLogin';
import { FacebookLogin } from './components/FacebookLogin';
import { OAuthButtons } from './components/OAuthButtons';
import { FacebookGroupModal } from './components/FacebookGroupModal';

const AuthScreen = ({ 
  type, 
  role, 
  onBack, 
  onSwitchMode 
}: { 
  type: 'login' | 'register'; 
  role: UserRole; 
  onBack: () => void;
  onSwitchMode: () => void;
}) => {
  const { login, register } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [oab, setOab] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [facebookError, setFacebookError] = useState<string | null>(null);

  // Auto-fill admin credentials for convenience if Admin role is selected
  useEffect(() => {
    if (role === UserRole.ADMIN && type === 'login') {
      setEmail('admin@socialjuris.com');
      // A senha padrão agora está implícita no fluxo do store se o usuário não digitar
    } else {
      // Keep email if switching modes to improve UX, only clear if empty context
      if (!email) setEmail('');
    }
    setPassword('');
  }, [role, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (type === 'login') {
        // A store agora lida com a autenticação real do Supabase
        await login(email, role, password);
      } else {
        await register({
          name,
          email,
          role,
          oab: role === UserRole.LAWYER ? oab : undefined,
          verified: role === UserRole.LAWYER ? false : true // Clients auto-verified
        }, password);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (userData: { email: string; name: string; avatar: string; verified: boolean; googleId?: string }) => {
    try {
      setLoading(true);
      // Para login com Google, passar os dados do usuário
      await login(userData.email, role, '', {
        name: userData.name,
        avatar: userData.avatar,
        googleId: userData.googleId
      });
    } catch (e) {
      console.error('Erro ao fazer login com Google:', e);
      setGoogleError('Erro ao fazer login com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSuccess = async (userData: { email: string; name: string; avatar: string; verified: boolean; facebookId?: string }) => {
    try {
      setLoading(true);
      // Para login com Facebook, passar os dados do usuário
      await login(userData.email, role, '', {
        name: userData.name,
        avatar: userData.avatar,
        facebookId: userData.facebookId
      });
    } catch (e) {
      console.error('Erro ao fazer login com Facebook:', e);
      setFacebookError('Erro ao fazer login com Facebook');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case UserRole.CLIENT: return 'Clientes';
      case UserRole.LAWYER: return 'Advogados';
      case UserRole.ADMIN: return 'Administradores';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
       <button onClick={onBack} className="absolute top-8 left-8 text-slate-500 hover:text-indigo-600 font-medium transition flex items-center z-10">
         <span className="mr-1">←</span> Voltar para Home
       </button>
       
       <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-100 animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{type === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
            <p className="text-slate-500">Acesso para <span className="text-indigo-600 font-semibold">{getRoleTitle()}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
             {type === 'register' && (
               <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                 <label className="text-sm font-medium text-slate-700 ml-1">Nome Completo</label>
                 <div className="relative">
                   <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                   <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" placeholder="Seu nome" />
                 </div>
               </div>
             )}
             
             <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-700 ml-1">Email</label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                   <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" placeholder="nome@exemplo.com" />
                 </div>
             </div>

             <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-700 ml-1">Senha</label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                   <input 
                      required 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" 
                      placeholder="Sua senha secreta" 
                    />
                 </div>
             </div>

             {type === 'register' && role === UserRole.LAWYER && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-medium text-slate-700 ml-1">Registro OAB</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input required type="text" value={oab} onChange={e => setOab(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" placeholder="UF-123456" />
                  </div>
                </div>
             )}

             <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center">
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (type === 'login' ? 'Entrar' : 'Cadastrar')}
             </button>
          </form>

          {/* Google & Facebook Login */}
          {type === 'login' && (
            <>
              <div className="mt-8 flex items-center">
                <div className="flex-1 border-t border-slate-200"></div>
                <span className="px-3 text-sm text-slate-500">ou</span>
                <div className="flex-1 border-t border-slate-200"></div>
              </div>
              <div className="mt-6 space-y-3">
                <GoogleLogin 
                  onSuccess={handleGoogleSuccess}
                  onError={setGoogleError}
                />
                <FacebookLogin 
                  onSuccess={handleFacebookSuccess}
                  onError={setFacebookError}
                />
              </div>
              {googleError && (
                <p className="mt-3 text-center text-sm text-red-600">{googleError}</p>
              )}
              {facebookError && (
                <p className="mt-3 text-center text-sm text-red-600">{facebookError}</p>
              )}
            </>
          )}

          {/* Toggle Login/Register Section */}
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-slate-600 text-sm">
              {type === 'login' ? 'Não tem uma conta?' : 'Já possui cadastro?'}
              <button 
                onClick={onSwitchMode}
                className="ml-2 text-indigo-600 font-bold hover:underline hover:text-indigo-800 transition-colors"
              >
                {type === 'login' ? 'Cadastre-se agora' : 'Faça Login'}
              </button>
            </p>
          </div>
          </div>
          </div>
          );
          };

const MainApp = () => {
  const { currentUser, updateUserProfile } = useApp();
  const [authView, setAuthView] = useState<{ type: 'login' | 'register', role: UserRole } | null>(null);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment) {
      setPaymentStatus(payment);
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Mostrar modal em TODOS os logins para sempre alimentar o indicador
    if (currentUser && !hasSeenModal) {
      const delay = setTimeout(() => {
        setShowFacebookModal(true);
        setHasSeenModal(true);
      }, 500); // Pequeno delay para melhor UX
      return () => clearTimeout(delay);
    }
  }, [currentUser, hasSeenModal]);

  const handleFacebookGroupYes = async () => {
    if (currentUser) {
      await updateUserProfile(currentUser.id, { fromFacebookGroup: true });
    }
    setShowFacebookModal(false);
  };

  if (currentUser) {
    return (
      <>
        {paymentStatus === 'success' && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            ✓ Compra realizada com sucesso!
          </div>
        )}
        {paymentStatus === 'canceled' && (
          <div className="fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            ⚠ Pagamento cancelado
          </div>
        )}
        {(() => {
          switch (currentUser.role) {
            case UserRole.CLIENT: return <ClientDashboard />;
            case UserRole.LAWYER: return <LawyerDashboard />;
            case UserRole.ADMIN: return <AdminDashboard />;
            default: return <div>Erro: Papel desconhecido ou não autorizado.</div>;
          }
        })()}
        <FacebookGroupModal 
          isOpen={showFacebookModal} 
          onClose={() => setShowFacebookModal(false)}
          onYes={handleFacebookGroupYes}
        />
      </>
    );
  }

  const toggleAuthMode = () => {
    if (authView) {
      setAuthView({
        ...authView,
        type: authView.type === 'login' ? 'register' : 'login'
      });
    }
  };

  if (authView) {
    return (
      <AuthScreen 
        type={authView.type} 
        role={authView.role} 
        onBack={() => setAuthView(null)} 
        onSwitchMode={toggleAuthMode}
      />
    );
  }

  return <Landing onAuth={(type, role) => setAuthView({ type, role })} />;
};

const App = () => (
  <AppProvider>
    <MainApp />
  </AppProvider>
);

export default App;