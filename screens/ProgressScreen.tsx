import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getTriggers, TriggerLog } from '../services/triggerService';
import { Wrapper } from '../components/Wrapper';
import { COLORS } from '../types';

// Data Types
interface DailyHistory {
  date: string;
  percentage: number;
  completed_count?: number; // Added for precise calculation
  total_habits?: number;    // Added for precise calculation
}

interface ChartDataPoint {
  label: string;      // "D1", "D50"
  fullDate: string;   // "2023-11-05"
  value: number;      // 0-100 (Calculated Percentage)
  count: number;      // Raw count (0-6)
  dayNumber: number;  // The raw day number
}

interface Stats {
  average: number;
  perfectDays: number;
}

// Insight Data Type
interface TriggerInsight {
  totalLogs: number;
  topEmotion: { name: string; count: number; percentage: number } | null;
  topContext: { name: string; count: number; percentage: number } | null;
  ranking: { name: string; count: number }[];
}

const RANGES = [7, 15, 30, 90];

export const ProgressScreen: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState(7);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState<Stats>({ average: 0, perfectDays: 0 });
  const [triggerInsight, setTriggerInsight] = useState<TriggerInsight | null>(null);
  
  // Ref for the horizontal scroll container
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- DATA LOGIC ---

  // Helper: Format date to YYYY-MM-DD (local time)
  const formatDateKey = (date: Date) => {
    return date.toLocaleDateString('en-CA');
  };

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setLoading(true);

    try {
      // 1. Fetch User Profile to get Start Date
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let startDate = new Date(); // Fallback to today
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.current_streak_start) {
          startDate = new Date(userData.current_streak_start);
        }
      }
      startDate.setHours(0, 0, 0, 0);

      // 2. Determine Query Range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const queryStartDate = new Date(today);
      queryStartDate.setDate(today.getDate() - (selectedRange - 1));
      const queryStartDateStr = formatDateKey(queryStartDate);

      // 3. Parallel Fetching: History AND Triggers
      const historyPromise = fetchHistory(user.uid, queryStartDateStr, startDate, today);
      const triggersPromise = getTriggers(user.uid, queryStartDateStr);

      const [historyResults, triggerLogs] = await Promise.all([historyPromise, triggersPromise]);

      setChartData(historyResults.processedData);
      setStats(historyResults.newStats);
      
      // 4. Process Trigger Logic
      processTriggerInsights(triggerLogs);

    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (uid: string, queryStartDateStr: string, streakStartDate: Date, today: Date) => {
    const historyRef = collection(db, "users", uid, "daily_history");
    const q = query(
      historyRef, 
      where("date", ">=", queryStartDateStr),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    const historyMap = new Map<string, DailyHistory>();

    querySnapshot.forEach((doc) => {
      const data = doc.data() as DailyHistory;
      historyMap.set(data.date, data);
    });

    const processedData: ChartDataPoint[] = [];
    let totalPercentage = 0;
    let perfectCount = 0;
    let validDaysCount = 0;

    for (let i = selectedRange - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);
      
      const dateKey = formatDateKey(targetDate);
      const diffTime = targetDate.getTime() - streakStartDate.getTime();
      const dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (dayNumber < 1) continue; 

      const record = historyMap.get(dateKey);

      // --- CRITICAL FIX: CALCULATE PERCENTAGE BASED ON COUNT ---
      const count = record?.completed_count ?? 0;
      const totalTasks = record?.total_habits || 6; // Default to 6 if undefined
      
      // Math: (3 / 6) * 100 = 50%
      const rawPercentage = (count / totalTasks) * 100;
      const value = Math.min(Math.round(rawPercentage), 100);

      totalPercentage += value;
      if (value === 100) perfectCount++;
      validDaysCount++;

      processedData.push({
        label: `D${dayNumber}`,
        fullDate: dateKey,
        value: value,
        count: count,
        dayNumber: dayNumber
      });
    }

    return {
      processedData,
      newStats: {
        average: validDaysCount > 0 ? Math.round(totalPercentage / validDaysCount) : 0,
        perfectDays: perfectCount
      }
    };
  };

  const processTriggerInsights = (logs: TriggerLog[]) => {
    if (logs.length === 0) {
      setTriggerInsight({ totalLogs: 0, topEmotion: null, topContext: null, ranking: [] });
      return;
    }

    const emotionCounts: Record<string, number> = {};
    const contextCounts: Record<string, number> = {};
    
    // Aggregate
    logs.forEach(log => {
      emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;
      contextCounts[log.context] = (contextCounts[log.context] || 0) + 1;
    });

    // Find Top Emotion
    let maxEmotion = { name: '', count: 0 };
    Object.entries(emotionCounts).forEach(([name, count]) => {
      if (count > maxEmotion.count) maxEmotion = { name, count };
    });

    // Find Top Context
    let maxContext = { name: '', count: 0 };
    Object.entries(contextCounts).forEach(([name, count]) => {
      if (count > maxContext.count) maxContext = { name, count };
    });

    // Create Ranking (Combined simple list)
    const ranking = Object.entries(emotionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    setTriggerInsight({
      totalLogs: logs.length,
      topEmotion: { ...maxEmotion, percentage: Math.round((maxEmotion.count / logs.length) * 100) },
      topContext: { ...maxContext, percentage: Math.round((maxContext.count / logs.length) * 100) },
      ranking
    });
  };

  useEffect(() => {
    fetchData();
  }, [selectedRange]);

  // Auto-scroll logic
  useEffect(() => {
    if (!loading && scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [loading, chartData]);

  // --- RENDER HELPERS ---
  const getBarWidthClass = () => {
    if (selectedRange <= 15) return "w-8"; 
    if (selectedRange <= 30) return "w-4"; 
    return "w-3"; 
  };

  return (
    <Wrapper noPadding>
      {/* 
        CONTAINER DE SCROLL VERTICAL (Viewport)
        flex-1, h-full: Garante que ocupe a altura disponível
        overflow-y-auto: Habilita o scroll vertical seguro
        bg-black: Fundo consistente
      */}
      <div className="flex-1 w-full h-full overflow-y-auto scrollbar-hide bg-black">
        
        {/* 
          CONTAINER DE CONTEÚDO
          w-full: Largura total
          px-5: Padding horizontal de 20px (Safe Area visual)
          pb-32: Espaço para o menu inferior
        */}
        <div className="w-full max-w-full px-5 pt-6 pb-32 flex flex-col">
          
          {/* HEADER */}
          <div className="flex flex-col mb-6">
             <h1 className="text-xl font-bold text-white tracking-wide">
               Evolução & Análise
             </h1>
             <p className="text-xs" style={{ color: COLORS.TextSecondary }}>
               Sua jornada dia após dia
             </p>
          </div>

          {/* RANGE SELECTOR (TABS) */}
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

          {/* KPI CARDS - Grid Responsivo */}
          <div className="grid grid-cols-2 gap-4 mb-8 w-full">
            <div className="p-4 rounded-xl border border-[#2E243D] bg-[#0F0A15] flex flex-col items-center justify-center relative overflow-hidden w-full">
              <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 z-10">Média</span>
              <span className={`text-3xl font-bold z-10 ${stats.average >= 80 ? 'text-[#10B981]' : 'text-white'}`}>
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

          {/* CHART CONTAINER */}
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
                 <p className="text-xs text-gray-400">Complete seus hábitos hoje para ver o D1.</p>
              </div>
            ) : (
              // Scroll Horizontal contido no pai
              <div 
                ref={scrollRef}
                className="w-full overflow-x-auto pb-4 scrollbar-hide"
              >
                <div 
                  className="flex items-end min-w-full gap-3 border-b border-[#2E243D] relative px-2"
                  style={{ height: '200px' }} 
                >
                  {/* Background Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 w-full h-full z-0">
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                    <div className="w-full h-px bg-white"></div>
                  </div>

                  {chartData.map((item, index) => {
                    const hasData = item.value > 0;
                    const barHeight = `${item.value}%`; 
                    
                    return (
                      <div key={index} className="flex flex-col items-center gap-2 group cursor-pointer z-10 h-full justify-end flex-shrink-0">
                        <div className="relative flex items-end h-full w-full justify-center">
                          <div 
                            className={`rounded-t-sm transition-all duration-500 ease-out relative ${getBarWidthClass()}`}
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

          {/* RAIO-X DOS GATILHOS */}
          <div className="w-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                Raio-X dos Gatilhos
              </h3>
            </div>

            {!loading && triggerInsight && triggerInsight.totalLogs > 0 ? (
              <div className="flex flex-col gap-4 w-full">
                {/* Main Alert Card */}
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

                {/* Ranking List */}
                <div className="bg-[#0F0A15] rounded-xl border border-[#2E243D] p-4 w-full">
                  <h5 className="text-[10px] uppercase text-gray-500 font-bold mb-3">Top Gatilhos Recorrentes</h5>
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
                <p className="text-xs text-gray-600">Use o botão "Registrar Gatilho" na Home quando sentir vontade.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
};