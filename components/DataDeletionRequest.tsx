import React, { useState } from 'react';
import { Mail, Download, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react';

export const DataDeletionRequest: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Solicitar Exclusão de Dados</h1>
          <p className="text-lg text-red-100">
            Você tem o direito de solicitar a exclusão de seus dados pessoais de nossos sistemas
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-12">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Direito ao Esquecimento (LGPD)</h3>
              <p className="text-blue-800">
                Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito de solicitar a exclusão de seus dados pessoais. 
                Esta página explica como exercer esse direito de forma fácil e segura.
              </p>
            </div>
          </div>
        </div>

        {/* Como Funciona */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Como Solicitar Exclusão de Dados</h2>
          
          <div className="space-y-4">
            {/* Step 1 */}
            <div 
              onClick={() => toggleSection('step1')}
              className="bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition cursor-pointer"
            >
              <div className="p-6 flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Envie um Email</h3>
                    <p className="text-slate-600 mt-1">Envie uma solicitação para nosso email de suporte</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition ${expandedSection === 'step1' ? 'rotate-180' : ''}`} />
              </div>
              {expandedSection === 'step1' && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                    <p className="text-slate-700"><strong>Para:</strong> suporte@matrixinformatica.com</p>
                    <p className="text-slate-700"><strong>Assunto:</strong> "Solicito Exclusão de Meus Dados Pessoais"</p>
                    <p className="text-slate-700 mb-4"><strong>No corpo do email, inclua:</strong></p>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                      <li>Seu nome completo</li>
                      <li>Email cadastrado na plataforma</li>
                      <li>CPF ou CNPJ (para confirmação)</li>
                      <li>Data aproximada de cadastro (opcional)</li>
                      <li>Confirmação de que entende que os dados serão permanentemente deletados</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div 
              onClick={() => toggleSection('step2')}
              className="bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition cursor-pointer"
            >
              <div className="p-6 flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Verificação de Identidade</h3>
                    <p className="text-slate-600 mt-1">Confirmaremos sua identidade para proteger seus dados</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition ${expandedSection === 'step2' ? 'rotate-180' : ''}`} />
              </div>
              {expandedSection === 'step2' && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <div className="space-y-3 text-slate-700">
                    <p>A verificação de identidade é obrigatória por lei e garante que apenas você possa solicitar a exclusão de seus dados.</p>
                    <p className="font-semibold mt-4">Processo de verificação:</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Você receberá um email de confirmação</li>
                      <li>Deverá clicar no link de verificação dentro de 48 horas</li>
                      <li>Pode ser solicitado documento de identidade (CNH, RG, Passaporte)</li>
                      <li>Após confirmação, sua solicitação será processada</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 */}
            <div 
              onClick={() => toggleSection('step3')}
              className="bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition cursor-pointer"
            >
              <div className="p-6 flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Processamento</h3>
                    <p className="text-slate-600 mt-1">Sua solicitação será processada conforme a lei</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition ${expandedSection === 'step3' ? 'rotate-180' : ''}`} />
              </div>
              {expandedSection === 'step3' && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <div className="space-y-3 text-slate-700">
                    <p><strong>Prazo:</strong> A exclusão será processada em até 30 dias úteis, conforme previsto pela LGPD.</p>
                    <p><strong>O que será deletado:</strong></p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Informações pessoais (nome, email, telefone, endereço)</li>
                      <li>Dados de casos criados</li>
                      <li>Histórico de mensagens e chats</li>
                      <li>Dados de pagamento e transações</li>
                      <li>Preferências e configurações de perfil</li>
                      <li>Documentos e arquivos enviados</li>
                      <li>Todas as informações associadas à sua conta</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4 */}
            <div 
              onClick={() => toggleSection('step4')}
              className="bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition cursor-pointer"
            >
              <div className="p-6 flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Confirmação</h3>
                    <p className="text-slate-600 mt-1">Você receberá confirmação da exclusão de dados</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition ${expandedSection === 'step4' ? 'rotate-180' : ''}`} />
              </div>
              {expandedSection === 'step4' && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <div className="space-y-3 text-slate-700">
                    <p>Após o processamento, você receberá um email confirmando que seus dados foram permanentemente deletados.</p>
                    <p><strong>Informações no email de confirmação:</strong></p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Data e hora da exclusão</li>
                      <li>Lista de dados deletados</li>
                      <li>Protocolo de rastreamento (para consultas futuras)</li>
                      <li>Informações de contato para dúvidas</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Perguntas Frequentes</h2>
          
          <div className="space-y-4">
            <div 
              onClick={() => toggleSection('faq1')}
              className="bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition cursor-pointer"
            >
              <div className="p-6 flex items-start justify-between">
                <h3 className="font-bold text-slate-900">Qual é o prazo para exclusão de dados?</h3>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition flex-shrink-0 ${expandedSection === 'faq1' ? 'rotate-180' : ''}`} />
              </div>
              {expandedSection === 'faq1' && (
                <div className="px-6 pb-6 border-t border-slate-100 text-slate-700">
                  <p>Conforme a LGPD, temos até 30 dias úteis para processar sua solicitação. Você receberá atualizações por email durante o processo.</p>
                </div>
              )}
            </div>

            <div 
              onClick={() => toggleSection('faq2')}
              className="bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition cursor-pointer"
            >
              <div className="p-6 flex items-start justify-between">
                <h3 className="font-bold text-slate-900">Posso recuperar meus dados após a exclusão?</h3>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition flex-shrink-0 ${expandedSection === 'faq2' ? 'rotate-180' : ''}`} />
              </div>
              {expandedSection === 'faq2' && (
                <div className="px-6 pb-6 border-t border-slate-100 text-slate-700">
                  <p>Não. A exclusão é permanente e irreversível. Após a confirmação, seus dados não podem ser recuperados. Tenha certeza de que deseja prosseguir antes de fazer a solicitação.</p>
                </div>
              )}
            </div>

            <div 
              onClick={() => toggleSection('faq3')}
              className="bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition cursor-pointer"
            >
              <div className="p-6 flex items-start justify-between">
                <h3 className="font-bold text-slate-900">Meus casos também serão deletados?</h3>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition flex-shrink-0 ${expandedSection === 'faq3' ? 'rotate-180' : ''}`} />
              </div>
              {expandedSection === 'faq3' && (
                <div className="px-6 pb-6 border-t border-slate-100 text-slate-700">
                  <p>Sim. Todos os casos, documentos, mensagens e dados associados à sua conta serão removidos permanentemente. Se você tinha casos compartilhados com outras pessoas, as associações serão removidas.</p>
                </div>
              )}
            </div>

            <div 
              onClick={() => toggleSection('faq4')}
              className="bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition cursor-pointer"
            >
              <div className="p-6 flex items-start justify-between">
                <h3 className="font-bold text-slate-900">E se eu tiver dúvidas sobre a exclusão?</h3>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition flex-shrink-0 ${expandedSection === 'faq4' ? 'rotate-180' : ''}`} />
              </div>
              {expandedSection === 'faq4' && (
                <div className="px-6 pb-6 border-t border-slate-100 text-slate-700">
                  <p>Entre em contato conosco através do email: <strong>suporte@matrixinformatica.com</strong></p>
                  <p className="mt-3">Nossa equipe está disponível para responder todas as suas dúvidas sobre o processo de exclusão de dados.</p>
                </div>
              )}
            </div>

            <div 
              onClick={() => toggleSection('faq5')}
              className="bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition cursor-pointer"
            >
              <div className="p-6 flex items-start justify-between">
                <h3 className="font-bold text-slate-900">Qual é o custo para solicitar exclusão?</h3>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition flex-shrink-0 ${expandedSection === 'faq5' ? 'rotate-180' : ''}`} />
              </div>
              {expandedSection === 'faq5' && (
                <div className="px-6 pb-6 border-t border-slate-100 text-slate-700">
                  <p>Nenhum. A solicitação de exclusão de dados é gratuita e é seu direito garantido pela lei. Não cobramos nenhuma taxa.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg p-8 text-white">
          <div className="flex items-start space-x-4">
            <Mail className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold mb-2">Pronto para solicitar?</h3>
              <p className="text-indigo-100 mb-4">
                Envie seu email para nosso time de suporte. Responderemos em até 24 horas úteis.
              </p>
              <a 
                href="mailto:suporte@matrixinformatica.com?subject=Solicito%20Exclus%C3%A3o%20de%20Meus%20Dados%20Pessoais"
                className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition"
              >
                Enviar Email de Solicitação
              </a>
            </div>
          </div>
        </div>

        {/* Legal Info */}
        <div className="mt-12 pt-12 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Informações Legais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Baseado em Lei</span>
              </h4>
              <p className="text-slate-600 text-sm">
                Este processo está em conformidade com a Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018 e o Regulamento Geral de Proteção de Dados (GDPR).
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Prazo Respeitado</span>
              </h4>
              <p className="text-slate-600 text-sm">
                Garantimos que sua solicitação será processada dentro do prazo legal máximo de 30 dias úteis.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span>Dados Seguros</span>
              </h4>
              <p className="text-slate-600 text-sm">
                Seus dados são tratados com máxima segurança durante todo o processo de exclusão.
              </p>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-8 bg-slate-50 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-3">Suporte Matrix Informática</h3>
          <p className="text-slate-700 mb-2">Para dúvidas sobre exclusão de dados ou proteção de privacidade:</p>
          <p className="text-lg font-semibold text-indigo-600">
            <a href="mailto:suporte@matrixinformatica.com" className="hover:text-indigo-700">
              suporte@matrixinformatica.com
            </a>
          </p>
          <p className="text-slate-600 text-sm mt-3">Resposta em até 24 horas úteis</p>
        </div>
      </div>
    </div>
  );
};

// ChevronDown component
const ChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);
