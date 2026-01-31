
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

export const fetchAndCacheProgressData = async (range: number): Promise<ProgressDataPackage | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    // 1. Obter contexto do usuário (Data de Início da Ofensiva)
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

    // 2. Fetch Paralelo
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

    // 3. Processar Histórico de Hábitos
    const historyMap = new Map<string, DailyHistoryRecord>();
    hSnap.forEach(d => historyMap.set(d.data().date, d.data() as DailyHistoryRecord));

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

      // Filtro Crítico de integridade (Não exibe dias antes do início do desafio)
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

    // 4. Processar Insights de Gatilhos
    const triggerLogs: any[] = [];
    tSnap.forEach(d => triggerLogs.push(d.data()));

    let triggerInsight: TriggerInsight = { totalLogs: 0, topEmotion: null, topContext: null, ranking: [] };
    
    if (triggerLogs.length > 0) {
      const emotionCounts: Record<string, number> = {};
      const contextCounts: Record<string, number> = {};
      
      triggerLogs.forEach(log => {
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
        totalLogs: triggerLogs.length,
        topEmotion: { ...maxE, percentage: Math.round((maxE.count / triggerLogs.length) * 100) },
        topContext: { ...maxC, percentage: Math.round((maxC.count / triggerLogs.length) * 100) },
        ranking
      };
    }

    // 5. Cachear e Retornar
    const result: ProgressDataPackage = { chartData: processedChartData, stats, triggerInsight };
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
