import React, { useState } from 'react';
import { X, Facebook } from 'lucide-react';

interface FacebookGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onYes: () => void;
}

export const FacebookGroupModal: React.FC<FacebookGroupModalProps> = ({ isOpen, onClose, onYes }) => {
  const [showLink, setShowLink] = useState(false);

  if (!isOpen) return null;

  const handleYes = () => {
    onYes();
    onClose();
  };

  const handleNo = () => {
    setShowLink(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center space-x-3">
            <Facebook className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Você conhece nosso grupo?</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-600">
            Somos um grupo ativo no Facebook: <span className="font-bold text-slate-900">"Preciso de um Advogado"</span>
          </p>
          <p className="text-sm text-slate-500">
            Sabemos que muitos usuários chegam até a gente através deste grupo. Você veio de lá ou conhece o grupo?
          </p>

          {!showLink ? (
            <div className="space-y-3 pt-2">
              <button
                onClick={handleYes}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center justify-center space-x-2"
              >
                <span>✓</span>
                <span>Sim, conheço / Vim de lá</span>
              </button>
              <button
                onClick={handleNo}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition"
              >
                Não, não conheço
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-slate-600 mb-4">
                Que tal conhecer nosso grupo no Facebook? Lá temos muito conteúdo útil!
              </p>
              <a
                href="https://www.facebook.com/share/g/1GDasHh3yd/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center justify-center space-x-2"
              >
                <Facebook className="w-5 h-5" />
                <span>Ir para o grupo</span>
              </a>
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
