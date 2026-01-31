
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface DailyHistoryRecord {
  date: string;
  percentage: number;
  completed_count?: number; 
  total_habits?: number;    
}

export interface ChartDataPoint {
  label: string;      
  fullDate: string;   
  value: number;      
  count: number;      
  dayNumber: number;  
}

export interface Stats {
  average: number;
  perfectDays: number;
}

export interface TriggerInsight {
  totalLogs: number;
  topEmotion: { name: string; count: number; percentage: number } | null;
  topContext: { name: string; count: number; percentage: number } | null;
  ranking: { name: string; count: number }[];
}

export interface ProgressDataPackage {
  chartData: ChartDataPoint[];
  stats: Stats;
  triggerInsight: TriggerInsight;
}

const CACHE_KEY_PREFIX = '@progress_data_';

const formatDateKey = (date: Date) => date.toLocaleDateString('en-CA');

/**
 * Função Auxiliar Interna para processar dados brutos em um range específico (RAM Only)
 */
const processRangeData = (
  range: number, 
  historyMap: Map<string, DailyHistoryRecord>, 
  triggerLogs: any[], 
  streakStartDate: Date,
  today: Date
): ProgressDataPackage => {
  const queryStartDate = new Date(today);
  queryStartDate.setDate(today.getDate() - (range - 1));
  const queryStartDateStr = formatDateKey(queryStartDate);

  // 1. Processar Histórico de Hábitos
  const processedChartData: ChartDataPoint[] = [];
  let totalPercentage = 0;
  let perfectCount = 0;
  let validDaysCount = 0;

  for (let i = range - 1; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    targetDate.setHours(0, 0, 0, 0);
    
    const dateKey = formatDateKey(targetDate);
    const diffTime = targetDate.getTime() - streakStartDate.getTime();
    const dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (dayNumber < 1) continue; 

    const record = historyMap.get(dateKey);
    const count = record?.completed_count ?? 0;
    const totalTasks = record?.total_habits || 6; 
    const rawPercentage = (count / totalTasks) * 100;
    const value = Math.min(Math.round(rawPercentage), 100);

    totalPercentage += value;
    if (value === 100) perfectCount++;
    validDaysCount++;

    processedChartData.push({
      label: `D${dayNumber}`,
      fullDate: dateKey,
      value: value,
      count: count,
      dayNumber: dayNumber
    });
  }

  const stats: Stats = {
    average: validDaysCount > 0 ? Math.round(totalPercentage / validDaysCount) : 0,
    perfectDays: perfectCount
  };

  // 2. Processar Insights de Gatilhos (Filtrar logs do range)
  const rangeTriggers = triggerLogs.filter(log => log.date_string >= queryStartDateStr);
  let triggerInsight: TriggerInsight = { totalLogs: 0, topEmotion: null, topContext: null, ranking: [] };
  
  if (rangeTriggers.length > 0) {
    const emotionCounts: Record<string, number> = {};
    const contextCounts: Record<string, number> = {};
    
    rangeTriggers.forEach(log => {
      emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;
      contextCounts[log.context] = (contextCounts[log.context] || 0) + 1;
    });

    let maxE = { name: '', count: 0 };
    Object.entries(emotionCounts).forEach(([name, count]) => { if (count > maxE.count) maxE = { name, count }; });

    let maxC = { name: '', count: 0 };
    Object.entries(contextCounts).forEach(([name, count]) => { if (count > maxC.count) maxC = { name, count }; });

    const ranking = Object.entries(emotionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    triggerInsight = {
      totalLogs: rangeTriggers.length,
      topEmotion: { ...maxE, percentage: Math.round((maxE.count / rangeTriggers.length) * 100) },
      topContext: { ...maxC, percentage: Math.round((maxC.count / rangeTriggers.length) * 100) },
      ranking
    };
  }

  return { chartData: processedChartData, stats, triggerInsight };
};

/**
 * ATUALIZAÇÃO EM MASSA (Single Fetch, Multi-Cache)
 * Otimiza performance realizando uma única leitura de 90 dias e distribuindo para todos os caches.
 */
export const updateAllProgressCaches = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    let streakStartDate = new Date();
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.current_streak_start) {
        streakStartDate = new Date(userData.current_streak_start);
      }
    }
    streakStartDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Busca o range máximo: 90 dias
    const maxRange = 90;
    const queryStartDate = new Date(today);
    queryStartDate.setDate(today.getDate() - (maxRange - 1));
    const queryStartDateStr = formatDateKey(queryStartDate);

    // Fetch Único
    const historyRef = collection(db, "users", user.uid, "daily_history");
    const hQuery = query(
      historyRef, 
      where("date", ">=", queryStartDateStr),
      orderBy("date", "desc")
    );

    const triggersRef = collection(db, "users", user.uid, "trigger_logs");
    const tQuery = query(
      triggersRef,
      where('date_string', '>=', queryStartDateStr),
      orderBy('date_string', 'desc')
    );

    const [hSnap, tSnap] = await Promise.all([getDocs(hQuery), getDocs(tQuery)]);

    // Dados crus em memória
    const historyMap = new Map<string, DailyHistoryRecord>();
    hSnap.forEach(d => historyMap.set(d.data().date, d.data() as DailyHistoryRecord));
    
    const triggerLogs: any[] = [];
    tSnap.forEach(d => triggerLogs.push(d.data()));

    // Processar e salvar todos os ranges de uma vez
    const ranges = [7, 15, 30, 90];
    for (const range of ranges) {
      const packageData = processRangeData(range, historyMap, triggerLogs, streakStartDate, today);
      localStorage.setItem(`${CACHE_KEY_PREFIX}${range}`, JSON.stringify({
        timestamp: Date.now(),
        data: packageData
      }));
    }

    console.log(`[ProgressService] Todos os ${ranges.length} caches atualizados com sucesso.`);
  } catch (error) {
    console.error("Critical batch progress update failure:", error);
    throw error;
  }
};

/**
 * Versão original para compatibilidade (carregamento sob demanda)
 */
export const fetchAndCacheProgressData = async (range: number): Promise<ProgressDataPackage | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    let streakStartDate = new Date();
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.current_streak_start) {
        streakStartDate = new Date(userData.current_streak_start);
      }
    }
    streakStartDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const queryStartDate = new Date(today);
    queryStartDate.setDate(today.getDate() - (range - 1));
    const queryStartDateStr = formatDateKey(queryStartDate);

    const historyRef = collection(db, "users", user.uid, "daily_history");
    const hQuery = query(
      historyRef, 
      where("date", ">=", queryStartDateStr),
      orderBy("date", "desc")
    );

    const triggersRef = collection(db, "users", user.uid, "trigger_logs");
    const tQuery = query(
      triggersRef,
      where('date_string', '>=', queryStartDateStr),
      orderBy('date_string', 'desc')
    );

    const [hSnap, tSnap] = await Promise.all([getDocs(hQuery), getDocs(tQuery)]);

    const historyMap = new Map<string, DailyHistoryRecord>();
    hSnap.forEach(d => historyMap.set(d.data().date, d.data() as DailyHistoryRecord));

    const triggerLogs: any[] = [];
    tSnap.forEach(d => triggerLogs.push(d.data()));

    const result = processRangeData(range, historyMap, triggerLogs, streakStartDate, today);
    
    localStorage.setItem(`${CACHE_KEY_PREFIX}${range}`, JSON.stringify({
      timestamp: Date.now(),
      data: result
    }));

    return result;
  } catch (error) {
    console.error("Progress service error:", error);
    return null;
  }
};
