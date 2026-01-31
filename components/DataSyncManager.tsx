
import React, { useEffect, useRef } from 'react';
import { auth } from '../lib/firebase';
import { fetchAndCacheProgressData } from '../services/progressService';

/**
 * DataSyncManager
 * Componente silencioso responsável por manter os caches de progresso atualizados.
 * Implementa estratégia de Background Sync.
 */
export const DataSyncManager: React.FC = () => {
  const syncIntervalRef = useRef<any>(null);
  const isSyncing = useRef(false);

  const syncAllRanges = async () => {
    if (isSyncing.current || !navigator.onLine || !auth.currentUser) return;

    isSyncing.current = true;
    console.log('[SyncManager] Iniciando sincronização em background...');

    const ranges = [7, 15, 30, 90];
    
    try {
      // Sincroniza sequencialmente para não sobrecarregar
      for (const range of ranges) {
        await fetchAndCacheProgressData(range);
        // Pequena pausa entre cada range para dar fôlego ao JS
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log('[SyncManager] Todos os ranges sincronizados com sucesso.');
    } catch (error) {
      console.error('[SyncManager] Erro na sincronização:', error);
    } finally {
      isSyncing.current = false;
    }
  };

  useEffect(() => {
    // Escuta mudanças de autenticação
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Dispara a primeira sincronização imediata
        syncAllRanges();

        // Configura o intervalo de 5 minutos (300.000 ms)
        if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = setInterval(syncAllRanges, 5 * 60 * 1000);
      } else {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = null;
        }
      }
    });

    // Escuta volta da conexão para sincronizar
    const handleOnline = () => syncAllRanges();
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  return null; // Componente sem interface
};
