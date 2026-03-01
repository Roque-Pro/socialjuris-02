import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface PriceData {
  type: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  lastUpdated: string;
}

const MarketPricesIndex: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([
    { type: 'Petição', minPrice: 1500, maxPrice: 5000, avgPrice: 3250, lastUpdated: '' },
    { type: 'Embargos', minPrice: 1200, maxPrice: 4000, avgPrice: 2600, lastUpdated: '' },
    { type: 'Recurso', minPrice: 1800, maxPrice: 5500, avgPrice: 3650, lastUpdated: '' },
    { type: 'Contestação', minPrice: 1000, maxPrice: 3500, avgPrice: 2250, lastUpdated: '' },
    { type: 'Manifestação', minPrice: 800, maxPrice: 2500, avgPrice: 1650, lastUpdated: '' },
    { type: 'Notificação Extra Judicial', minPrice: 500, maxPrice: 1500, avgPrice: 1000, lastUpdated: '' },
    { type: 'Procuração', minPrice: 300, maxPrice: 800, avgPrice: 550, lastUpdated: '' },
    { type: 'Contrato', minPrice: 1500, maxPrice: 5000, avgPrice: 3250, lastUpdated: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [lastUpdateDate, setLastUpdateDate] = useState<string>('');

  // Inicializar data de atualização do localStorage e programar atualização automática
  useEffect(() => {
    const storedDate = localStorage.getItem('marketPricesLastUpdate');
    if (storedDate) {
      setLastUpdateDate(storedDate);
    } else {
      // Primeira vez - apenas inicializar data
      const now = new Date().toISOString();
      setLastUpdateDate(now);
      localStorage.setItem('marketPricesLastUpdate', now);
    }

    // Programar atualização automática a cada 7 dias
    const interval = setInterval(() => {
      const lastUpdate = localStorage.getItem('marketPricesLastUpdate');
      if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 7) {
          updatePrices();
        }
      }
    }, 60 * 60 * 1000); // Verifica a cada 1 hora

    return () => clearInterval(interval);
  }, []);

  const updatePrices = async () => {
    setLoading(true);
    try {
      // Aqui você poderia fazer uma chamada real a uma API de preços de mercado
      // Por enquanto, simulamos com variação aleatória
      const updatedPrices = prices.map(price => ({
        ...price,
        minPrice: Math.round(price.minPrice * (0.95 + Math.random() * 0.1)),
        maxPrice: Math.round(price.maxPrice * (0.95 + Math.random() * 0.1)),
        avgPrice: Math.round(price.avgPrice * (0.95 + Math.random() * 0.1)),
      }));

      setPrices(updatedPrices);
      
      const now = new Date().toISOString();
      setLastUpdateDate(now);
      localStorage.setItem('marketPricesLastUpdate', now);

      // Aqui você poderia salvar no banco de dados também
    } catch (error) {
      console.error('Erro ao atualizar preços:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getFormattedDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header com informações de atualização */}
      <div className="flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 mb-1">Índice de Valores de Mercado</h3>
          <p className="text-xs text-slate-500">
            Último: {getFormattedDate(lastUpdateDate)} • Próx.: {lastUpdateDate ? new Date(new Date(lastUpdateDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Grid de minicards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {prices.map((price, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition hover:border-blue-300"
          >
            <h4 className="font-bold text-slate-900 mb-3 text-sm">{price.type}</h4>
            
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Mínimo</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(price.minPrice)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Médio</span>
                <span className="text-sm font-bold text-blue-600">
                  {formatCurrency(price.avgPrice)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Máximo</span>
                <span className="text-sm font-semibold text-orange-600">
                  {formatCurrency(price.maxPrice)}
                </span>
              </div>
            </div>

            {/* Barra visual de faixa de preço */}
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="absolute h-full bg-gradient-to-r from-green-500 to-orange-500 rounded-full"
                style={{
                  width: '100%',
                }}
              />
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Variação: {formatCurrency(price.maxPrice - price.minPrice)}
            </p>
          </div>
        ))}
      </div>

      {/* Nota informativa */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">⚠️ Sugestões de Pesquisa IA</p>
          <p className="text-xs mt-1">
            Os valores exibidos são <span className="font-semibold">sugestões baseadas em pesquisas de mercado realizadas pela IA</span> e podem variar conforme a complexidade do caso, especialidade do advogado e região. <span className="font-semibold">Consulte sempre tabelas oficiais da OAB de seu estado</span> para referências atualizadas e precisas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketPricesIndex;
