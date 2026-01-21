import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// Telas
import { LoginScreen } from './screens/LoginScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { LearningScreen } from './screens/LearningScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SosScreen } from './screens/SosScreen';
import { SupportScreen } from './screens/SupportScreen';

// Componentes
import { TabLayout } from './components/TabLayout';
import { Routes as AppRoutes } from './types';
import { NotificationManager } from './components/NotificationManager';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Configuração de PWA e Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.ready.then(registration => {
          console.log('[PWA] Service Worker pronto.');
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        });
      });
    }

    // 2. Auth Guard com Verificação de Assinatura (Firestore)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Busca o documento do usuário para validar o status da assinatura
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();

            // BLOQUEIO DE SEGURANÇA (PAYWALL):
            if (userData?.subscription_status !== 'active') {
              console.warn("[AuthGuard] Assinatura inativa ou pendente.");
              
              // Persiste o erro para a LoginScreen capturar no useEffect
              sessionStorage.setItem('loginError', 'Sua assinatura não está ativa. Verifique seu pagamento.');
              
              // Executa o logout no Firebase
              await signOut(auth);
              
              // Limpa o estado local
              setUser(null);
            } else {
              // Assinatura Ativa: Libera acesso
              setUser(currentUser);
            }
          } else {
            // Documento não existe: Novo usuário, permite seguir para Onboarding
            setUser(currentUser);
          }
        } else {
          // Sem usuário logado
          setUser(null);
        }
      } catch (error) {
        console.error("[AuthGuard] Erro crítico na validação:", error);
        setUser(null);
      } finally {
        // GARANTIA: Independente do resultado (sucesso, erro ou bloqueio),
        // paramos o loading para evitar o spinner infinito.
        setLoading(false);
      }
    });

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      unsubscribe();
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const reloadOnControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', reloadOnControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', reloadOnControllerChange);
      };
    }
  }, []);

  // UI de Carregamento Segura
  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-violet-600 border-t-transparent animate-spin mb-4"></div>
        <span className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase animate-pulse">
          Validando Protocolo
        </span>
      </div>
    );
  }

  return (
    <HashRouter>
      <NotificationManager />
      <Routes>
        <Route 
          path={AppRoutes.LOGIN} 
          element={user ? <Navigate to={AppRoutes.DASHBOARD} replace /> : <LoginScreen />} 
        />
        <Route 
          path={AppRoutes.SUPPORT} 
          element={<SupportScreen />} 
        />
        <Route 
          path={AppRoutes.ONBOARDING} 
          element={user ? <OnboardingScreen /> : <Navigate to={AppRoutes.LOGIN} replace />} 
        />
        <Route element={user ? <TabLayout /> : <Navigate to={AppRoutes.LOGIN} replace />}>
          <Route path={AppRoutes.DASHBOARD} element={<DashboardScreen />} />
          <Route path={AppRoutes.PROGRESS} element={<ProgressScreen />} />
          <Route path={AppRoutes.LEARNING} element={<LearningScreen />} />
          <Route path={AppRoutes.PROFILE} element={<ProfileScreen />} />
        </Route>
        <Route 
          path={AppRoutes.SOS} 
          element={user ? <SosScreen /> : <Navigate to={AppRoutes.LOGIN} replace />} 
        />
        <Route path="*" element={<Navigate to={AppRoutes.LOGIN} replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;