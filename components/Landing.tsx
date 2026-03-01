import React, { useState } from 'react';
import { Scale, Shield, Clock, CheckCircle, ChevronRight, Gavel, Users, Lock, Star, ArrowRight, TrendingUp, MessageSquare, Zap, HelpCircle, ChevronDown, Globe, Laptop, Coins } from 'lucide-react';
import { useApp } from '../store';
import { UserRole } from '../types';

interface LandingProps {
  onAuth: (type: 'login' | 'register', role: UserRole) => void;
}

export const Landing: React.FC<LandingProps> = ({ onAuth }) => {
  const [activeTab, setActiveTab] = useState<'client' | 'lawyer'>('client');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-xl z-50 border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                <span className="text-indigo-600">Social</span><span className="text-violet-600">Jurídico</span>
              </div>
            </div>
            
            <div className="hidden lg:flex space-x-10 text-sm font-medium text-slate-600">
              <a href="#como-funciona" className="hover:text-indigo-600 transition hover:-translate-y-0.5 transform">Como Funciona</a>
              <a href="#diferenciais" className="hover:text-indigo-600 transition hover:-translate-y-0.5 transform">Diferenciais</a>
              <a href="#depoimentos" className="hover:text-indigo-600 transition hover:-translate-y-0.5 transform">Depoimentos</a>
              <a href="#faq" className="hover:text-indigo-600 transition hover:-translate-y-0.5 transform">Dúvidas</a>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onAuth('login', UserRole.CLIENT)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full text-sm font-bold transition shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Entrar Agora
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-200/30 rounded-full blur-3xl"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-violet-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">Plataforma Digital de Direito</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]">
              A revolução do acesso à <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">justiça começa aqui.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
              Conectamos problemas reais a soluções jurídicas. 
              Publique seu caso <span className="font-bold text-indigo-600">100% GRÁTIS</span> e encontre advogados qualificados.
            </p>
            
            {/* Toggle Role */}
            <div className="bg-white p-2 rounded-full shadow-2xl shadow-indigo-100 inline-flex mb-12 border border-slate-100 mx-auto transform transition-all hover:scale-105">
              <button 
                onClick={() => setActiveTab('client')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center ${activeTab === 'client' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Users className="w-4 h-4 mr-2" />
                Sou Cliente
              </button>
              <button 
                onClick={() => setActiveTab('lawyer')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center ${activeTab === 'lawyer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                <Gavel className="w-4 h-4 mr-2" />
                Sou Advogado
              </button>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {activeTab === 'client' ? (
                <>
                   <button onClick={() => onAuth('register', UserRole.CLIENT)} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all flex items-center justify-center">
                     Cadastrar meu Caso <ArrowRight className="ml-2 w-5 h-5" />
                   </button>
                   <p className="text-sm text-slate-500 mt-2 md:mt-0 md:ml-4 flex items-center">
                     <CheckCircle className="w-4 h-4 text-green-500 mr-1.5" /> <span className="font-bold text-green-600">100% GRÁTIS</span>
                   </p>
                </>
              ) : (
                <>
                  <button onClick={() => onAuth('register', UserRole.LAWYER)} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl hover:shadow-slate-500/30 hover:-translate-y-1 transition-all flex items-center justify-center">
                    Ver Oportunidades <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                  <p className="text-sm text-slate-500 mt-2 md:mt-0 md:ml-4 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1.5" /> Expanda sua carteira
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- STATS BAR (Tecnologia) --- */}
      <div className="bg-slate-900 py-12 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-800">
                <div className="p-2">
                    <div className="flex justify-center mb-3"><Coins className="w-8 h-8 text-green-400"/></div>
                    <div className="text-xl font-extrabold text-white mb-1">100% Grátis</div>
                    <div className="text-green-400 text-xs font-medium uppercase tracking-wider">Zero taxas para publicar</div>
                </div>
                <div className="p-2">
                    <div className="flex justify-center mb-3"><Laptop className="w-8 h-8 text-indigo-400"/></div>
                    <div className="text-xl font-extrabold text-white mb-1">IA Integrada</div>
                    <div className="text-indigo-400 text-xs font-medium uppercase tracking-wider">Análises jurídicas automáticas</div>
                </div>
                <div className="p-2">
                    <div className="flex justify-center mb-3"><Shield className="w-8 h-8 text-red-400"/></div>
                    <div className="text-xl font-extrabold text-white mb-1">Dados Protegidos</div>
                    <div className="text-red-400 text-xs font-medium uppercase tracking-wider">Suas informações sempre seguras</div>
                </div>
                <div className="p-2">
                    <div className="flex justify-center mb-3"><Globe className="w-8 h-8 text-cyan-400"/></div>
                    <div className="text-xl font-extrabold text-white mb-1">Acesso em Qualquer Lugar</div>
                    <div className="text-cyan-400 text-xs font-medium uppercase tracking-wider">Sincronizado em tempo real</div>
                </div>
            </div>
        </div>
      </div>

      {/* --- PROBLEM VS SOLUTION (Diferenciais) --- */}
      <div id="diferenciais" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Por que o <span className="text-indigo-600">Social</span><span className="text-violet-600">Jurídico</span> é diferente?</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">Deixamos a burocracia no passado. Trouxemos a advocacia para a era digital.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* O jeito antigo */}
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                    <h3 className="text-xl font-bold text-slate-500 mb-6 flex items-center"><Clock className="w-5 h-5 mr-2"/> Advocacia Tradicional</h3>
                    <ul className="space-y-4">
                        <li className="flex items-start text-slate-500">
                            <span className="text-red-400 mr-3 text-xl">×</span>
                            Custos iniciais altos e imprevisíveis.
                        </li>
                        <li className="flex items-start text-slate-500">
                            <span className="text-red-400 mr-3 text-xl">×</span>
                            Atendimento lento e presencial obrigatório.
                        </li>
                        <li className="flex items-start text-slate-500">
                            <span className="text-red-400 mr-3 text-xl">×</span>
                            Linguagem difícil e falta de transparência.
                        </li>
                        <li className="flex items-start text-slate-500">
                            <span className="text-red-400 mr-3 text-xl">×</span>
                            Dificuldade para encontrar especialistas.
                        </li>
                    </ul>
                </div>

                {/* O SocialJuridico */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl shadow-2xl shadow-indigo-200 text-white transform md:scale-105 relative">
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/30">O FUTURO</div>
                    <h3 className="text-2xl font-bold mb-6 flex items-center"><Zap className="w-6 h-6 mr-2 fill-yellow-400 text-yellow-400"/><span className="text-yellow-100">Social</span><span className="text-amber-100">Jurídico</span></h3>
                    <ul className="space-y-4">
                        <li className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-3 text-green-400 mt-0.5 flex-shrink-0" />
                            <span><span className="font-bold text-green-200">Publicação Grátis:</span> Publique seu caso sem custos. A seriedade é garantida pela verificação de advogados qualificados.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-3 text-green-400 mt-0.5 flex-shrink-0" />
                            <span><span className="font-bold text-green-200">Comunicação Integrada:</span> Chat em tempo real, videoconferência, compartilhamento de documentos e assinatura digital segura.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-3 text-green-400 mt-0.5 flex-shrink-0" />
                            <span><span className="font-bold text-green-200">Avaliações Verificadas:</span> Sistema de estrelas baseado em experiências reais entre clientes e advogados, com transparência total.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-3 text-green-400 mt-0.5 flex-shrink-0" />
                            <span><span className="font-bold text-green-200">IA Inteligente:</span> Ferramentas jurídicas assistidas por IA: calculadoras, análise de jurisprudência, redação de peças e gestão inteligente de casos.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </div>

      {/* --- HOW IT WORKS (DETAILED) --- */}
      <div id="como-funciona" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm">Passo a Passo</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Como funciona na prática?</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-16">
                {/* Coluna Cliente */}
                <div>
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="bg-slate-900 p-2.5 rounded-lg"><Users className="w-6 h-6 text-white"/></div>
                        <h3 className="text-2xl font-bold text-slate-900">Para Clientes</h3>
                    </div>
                    <div className="space-y-12 relative before:absolute before:left-4 before:top-2 before:h-full before:w-0.5 before:bg-slate-200">
                        <div className="relative pl-12">
                            <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center font-bold text-slate-900 z-10">1</div>
                            <h4 className="text-lg font-bold text-slate-900">Relate seu problema</h4>
                            <p className="text-slate-600 mt-2">Nossa Inteligência Artificial ajuda você a descrever o caso e categoriza a área jurídica correta automaticamente.</p>
                        </div>
                        <div className="relative pl-12">
                            <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center font-bold text-slate-900 z-10">2</div>
                            <h4 className="text-lg font-bold text-slate-900">Publicação Instantânea</h4>
                            <p className="text-slate-600 mt-2">Seu caso é publicado <strong>100% gratuitamente</strong> na plataforma. Advogados especializados visualizam seu problema e manifestam interesse.</p>
                        </div>
                        <div className="relative pl-12">
                            <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center font-bold text-slate-900 z-10">3</div>
                            <h4 className="text-lg font-bold text-slate-900">Resolução Digital</h4>
                            <p className="text-slate-600 mt-2">Advogados qualificados entram em contato. Converse, envie provas, faça videochamadas e acompanhe a resolução.</p>
                        </div>
                    </div>
                    <div className="mt-8 pl-12">
                        <button onClick={() => onAuth('register', UserRole.CLIENT)} className="text-indigo-600 font-bold hover:underline flex items-center">
                            Criar minha conta de cliente <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>

                {/* Coluna Advogado */}
                <div>
                    <div className="flex items-center space-x-3 mb-8">
                         <div className="bg-indigo-600 p-2.5 rounded-lg"><Gavel className="w-6 h-6 text-white"/></div>
                        <h3 className="text-2xl font-bold text-slate-900">Para Advogados</h3>
                    </div>
                    <div className="space-y-12 relative before:absolute before:left-4 before:top-2 before:h-full before:w-0.5 before:bg-indigo-100">
                        <div className="relative pl-12">
                            <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-indigo-600 rounded-full flex items-center justify-center font-bold text-indigo-600 z-10">1</div>
                            <h4 className="text-lg font-bold text-slate-900">Cadastro Profissional</h4>
                            <p className="text-slate-600 mt-2">Crie seu perfil profissional e insira suas áreas de atuação para receber as demandas certas.</p>
                        </div>
                        <div className="relative pl-12">
                            <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-indigo-600 rounded-full flex items-center justify-center font-bold text-indigo-600 z-10">2</div>
                            <h4 className="text-lg font-bold text-slate-900">Clientes Reais e Comprometidos</h4>
                            <p className="text-slate-600 mt-2">Você tem acesso apenas a demandas reais e sérias de clientes genuínos interessados em resolver seus problemas jurídicos, sem perder tempo com spam.</p>
                        </div>
                        <div className="relative pl-12">
                            <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-indigo-600 rounded-full flex items-center justify-center font-bold text-indigo-600 z-10">3</div>
                            <h4 className="text-lg font-bold text-slate-900">Gestão Integrada</h4>
                            <p className="text-slate-600 mt-2">Gerencie múltiplos clientes em um único dashboard. Histórico, arquivos e chat centralizados.</p>
                        </div>
                    </div>
                    <div className="mt-8 pl-12">
                        <button onClick={() => onAuth('register', UserRole.LAWYER)} className="text-indigo-600 font-bold hover:underline flex items-center">
                            Cadastrar como advogado <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- FACEBOOK COMMUNITY SECTION --- */}
      <div className="py-24 bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Social Proof Content */}
            <div className="text-white">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8">
                <span className="text-sm font-bold text-green-300 mr-2">• COMUNIDADE ATIVA</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
                Temos <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">10 mil pessoas</span> no nosso grupo trocando dica
              </h2>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                No grupo "PRECISO DE UM ADVOGADO" a galera recomenda, avalia e comenta mesmo. Quem publica recebe dica de gente que já resolveu problema parecido e tem contato direto de advogado que tá ali e pronto pra trabalhar.
              </p>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-start bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
                  <div className="bg-green-500/20 p-3 rounded-lg mr-4 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Gente respondendo de verdade</h3>
                    <p className="text-slate-300 text-sm">Quando alguém publica lá, em minutos já tá tendo resposta. Dica de quem passou pela mesma situação, de advogado que quer pegar o caso.</p>
                  </div>
                </div>
                
                <div className="flex items-start bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
                  <div className="bg-blue-500/20 p-3 rounded-lg mr-4 flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Você vê quem já resolveu</h3>
                    <p className="text-slate-300 text-sm">Os relatos tá tudo lá. Quem resolveu, como foi o processo, quanto custou. Você já sabe em que tá entrando.</p>
                  </div>
                </div>
                
                <div className="flex items-start bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
                  <div className="bg-purple-500/20 p-3 rounded-lg mr-4 flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Conversas reais, sem papo corporativo</h3>
                    <p className="text-slate-300 text-sm">É gente falando com gente. Sem aquele jogo de palavra de big company, sem esperar três meses pra ter resposta.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Mock Facebook Community Card */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform hover:shadow-3xl transition">
                {/* Header */}
                <div className="bg-slate-100 px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">PRECISO DE UM ADVOGADO</h3>
                        <p className="text-xs text-slate-500">Grupo de Facebook • +10k membros</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feed Content */}
                <div className="p-6 space-y-6">
                  {/* Post 1 */}
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <img src="https://ui-avatars.com/api/?name=Ana+Costa&background=FF6B6B&color=fff" className="w-10 h-10 rounded-full" alt="" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Ana Costa</p>
                        <p className="text-xs text-slate-500">2 horas atrás</p>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm mb-3">
                      "Meu caso foi resolvido em 30 dias! O advogado foi super atencioso, explicou tudo de forma clara. Recomendo demais o <span className="text-indigo-600">Social</span><span className="text-violet-600">Jurídico</span>!"
                    </p>
                    <div className="flex space-x-2 text-yellow-400 text-xs">
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                    </div>
                  </div>

                  {/* Post 2 */}
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <img src="https://ui-avatars.com/api/?name=Roberto+Silva&background=4ECDC4&color=fff" className="w-10 h-10 rounded-full" alt="" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Roberto Silva</p>
                        <p className="text-xs text-slate-500">4 horas atrás</p>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm mb-3">
                      "Finalmente achei alguém que entende de contratos trabalhistas. Muito melhor que ficar procurando escritório por aí."
                    </p>
                    <div className="flex space-x-2 text-yellow-400 text-xs">
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                    </div>
                  </div>

                  {/* Post 3 */}
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <img src="https://ui-avatars.com/api/?name=Carla+Mendes&background=95E1D3&color=fff" className="w-10 h-10 rounded-full" alt="" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Carla Mendes</p>
                        <p className="text-xs text-slate-500">6 horas atrás</p>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm mb-3">
                      "Não acredito que consegui em tão pouco tempo e ainda por um preço justo. Sensacional, recomendando para todos os amigos!"
                    </p>
                    <div className="flex space-x-2 text-yellow-400 text-xs">
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                      <Star className="fill-current w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-slate-900">10K+</p>
                      <p className="text-xs text-slate-600">Membros Ativos</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-600">94%</p>
                      <p className="text-xs text-slate-600">Taxa de Sucesso</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-indigo-600">24/7</p>
                      <p className="text-xs text-slate-600">Suporte Ativo</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- TESTIMONIALS --- */}
      <div id="depoimentos" className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-16">O que dizem nossos usuários</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-slate-50 p-8 rounded-2xl relative border border-slate-100 hover:shadow-lg transition">
                    <div className="text-indigo-200 absolute top-4 right-6 text-6xl font-serif">"</div>
                    <div className="flex text-yellow-400 mb-4"><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/></div>
                    <p className="text-slate-700 mb-6 italic relative z-10">"Paguei uma taxa super barata para cadastrar meu caso e valeu muito a pena. O advogado que me atendeu foi extremamente profissional."</p>
                    <div className="flex items-center">
                        <img src="https://ui-avatars.com/api/?name=Maria+S&background=random" className="w-10 h-10 rounded-full mr-3" alt="User" />
                        <div>
                            <div className="font-bold text-slate-900">Maria Silva</div>
                            <div className="text-xs text-slate-500">Cliente • Direito Trabalhista</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-2xl relative border border-slate-100 hover:shadow-lg transition">
                    <div className="text-indigo-200 absolute top-4 right-6 text-6xl font-serif">"</div>
                    <div className="flex text-yellow-400 mb-4"><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/></div>
                    <p className="text-slate-700 mb-6 italic relative z-10">"A qualidade das leads é superior a outras plataformas. O fato do cliente pagar uma taxa mínima já filtra quem está apenas curioso."</p>
                    <div className="flex items-center">
                        <img src="https://ui-avatars.com/api/?name=Dr+Ricardo&background=random" className="w-10 h-10 rounded-full mr-3" alt="User" />
                        <div>
                            <div className="font-bold text-slate-900">Dr. Ricardo Oliveira</div>
                            <div className="text-xs text-slate-500">Advogado • OAB/SP</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-2xl relative border border-slate-100 hover:shadow-lg transition">
                    <div className="text-indigo-200 absolute top-4 right-6 text-6xl font-serif">"</div>
                    <div className="flex text-yellow-400 mb-4"><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/><Star className="fill-current w-4 h-4"/></div>
                    <p className="text-slate-700 mb-6 italic relative z-10">"A transparência é o ponto forte. Eu sabia exatamente em que fase meu processo estava só olhando a timeline no celular. Recomendo."</p>
                    <div className="flex items-center">
                        <img src="https://ui-avatars.com/api/?name=Fernando+G&background=random" className="w-10 h-10 rounded-full mr-3" alt="User" />
                        <div>
                            <div className="font-bold text-slate-900">Fernando Gomes</div>
                            <div className="text-xs text-slate-500">Cliente • Direito Civil</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- FAQ --- */}
      <div id="faq" className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-12">Perguntas Frequentes</h2>
            
            <div className="space-y-4">
                {[
                    { q: "O cadastro é gratuito?", a: "Sim! O cadastro na plataforma é 100% gratuito. Publicar seu caso também é totalmente grátis. Você não paga nada para conectar-se aos advogados qualificados." },
                    { q: "Os advogados são confiáveis?", a: "Sim, buscamos criar um ambiente profissional. Todos os advogados precisam informar seu número de registro na OAB para atuar na plataforma." },
                    { q: "Como funciona o contato?", a: "Após publicar seu caso, ele fica visível para advogados. Quando um profissional aceita o caso, um chat seguro é aberto para vocês conversarem." },
                    { q: "Posso usar no celular?", a: "Sim, o SocialJurídico é 100% responsivo e funciona perfeitamente em smartphones, tablets e computadores." }
                ].map((item, index) => (
                    <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <button 
                            onClick={() => toggleFaq(index)}
                            className="w-full flex justify-between items-center p-6 text-left focus:outline-none hover:bg-slate-50 transition"
                        >
                            <span className="font-bold text-slate-800 text-lg">{item.q}</span>
                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-40 p-6 pt-0' : 'max-h-0'}`}>
                            <p className="text-slate-600 leading-relaxed">{item.a}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      </div>

      {/* --- FINAL CTA --- */}
      <div className="py-20 bg-slate-900 text-white text-center">
          <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Pronto para resolver seu problema?</h2>
              <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">Junte-se a quem já está modernizando sua relação com a justiça.</p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                   <button 
                    onClick={() => onAuth('register', UserRole.CLIENT)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-full text-lg font-bold transition shadow-lg shadow-indigo-900/50 hover:-translate-y-1"
                   >
                       Criar Conta e Publicar
                   </button>
                   <button 
                    onClick={() => onAuth('register', UserRole.LAWYER)}
                    className="bg-transparent border-2 border-slate-600 hover:border-white text-white px-10 py-4 rounded-full text-lg font-bold transition hover:-translate-y-1"
                   >
                       Sou Advogado
                   </button>
              </div>
          </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
                <div className="flex items-center space-x-2 mb-6">
                    <Scale className="h-6 w-6 text-indigo-500" />
                    <div className="text-2xl font-bold text-white">
                        <span className="text-indigo-300">Social</span><span className="text-violet-300">Jurídico</span>
                    </div>
                </div>
                <p className="text-sm leading-relaxed mb-6">
                    A plataforma líder em conectar clientes a oportunidades jurídicas. Tecnologia a serviço da justiça.
                </p>
                <div className="flex space-x-4">
                    {/* Social Icons Mock */}
                    <div className="w-8 h-8 bg-slate-800 rounded-full hover:bg-indigo-600 transition cursor-pointer"></div>
                    <div className="w-8 h-8 bg-slate-800 rounded-full hover:bg-indigo-600 transition cursor-pointer"></div>
                    <div className="w-8 h-8 bg-slate-800 rounded-full hover:bg-indigo-600 transition cursor-pointer"></div>
                </div>
            </div>
            
            <div>
                <h4 className="text-white font-bold mb-6">Plataforma</h4>
                <ul className="space-y-3 text-sm">
                    <li><a href="#" className="hover:text-indigo-400 transition">Para Clientes</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Para Advogados</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Preços</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Segurança</a></li>
                </ul>
            </div>

            <div>
                <h4 className="text-white font-bold mb-6">Empresa</h4>
                <ul className="space-y-3 text-sm">
                    <li><a href="#" className="hover:text-indigo-400 transition">Sobre Nós</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Carreiras</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Blog</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Contato</a></li>
                </ul>
            </div>

            <div>
                <h4 className="text-white font-bold mb-6">Legal</h4>
                <ul className="space-y-3 text-sm">
                    <li><a href="/terms.html" className="hover:text-indigo-400 transition">Termos de Uso</a></li>
                    <li><a href="/privacy.html" className="hover:text-indigo-400 transition">Política de Privacidade</a></li>
                    <li><a href="/data-deletion" onClick={(e) => { e.preventDefault(); window.location.href = '/data-deletion'; }} className="hover:text-indigo-400 transition">Exclusão de Dados</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Compliance</a></li>
                    <li className="pt-4">
                        <button 
                        onClick={() => onAuth('login', UserRole.ADMIN)}
                        className="text-indigo-500 hover:text-white transition font-medium flex items-center text-xs border border-indigo-900/50 px-3 py-1.5 rounded-lg bg-indigo-950/20"
                        >
                        <Lock className="w-3 h-3 mr-1.5" />
                        Área Administrativa
                        </button>
                    </li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-900 text-center text-sm">
            <div className="mb-2">
                © 2024 <span className="text-indigo-300">Social</span><span className="text-violet-300">Jurídico</span> Tecnologia Jurídica Ltda. Todos os direitos reservados.
            </div>
            <div className="text-xs text-slate-500">
                Desenvolvido por <a href="https://nexos-digital.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-400 transition font-medium">NexosDigital</a>
            </div>
        </div>
      </footer>
    </div>
  );
};