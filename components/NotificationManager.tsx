import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestForToken, auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { COLORS } from '../types';

/**
 * NotificationManager
 * 
 * Gerencia a solicitação de permissão para notificações push.
 * Agora com trava de segurança para exibir apenas em modo PWA (Standalone).
 */
export const NotificationManager: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkScenario = async () => {
      // 1. TRAVA DE SEGURANÇA: Verifica se é PWA (Standalone)
      // Se estiver rodando no navegador comum, ABORTA imediatamente.
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      
      if (!isStandalone) {
        console.log("[NotificationManager] Notificações suprimidas: Rodando no Navegador (Apenas PWA permitido).");
        return; 
      }

      // 2. Verificação de Suporte
      if (!('Notification' in window)) return;

      // 3. Lógica de Permissão (Apenas para PWA)
      if (Notification.permission === 'default') {
        const hasDismissed = localStorage.getItem('notification_prompt_dismissed');
        if (!hasDismissed) {
          // Delay para não ser agressivo ao abrir o app
          const timer = setTimeout(() => setIsVisible(true), 3000);
          return () => clearTimeout(timer);
        }
      } 
      // 4. Se já estiver 'granted', sincroniza o token silenciosamente
      else if (Notification.permission === 'granted') {
        try {
          const token = await requestForToken();
          if (token && auth.currentUser) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { 
              fcm_token: token,
              last_token_sync: new Date().toISOString()
            });
          }
        } catch (e) {
          console.log('[NotificationManager] Sincronização silenciosa falhou.', e);
        }
      }
    };

    checkScenario();
  }, []);

  const handleRequestPermission = async () => {
    setIsVisible(false);

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await requestForToken();
        if (token && auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, { 
            fcm_token: token,
            last_token_sync: new Date().toISOString()
          });
        }
      } else if (permission === 'denied') {
        // Se negou explicitamente, marcamos para nunca mais incomodar com este popup
        localStorage.setItem('notification_prompt_dismissed', 'true');
      }
    } catch (error) {
      console.error('[NotificationManager] Erro no fluxo de permissão:', error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_prompt_dismissed', 'true');
    setIsVisible(false);
  };

  if (isVisible === false && Notification.permission !== 'granted') {
      // Small logic to ensure we don't render AnimatePresence unnecessarily if not needed
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-24 left-4 right-4 z-[9999]"
        >
          <div 
            className="backdrop-blur-md border rounded-2xl p-5 shadow-2xl flex flex-col gap-4"
            style={{ 
              backgroundColor: 'rgba(26, 26, 26, 0.98)', 
              borderColor: COLORS.Border,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-violet-500/20 rounded-xl shrink-0 flex items-center justify-center">
                <span className="text-2xl">🔔</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-base mb-1">Ative os Alertas</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Receba lembretes estratégicos para manter sua ofensiva. Privacidade total e controle de foco.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-1">
              <button 
                onClick={handleDismiss}
                className="flex-1 py-3 text-xs font-bold text-gray-500 hover:text-white transition-colors active:scale-95"
              >
                Agora não
              </button>
              <button 
                onClick={handleRequestPermission}
                className="flex-[2] py-3 text-xs font-bold rounded-xl text-white shadow-lg active:scale-95 transition-transform"
                style={{ backgroundColor: COLORS.Primary }}
              >
                Ativar Agora
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};