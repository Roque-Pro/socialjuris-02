import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ClickLimitModalProps {
  isOpen: boolean;
  daysUntilReset: number;
  onClose: () => void;
}

const ClickLimitModal: React.FC<ClickLimitModalProps> = ({ isOpen, daysUntilReset, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Limite de Cliques Atingido</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-slate-700">
            Você atingiu o limite de 5.000 cliques do seu plano mensal.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Próxima renovação:</strong> em {daysUntilReset} dias
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Seu plano se renova automaticamente. Todos os seus cliques serão resetados.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-bold text-slate-900 mb-2">Sugestões:</h3>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>✓ Aguarde o reset do plano</li>
              <li>✓ Use a plataforma para organizar tarefas</li>
              <li>✓ Revise documentos já gerados</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClickLimitModal;
