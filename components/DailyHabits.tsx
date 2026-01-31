
import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { COLORS, MASTER_HABITS, UserProfile } from '../types';
import { updateAllProgressCaches } from '../services/progressService';

interface DailyHabitsProps {
  profile: UserProfile | null;
}

const DEFAULT_HABIT_IDS = ['meditacao', 'musculacao', 'leitura', 'banho_gelado', 'sono', 'sol'];

export const DailyHabits: React.FC<DailyHabitsProps> = ({ profile }) => {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  
  const getTodayDateKey = () => {
    return new Date().toLocaleDateString('en-CA'); 
  };

  const todayDate = getTodayDateKey();
  const STORAGE_KEY = `@habits_${todayDate}`;

  const displayHabits = React.useMemo(() => {
    const ids = profile?.selected_habits || DEFAULT_HABIT_IDS;
    return MASTER_HABITS.filter(h => ids.includes(h.id));
  }, [profile]);

  useEffect(() => {
    try {
      const savedHabits = localStorage.getItem(STORAGE_KEY);
      if (savedHabits) {
        setCompletedIds(JSON.parse(savedHabits));
      }
    } catch (error) {
      console.error("Failed to load habits", error);
    }
  }, [STORAGE_KEY]);

  const syncProgressToDB = async (currentIds: string[]) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const total = displayHabits.length;
      const count = currentIds.length;
      const percentage = Math.round((count / total) * 100);

      const historyRef = doc(db, "users", user.uid, "daily_history", todayDate);

      const payload = {
        date: todayDate,
        completed_count: count,
        total_habits: total,
        habits_ids: currentIds,
        percentage: percentage,
        last_updated: new Date().toISOString()
      };

      await setDoc(historyRef, payload, { merge: true });
    } catch (error) {
      console.error("Failed to sync progress", error);
    }
  };

  const toggleHabit = (id: string) => {
    setCompletedIds(prev => {
      const isCompleted = prev.includes(id);
      let newHabits = isCompleted ? prev.filter(item => item !== id) : [...prev, id];
      
      // Salva localmente
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHabits));
      
      // ATUALIZAÇÃO EM BACKGROUND (ZERO LOADING)
      // Otimização: Atualiza TODOS os gráficos (7, 15, 30, 90) com uma única leitura de banco
      updateAllProgressCaches()
        .then(() => console.log("[UI-Optimistic] Todos os rituais sincronizados com sucesso."))
        .catch(err => console.error("Erro na atualização em massa dos rituais:", err));
      
      // Sincroniza com o banco remoto
      syncProgressToDB(newHabits);
      
      return newHabits;
    });
  };

  const getIcon = (name: string, checked: boolean) => {
    const color = checked ? '#FFFFFF' : '#9CA3AF';
    switch (name) {
      case 'barbell': case 'musculacao':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 18h18M8 6v12M16 6v12M4 6h16M4 18h16" /></svg>;
      case 'book': case 'leitura':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
      case 'water': case 'cardio':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
      case 'sparkles': case 'meditacao':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>;
      case 'snow': case 'banho_gelado':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-6.364-1.636l12.728-12.728M3 12h18M5.636 5.636l12.728 12.728" /></svg>;
      case 'moon': case 'sono':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
      case 'sun': case 'sol':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
      case 'pencil': case 'journaling':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
      default:
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  return (
    <div className="flex flex-col w-full">
      {displayHabits.map((habit) => {
        const isChecked = completedIds.includes(habit.id);
        return (
          <button
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className="flex flex-row items-center w-full mb-3 px-4 rounded-xl border transition-all duration-200 active:scale-[0.98]"
            style={{ height: '60px', backgroundColor: '#111827', borderColor: '#1F2937' }}
          >
            <div className="flex-shrink-0 opacity-70">
              {getIcon(habit.id, isChecked)}
            </div>
            <div className="flex-1 ml-3 text-left">
              <span className="text-sm font-medium" style={{ color: isChecked ? '#FFFFFF' : '#D1D5DB' }}>
                {habit.label}
              </span>
            </div>
            <div className="flex-shrink-0">
               {isChecked ? (
                 <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#10B981]">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                 </div>
               ) : (
                 <div className="w-6 h-6 rounded-full border-2 border-[#374151]"></div>
               )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
