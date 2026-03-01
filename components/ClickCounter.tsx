import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import { useApp } from '../store';

const ClickCounter: React.FC = () => {
  const { clicksUsed, clicksLimit, clicksResetDate } = useApp();
  const [daysUntilReset, setDaysUntilReset] = useState(0);
  const [showWarning90, setShowWarning90] = useState(false);
  const [showWarning75, setShowWarning75] = useState(false);

  useEffect(() => {
    const resetDate = new Date(clicksResetDate);
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysUntilReset(Math.max(0, diffDays));

    const percentage = (clicksUsed / clicksLimit) * 100;
    setShowWarning90(percentage >= 90);
    setShowWarning75(percentage >= 75 && percentage < 90);
  }, [clicksUsed, clicksLimit, clicksResetDate]);

  const percentage = (clicksUsed / clicksLimit) * 100;
  const remaining = clicksLimit - clicksUsed;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-3 border border-slate-700">
      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-slate-100">
          {clicksUsed.toLocaleString()} / {clicksLimit.toLocaleString()}
        </span>
        <span className={`text-base font-bold ${
          remaining > 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {remaining > 0 ? `${remaining.toLocaleString()} restantes` : 'LIMITE ATINGIDO'}
        </span>
      </div>

      <div className="mt-2">
        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              percentage >= 90
                ? 'bg-red-500'
                : percentage >= 75
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Warnings */}
        {showWarning90 && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">
              <strong>Alerta!</strong> Você atingiu 90% de seus cliques. Renova em {daysUntilReset} dias.
            </p>
          </div>
        )}

        {showWarning75 && !showWarning90 && (
          <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200">
              <strong>Aviso:</strong> Você tem {remaining.toLocaleString()} cliques restantes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClickCounter;
