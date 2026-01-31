
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { StreakTimer } from '../components/StreakTimer';
import { NeuroDebugCard } from '../components/NeuroDebugCard';
import { DailyHabits } from '../components/DailyHabits';
import { TriggerModal } from '../components/TriggerModal';
import { ShortcutPrompt } from '../components/ShortcutPrompt';
import { COLORS, Routes, UserProfile } from '../types';

// Otimização de Backend: 20 minutos de Cache TTL
const CACHE_DURATION = 20 * 60 * 1000; 
const CACHE_KEY = 'user_profile';
const CACHE_TS_KEY = 'user_profile_ts';

const VITAL_CAPITAL_MILESTONES = [
  { hours: 1, text: "Daria para um treino intenso de musculação." },
  { hours: 3, text: "Tempo suficiente para ver um filme épico." },
  { hours: 5, text: "Poderia ter lido um livro curto inteiro." },
  { hours: 10, text: "Daria para aprender o básico de um novo idioma." },
  { hours: 24, text: "Um dia inteiro de vida recuperado!" },
  { hours: 50, text: "Tempo de zerar um jogo complexo ou criar um projeto." },
  { hours: 100, text: "Daria para atingir nível intermediário em inglês." },
  { hours: 500, text: "Metade do caminho para ser expert em algo." },
  { hours: 1000, text: "Você poderia ter mudado de carreira com esse tempo." }
];

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  const getVitalMessage = (hours: number) => {
    const milestone = [...VITAL_CAPITAL_MILESTONES].reverse().find(m => hours >= m.hours);
    return milestone ? milestone.text : "O começo da liberdade... Continue firme.";
  };

  /**
   * Lógica de Carregamento Híbrida (Cache + Rede)
   */
  const loadProfile = useCallback(async (uid: string, force = false) => {
    try {
      const now = Date.now();
      const cachedProfile = localStorage.getItem(CACHE_KEY);
      const cachedTs = localStorage.getItem(CACHE_TS_KEY);

      // 1. Tentar Cache se não for atualização forçada
      if (!force && cachedProfile && cachedTs) {
        const ts = parseInt(cachedTs, 10);
        if (now - ts < CACHE_DURATION) {
          setProfile(JSON.parse(cachedProfile));
          setIsLoading(false);
          return;
        }
      }

      // 2. Fetch Firebase (apenas se expirado ou forçado)
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        
        // Sincroniza Cache Local
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TS_KEY, now.toString());
      } else {
        if (!cachedProfile) navigate(Routes.ONBOARDING);
      }
    } catch (error) {
      console.error("Dashboard profile load error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
           if (!user) navigate(Routes.LOGIN);
           else await loadProfile(user.uid);
        });
        return () => unsubscribe();
      } else {
        await loadProfile(currentUser.uid);
      }
    };
    checkAuth();
  }, [loadProfile, navigate]);

  // Gatilho Oculto para Refresh Forçado (toque no status)
  const forceUpdate = () => {
    if (!auth.currentUser) return;
    loadProfile(auth.currentUser.uid, true);
    // Feedback tátil via vibração (se suportado)
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleSosClick = () => {
    navigate(Routes.SOS);
  };

  // Cálculos dinâmicos (Matemática roda mesmo com dados cacheados)
  const vitalStats = useMemo(() => {
    if (!profile?.current_streak_start) return { hoursSaved: 0 };
    const start = new Date(profile.current_streak_start).getTime();
    const now = new Date().getTime();
    const diffDays = Math.max(0, (now - start) / (1000 * 60 * 60 * 24));
    const dailyMinutes = profile.daily_addiction_minutes || 45;
    const hoursSaved = Math.floor((diffDays * dailyMinutes) / 60);
    return { hoursSaved };
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex-1 h-[100dvh] w-full flex flex-col items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-4" style={{ borderColor: COLORS.Primary, borderTopColor: 'transparent' }} />
        <span className="text-[10px] font-bold tracking-[0.3em] opacity-30 uppercase" style={{ color: COLORS.TextSecondary }}>Protocolo</span>
      </div>
    );
  }

  return (
    <Wrapper noPadding> 
      <div className="flex-1 w-full h-full overflow-y-auto scrollbar-hide bg-black">
        <div className="w-full max-w-full px-5 pt-8 pb-32 flex flex-col items-center">
          
          <header className="flex flex-col w-full mb-6">
            <div 
              className="flex items-center gap-2 mb-2 cursor-pointer active:opacity-50 transition-opacity w-fit"
              onClick={forceUpdate}
            >
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
               <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: COLORS.TextSecondary }}>Status: Operante</span>
            </div>
            <StreakTimer startDate={profile?.current_streak_start} />
          </header>

          {/* Seção Capital Vital */}
          <div className="w-full mt-2 mb-6 relative overflow-hidden rounded-xl bg-violet-500/5 border border-violet-500/10 p-5">
            <div className="relative z-10 flex justify-between items-start mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Capital Vital Recuperado</h3>
                <span className="text-xs font-bold text-white bg-violet-500/20 px-2 py-0.5 rounded border border-violet-500/30">+{vitalStats.hoursSaved}h</span>
            </div>
            
            <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10 flex items-center justify-center">
              <p className="text-emerald-400 text-sm font-mono text-center leading-relaxed font-medium">
                {getVitalMessage(vitalStats.hoursSaved)}
              </p>
            </div>
          </div>

          <NeuroDebugCard />

          <div className="w-full mb-8">
            <Button 
              variant="outline" 
              onClick={() => setIsTriggerModalOpen(true)} 
              className="flex items-center justify-center gap-2 w-full active:bg-red-500/5" 
              style={{ borderColor: '#FF3333', borderStyle: 'dashed', borderWidth: '1px', color: COLORS.Primary }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Registrar Gatilho
            </Button>
          </div>

          <div className="mt-2 mb-4 w-full">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/80">Rituais de Poder</h3>
          </div>

          <DailyHabits profile={profile} />

          <div className="mt-10 w-full">
            <Button 
              variant="danger" 
              className="h-16 text-lg tracking-widest shadow-[0_0_25px_rgba(239,68,68,0.2)] active:scale-95" 
              onClick={handleSosClick}
            >
              S.O.S EMERGÊNCIA
            </Button>
            <p className="text-center text-[10px] mt-4 opacity-40 uppercase tracking-widest" style={{ color: COLORS.TextSecondary }}>Protocolo de Intervenção Rápida</p>
          </div>
        </div>
      </div>
      
      {isTriggerModalOpen && <TriggerModal onClose={() => setIsTriggerModalOpen(false)} />}
      <ShortcutPrompt />
    </div>
  );
};
