import React, { useEffect, useState, useMemo } from 'react';
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

// Marcos de conquista para o Capital Vital
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

  // Função Helper para buscar a mensagem baseada nas horas
  const getVitalMessage = (hours: number) => {
    const milestone = [...VITAL_CAPITAL_MILESTONES].reverse().find(m => hours >= m.hours);
    return milestone ? milestone.text : "O começo da liberdade... Continue firme.";
  };

  useEffect(() => {
    const fetchUserData = async () => {
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

    const loadProfile = async (uid: string) => {
      try {
        const cachedProfile = localStorage.getItem('user_profile');
        if (cachedProfile) setProfile(JSON.parse(cachedProfile));

        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          localStorage.setItem('user_profile', JSON.stringify(data));
        } else {
          if (!cachedProfile) navigate(Routes.ONBOARDING);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSosClick = () => {
    navigate(Routes.SOS);
  };

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
        <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4" style={{ borderColor: COLORS.Primary, borderTopColor: 'transparent' }} />
        <span className="text-xs font-bold tracking-widest animate-pulse" style={{ color: COLORS.TextSecondary }}>CARREGANDO...</span>
      </div>
    );
  }

  return (
    <Wrapper noPadding> 
      <div className="flex-1 w-full h-full overflow-y-auto scrollbar-hide bg-black">
        <div className="w-full max-w-full px-5 pt-6 pb-32 flex flex-col items-center">
          <header className="flex flex-col w-full mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                 <span className="text-xs font-bold tracking-wider uppercase" style={{ color: COLORS.TextSecondary }}>Streak Limpo</span>
              </div>
            </div>
            <StreakTimer startDate={profile?.current_streak_start} />
          </header>

          <div className="w-full mt-2 mb-6 relative overflow-hidden group rounded-xl bg-violet-500/5 border border-violet-500/10 p-4">
            <div className="relative z-10 flex justify-between items-start">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Capital Vital Recuperado</h3>
                <span className="text-xs font-bold text-white bg-violet-500/20 px-2 py-0.5 rounded border border-violet-500/30">+{vitalStats.hoursSaved}h Salvas</span>
            </div>
            
            {/* Bloco da Mensagem Vital Atualizado */}
            <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10 mt-3 flex items-center justify-center">
              <p className="text-emerald-400 text-sm font-mono text-center leading-relaxed font-medium">
                {getVitalMessage(vitalStats.hoursSaved)}
              </p>
            </div>
          </div>

          <NeuroDebugCard />

          <div className="w-full mb-6">
            <Button variant="outline" onClick={() => setIsTriggerModalOpen(true)} className="flex items-center justify-center gap-2 w-full hover:opacity-80 transition-opacity" style={{ borderColor: '#FF3333', borderStyle: 'dashed', borderWidth: '1px', color: COLORS.Primary }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Registrar Gatilho
            </Button>
          </div>

          <div className="mt-2 mb-3 w-full"><h3 className="text-xs font-bold uppercase tracking-widest text-white">Rituais de Poder</h3></div>

          <DailyHabits profile={profile} />

          <div className="mt-8 w-full">
            <Button variant="danger" className="h-16 text-lg tracking-widest shadow-[0_0_20px_rgba(211,47,47,0.4)] animate-pulse hover:animate-none w-full" onClick={handleSosClick}>S.O.S EMERGÊNCIA</Button>
            <p className="text-center text-xs mt-3 opacity-60" style={{ color: COLORS.TextSecondary }}>Pressione apenas em caso de urgência extrema.</p>
          </div>
        </div>
      </div>
      {isTriggerModalOpen && <TriggerModal onClose={() => setIsTriggerModalOpen(false)} />}
      <ShortcutPrompt />
    </Wrapper>
  );
};