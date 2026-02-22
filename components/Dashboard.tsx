import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { generateWelcomeMessage } from '../services/aiProvider';
import { LogOut, Sparkles, User as UserIcon } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchMessage = async () => {
      try {
        const msg = await generateWelcomeMessage(user.name);
        if (mounted) setWelcomeMessage(msg);
      } catch (err) {
        if (mounted) setWelcomeMessage(`Olá, ${user.name}!`);
      } finally {
        if (mounted) setLoadingMessage(false);
      }
    };

    fetchMessage();

    return () => {
      mounted = false;
    };
  }, [user.name]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                   <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">LoginFlow</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-gray-100 py-1.5 px-3 rounded-full">
                <UserIcon size={16} />
                {user.email}
              </div>
              <Button variant="ghost" onClick={onLogout} className="text-gray-600 hover:text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8 md:p-12">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                 <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="space-y-4 max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                
                {loadingMessage ? (
                  <div className="animate-pulse flex space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ) : (
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {welcomeMessage}
                  </p>
                )}
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Visão Geral</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Sessões Ativas', value: '1', color: 'bg-green-100 text-green-700' },
                      { label: 'Último Acesso', value: 'Hoje', color: 'bg-blue-100 text-blue-700' },
                      { label: 'Segurança', value: 'Alta', color: 'bg-purple-100 text-purple-700' },
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stat.color}`}>
                          Ativo
                        </div>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};