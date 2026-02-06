
import React, { useEffect, useState, useRef } from 'react';
import { Wrapper } from '../components/Wrapper';
import { COLORS } from '../types';
import { 
  fetchAndCacheProgressData, 
  ProgressDataPackage, 
  ChartDataPoint, 
  Stats, 
  TriggerInsight 
} from '../services/progressService';

const RANGES = [7, 15, 30, 90];

export const ProgressScreen: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState(7);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState<Stats>({ average: 0, perfectDays: 0 });
  const [triggerInsight, setTriggerInsight] = useState<TriggerInsight | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * loadData (Cache-First Logic)
   */
  const loadData = async () => {
    const cacheKey = `@progress_data_${selectedRange}`;
    const cached = localStorage.getItem(cacheKey);
    let hasCache = false;

    if (cached) {
      try {
        const { data } = JSON.parse(cached) as { data: ProgressDataPackage };
        setChartData(data.chartData);
        setStats(data.stats);
        setTriggerInsight(data.triggerInsight);
        hasCache = true;
      } catch (e) {
        console.warn("Invalid cache for progress");
      }
    }

    if (!hasCache) {
      setLoading(true);
    }

    try {
      const result = await fetchAndCacheProgressData(selectedRange);
      if (result) {
        setChartData(result.chartData);
        setStats(result.stats);
        setTriggerInsight(result.triggerInsight);
      }
    } catch (error) {
      console.error("Silent background update failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRange]);

  useEffect(() => {
    if (!loading && chartData.length > 0 && scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      }, 150);
    }
  }, [loading, chartData, selectedRange]);

  /**
   * 1. Padronização da Largura das Barras
   * 7 dias = w-8 | 15, 30, 90 dias = w-4
   */
  const getBarWidthClass = () => {
    if (selectedRange === 7) return "w-8"; 
    return "w-4"; 
  };

  return (
    <Wrapper noPadding>
      <div className="flex-1 w-full h-full overflow-y-auto scrollbar-hide bg-black">
        <div className="w-full max-w-full px-5 pt-6 pb-32 flex flex-col">
          
          <div className="flex flex-col mb-6">
            <h1 className="text-xl font-bold text-white tracking-wide">
              Evolução & Análise
            </h1>
            <p className="text-xs" style={{ color: COLORS.TextSecondary }}>
              Sua jornada dia após dia
            </p>
          </div>

          <div className="w-full flex p-1 rounded-xl mb-6 bg-[#1F2937]/30 border border-[#2E243D]">
            {RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  selectedRange === range 
                    ? 'bg-[#8B5CF6] text-white shadow-lg' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {range}D
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 w-full">
            <div className="p-4 rounded-xl border border-[#2E243D] bg-[#0F0A15] flex flex-col items-center justify-center relative overflow-hidden w-full">
              <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 z-10">Média</span>
              <span className={`text-3xl font-bold z-10 transition-colors duration-500 ${stats.average >= 80 ? 'text-[#10B981]' : 'text-white'}`}>
                {stats.average}%
              </span>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#8B5CF6]/10 rounded-full blur-xl"></div>
            </div>
            
            <div className="p-4 rounded-xl border border-[#2E243D] bg-[#0F0A15] flex flex-col items-center justify-center relative overflow-hidden w-full">
              <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 z-10">Dias Perfeitos</span>
              <span className="text-3xl font-bold text-white z-10">
                {stats.perfectDays}
              </span>
               <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#10B981]/10 rounded-full blur-xl"></div>
            </div>
          </div>

          <div className="w-full flex flex-col mb-10">
            <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
              Linha do Tempo
            </h3>

            {loading ? (
               <div className="w-full h-[200px] flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : chartData.length === 0 ? (
              <div className="w-full h-[200px] flex flex-col items-center justify-center text-center opacity-50 border border-dashed border-gray-800 rounded-xl">
                 <p className="text-sm font-bold text-white mb-2">Jornada Iniciada</p>
                 <p className="text-xs text-gray-400">Complete seus rituais hoje para gerar dados.</p>
              </div>
            ) : (
              /**
               * 2. Lógica de Layout e Rolagem
               * Apenas 7 e 15 dias são estáticos. 30 e 90 dias ativam scroll horizontal.
               */
              <div 
                ref={scrollRef}
                className={`w-full ${selectedRange === 7 || selectedRange === 15 ? 'overflow-x-hidden' : 'overflow-x-auto'} pb-4 scrollbar-hide`}
              >
                <div 
                  className={`flex items-end min-w-full ${selectedRange === 7 || selectedRange === 15 ? 'justify-between px-0' : 'gap-3 px-2'} border-b border-[#2E243D] relative transition-opacity duration-300`}
                  style={{ height: '200px' }} 
                >
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 w-full h-full z-0">
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                  </div>

                  {chartData.map((item, index) => {
                    const hasData = item.value > 0;
                    const barHeight = `${item.value}%`; 
                    
                    return (
                      <div key={`${selectedRange}-${index}`} className="flex flex-col items-center gap-2 group cursor-pointer z-10 h-full justify-end flex-shrink-0">
                        <div className="relative flex items-end h-full w-full justify-center">
                          <div 
                            className={`rounded-t-sm transition-all duration-700 ease-out relative ${getBarWidthClass()}`}
                            style={{ 
                              height: hasData ? barHeight : '4px',
                              backgroundColor: hasData ? COLORS.Primary : '#1F2937',
                              minHeight: '4px',
                            }}
                          >
                            {item.value === 100 && (
                                <div className="absolute inset-0 bg-[#8B5CF6] blur-[6px] opacity-50"></div>
                            )}
                          </div>
                        </div>
                        
                        <span className="text-[9px] font-bold text-gray-500">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="w-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                Raio-X dos Gatilhos
              </h3>
            </div>

            {triggerInsight && triggerInsight.totalLogs > 0 ? (
              <div className="flex flex-col gap-4 w-full animate-fadeIn">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1F1212] to-[#000000] border border-red-900/30 relative overflow-hidden w-full">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <svg className="w-24 h-24 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  </div>
                  
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">
                    Seu Maior Inimigo Atual
                  </h4>
                  
                  <p className="text-lg font-medium text-white leading-relaxed z-10 relative">
                    Nos últimos {selectedRange} dias, <span className="text-red-400 font-bold">{triggerInsight.topEmotion?.percentage}%</span> das vontades foram causadas por <span className="text-red-400 font-bold">{triggerInsight.topEmotion?.name}</span>, principalmente quando: <span className="text-white border-b border-red-500/50 pb-0.5">{triggerInsight.topContext?.name}</span>.
                  </p>
                </div>

                <div className="bg-[#0F0A15] rounded-xl border border-[#2E243D] p-4 w-full">
                  <h5 className="text-[10px] uppercase text-gray-500 font-bold mb-3">Ranking de Recorrência</h5>
                  <div className="flex flex-col gap-3 w-full">
                    {triggerInsight.ranking.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-600 w-4">#{idx + 1}</span>
                          <span className="text-sm text-white font-medium">{item.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 bg-[#1F2937] px-2 py-1 rounded-md">
                          {item.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full p-6 rounded-xl border border-dashed border-[#2E243D] flex flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-400 mb-1">Nenhum gatilho registrado.</p>
                <p className="text-xs text-gray-600">Use o botão "Registrar Gatilho" na Home.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
};
