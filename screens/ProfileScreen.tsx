import React, { useState, useEffect } from 'react';
import { Wrapper } from '../components/Wrapper';
import { Button } from '../components/Button';
import { auth, db, requestForToken } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { COLORS, Routes } from '../types';

const MOTIVATIONAL_QUOTES = [
  "O sucesso não é linear. O que define você é a velocidade com que você se levanta agora.",
  "Dia 1. De novo. Mas dessa vez, você não começa do zero, começa da experiência.",
  "A dor da disciplina é menor que a dor do arrependimento. Bem-vindo de volta à luta.",
  "Não importa quantas vezes você cai, mas quantas vezes você se levanta.",
  "O passado é uma lição, não uma sentença de prisão. Foque no agora."
];

const RANKS = [
  { id: 'sgt', label: 'Sargento', days: 7, icon: 'chevron' },
  { id: 'lt', label: 'Tenente', days: 15, icon: 'bars' },
  { id: 'maj', label: 'Major', days: 30, icon: 'star' },
  { id: 'vet', label: 'Veterano', days: 90, icon: 'shield' },
];

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMotivationModal, setShowMotivationModal] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'default'
  );

  const [isStandalone, setIsStandalone] = useState(false);
  const [installTab, setInstallTab] = useState<'android' | 'ios'>('android');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const cached = localStorage.getItem('user_profile');
      if (cached) {
        const data = JSON.parse(cached);
        calculateStreak(data.current_streak_start);
      }
      
      if (auth.currentUser) {
        try {
          const docRef = doc(db, "users", auth.currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
             const data = snap.data();
             calculateStreak(data.current_streak_start);
             localStorage.setItem('user_profile', JSON.stringify(data));
          }
        } catch (e) {
          console.error("Erro ao sincronizar perfil", e);
        }
      }
    };

    fetchProfile();

    const checkStandalone = () => {
      const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true;
      setIsStandalone(isPwa);
    };
    checkStandalone();

    const checkPermissionStatus = () => {
      if ('Notification' in window) {
        if (Notification.permission !== permissionStatus) {
          setPermissionStatus(Notification.permission);
        }
      }
    };

    window.addEventListener('focus', checkPermissionStatus);
    const interval = setInterval(checkPermissionStatus, 2000);

    return () => {
      window.removeEventListener('focus', checkPermissionStatus);
      clearInterval(interval);
    };
  }, [permissionStatus]);

  const calculateStreak = (startDateISO: string | undefined) => {
    if (!startDateISO) {
      setStreakDays(0);
      return;
    }
    const start = new Date(startDateISO).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    setStreakDays(diff);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate(Routes.LOGIN);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleRelapseClick = () => {
    setShowConfirmModal(true);
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert("Seu navegador não suporta notificações.");
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        const token = await requestForToken();
        if (token && auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, { fcm_token: token });
        }
      } else if (permission === 'denied') {
        alert("As notificações foram bloqueadas. Reative nas configurações do navegador.");
      }
    } catch (err) {
      console.error("Erro ao solicitar permissão:", err);
    }
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    if (!('serviceWorker' in navigator)) {
      alert("Navegador incompatível.");
      setIsCheckingUpdate(false);
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      let updateFound = false;
      const updateListener = () => {
        updateFound = true;
        alert("Atualizando..."); 
      };
      registration.addEventListener('updatefound', updateListener);
      await registration.update();
      setTimeout(() => {
        registration.removeEventListener('updatefound', updateListener);
        if (!updateFound) alert("Você está na versão mais recente.");
        setIsCheckingUpdate(false);
      }, 1500);
    } catch (error) {
      setIsCheckingUpdate(false);
    }
  };

  const executeRelapse = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const nowISO = new Date().toISOString();
      await updateDoc(userRef, {
        current_streak_start: nowISO,
        relapse_count: increment(1),
        last_relapse_date: nowISO
      });
      const todayKey = new Date().toLocaleDateString('en-CA');
      localStorage.removeItem(`@habits_${todayKey}`);
      const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      setCurrentQuote(randomQuote);
      const cachedProfile = localStorage.getItem('user_profile');
      if (cachedProfile) {
        const profileData = JSON.parse(cachedProfile);
        profileData.current_streak_start = nowISO;
        localStorage.setItem('user_profile', JSON.stringify(profileData));
      }
      setStreakDays(0);
      setShowConfirmModal(false);
      setShowMotivationModal(true);
    } catch (error) {
      alert("Erro ao registrar.");
    } finally {
      setIsLoading(false);
    }
  };

  const finishProcess = () => {
    setShowMotivationModal(false);
    navigate(Routes.DASHBOARD);
  };

  const getRankIcon = (icon: string) => {
    switch (icon) {
      case 'chevron': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />;
      case 'bars': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 10h16M4 14h16" />;
      case 'star': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />;
      case 'shield': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
      default: return null;
    }
  };

  return (
    <Wrapper noPadding>
      <div className="flex flex-col items-center w-full h-full pt-8 px-4 pb-32 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col items-center mb-8">
          <div className="p-1 rounded-full border-2 border-[#8B5CF6] mb-3 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
             <div className="w-16 h-16 rounded-full bg-[#2E243D] flex items-center justify-center overflow-hidden">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
             </div>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">Meu Perfil</h1>
          <p className="text-xs text-gray-400">
             {streakDays > 0 ? `${streakDays} Dias Limpos` : 'Dia 0 - O Início'}
          </p>
        </div>
        
        <div className="w-full mb-8 animate-fadeIn">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 ml-1" style={{ color: COLORS.TextSecondary }}>
            Patentes (Progresso)
          </h3>
          <div className="grid grid-cols-2 gap-3 w-full">
            {RANKS.map((rank) => {
              const isUnlocked = streakDays >= rank.days;
              return (
                <div key={rank.id} className={`relative p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${isUnlocked ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/50 shadow-[0_0_10px_rgba(139,92,246,0.1)]' : 'bg-[#1A1A1A] border-[#2E243D] opacity-40 grayscale'}`}>
                  <div className={`p-2 rounded-full ${isUnlocked ? 'bg-[#8B5CF6]/20' : 'bg-[#2a2a2a]'}`}>
                    <svg className={`w-6 h-6 ${isUnlocked ? 'text-[#8B5CF6]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">{getRankIcon(rank.icon)}</svg>
                  </div>
                  <div className="text-center">
                    <span className={`text-xs font-bold block ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{rank.label}</span>
                    <span className="text-[10px] font-mono text-gray-500 mt-0.5 block">{rank.days} DIAS</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full bg-[#1A1A1A] border border-gray-800 rounded-2xl p-5 mb-6">
          {isStandalone ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl shrink-0 border border-green-500/20">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">App Instalado e Seguro</h3>
                  <p className="text-gray-400 text-xs">Versão Standalone Ativa</p>
                </div>
              </div>
              <div className="pl-[60px]">
                <button
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  {isCheckingUpdate ? "Verificando..." : "Verificar atualizações"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-base flex items-center gap-2">Instalar Aplicativo</h3>
                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                  <button onClick={() => setInstallTab('android')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${installTab === 'android' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Android</button>
                  <button onClick={() => setInstallTab('ios')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${installTab === 'ios' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>iPhone</button>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                {installTab === 'android' ? (
                   <p className="text-gray-300 text-xs">Toque em ⋮ e Adicionar à tela inicial.</p>
                ) : (
                   <p className="text-gray-300 text-xs">Toque em Compartilhar e Adicionar à Tela de Início.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className={`w-full bg-[#1A1A1A] border border-gray-800 rounded-2xl p-5 mb-6 ${permissionStatus === 'granted' ? 'opacity-40 grayscale' : ''}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-500/10 rounded-xl shrink-0">
              <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-base">Alertas do Sistema</h3>
              <p className="text-gray-400 text-xs mb-4">Ative para suporte de emergência.</p>
              <Button onClick={handleEnableNotifications} variant="primary" disabled={permissionStatus === 'granted'}>
                {permissionStatus === 'granted' ? 'Ativas ✓' : 'Ativar'}
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full mb-8 p-5 rounded-2xl border border-red-900/30 bg-gradient-to-br from-[#1A0505] to-[#000000]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">Zona de Perigo</h3>
          <Button onClick={handleRelapseClick} style={{ backgroundColor: '#D32F2F', color: '#FFFFFF' }}>Registrar Recaída (Zerar)</Button>
        </div>

        <div className="w-full mt-auto pt-6 border-t border-[#2E243D]">
             <Button variant="outline" onClick={handleLogout} className="text-gray-500 text-xs h-10">Encerrar Sessão</Button>
             <p className="text-[10px] text-center text-gray-700 mt-2">Versão 1.0.4 • DESVICIAR PROTOCOL</p>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0F0A15] border border-red-900/30 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Confirmar Recaída?</h2>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-[#1F2937] text-white">Cancelar</button>
              <button onClick={executeRelapse} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white">Sim, recaí</button>
            </div>
          </div>
        </div>
      )}

      {showMotivationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95">
          <div className="w-full max-w-sm text-center">
            <h2 className="text-2xl font-bold text-white mb-8">Levante a Cabeça.</h2>
            <p className="text-lg font-medium text-gray-300 italic mb-8">"{currentQuote}"</p>
            <Button onClick={finishProcess} className="w-full bg-violet-600">Voltar ao Foco</Button>
          </div>
        </div>
      )}
    </Wrapper>
  );
};