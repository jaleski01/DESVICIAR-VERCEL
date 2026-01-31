
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { DataSyncManager } from './components/DataSyncManager';

const AppContent: React.FC<{ user: any }> = ({ user }) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-page-transition w-full flex-1 flex flex-col overflow-hidden">
      {/* O DataSyncManager só roda para usuários logados */}
      {user && <DataSyncManager />}
      
      <Routes location={location}>
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
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const status = userData?.subscription_status;
            const blockedStatuses = ['canceled', 'unpaid', 'past_due'];

            if (status && blockedStatuses.includes(status)) {
              await signOut(auth);
              setUser(null);
            } else {
              setUser(currentUser);
            }
          } else {
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(currentUser); 
      } finally {
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
      <AppContent user={user} />
    </HashRouter>
  );
};

export default App;
