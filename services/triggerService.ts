import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp, 
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TriggerLog {
  id?: string;
  date: string;         // Mapped from date_string for frontend compatibility
  date_string: string;  // YYYY-MM-DD
  day_number: number;   // Day 1, Day 2...
  timestamp: any;
  time_slot: string;    // 'Madrugada', 'Manhã', 'Tarde', 'Noite'
  emotion: string;
  context: string;
  intensity: number;    // 1-5
}

/**
 * Calculates the time slot based on current hour.
 */
const getTimeSlot = (date: Date): string => {
  const hour = date.getHours();
  if (hour >= 0 && hour < 6) return 'Madrugada';
  if (hour >= 6 && hour < 12) return 'Manhã';
  if (hour >= 12 && hour < 18) return 'Tarde';
  return 'Noite'; // 18-23
};

/**
 * Logs a new trigger to Firestore with calculated Day Number.
 */
export const logTrigger = async (
  uid: string, 
  emotion: string, 
  context: string, 
  intensity: number
) => {
  try {
    const now = new Date();
    const dateKey = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const timeSlot = getTimeSlot(now);
    let dayNumber = 1;

    // Passo A: Obter Contexto do Usuário para calcular o dia
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const streakStart = userData.current_streak_start;

      if (streakStart) {
        // Handle both Firestore Timestamp and ISO String (from Onboarding)
        let startDate: Date;
        if (typeof streakStart === 'string') {
          startDate = new Date(streakStart);
        } else if (streakStart?.toDate) {
          startDate = streakStart.toDate();
        } else {
          startDate = new Date(); // Fallback
        }

        // Passo B: Calcular o 'Day Number'
        if (!isNaN(startDate.getTime())) {
          // Reset time portion to ensure day difference is accurate relative to start
          // or use raw difference as requested: Date.now() - start
          const diff = now.getTime() - startDate.getTime();
          // Math.floor ensures we are in the "current" day block. +1 makes it 1-based index.
          const calculatedDay = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
          dayNumber = calculatedDay > 0 ? calculatedDay : 1;
        }
      }
    } else {
      console.warn("User profile not found for trigger log. Defaulting to Day 1.");
    }

    // Passo C: Gravação no Firestore (Schema Robusto)
    const payload = {
      uid,
      emotion,
      context,
      intensity,
      timestamp: serverTimestamp(),
      date_string: dateKey, // Para agrupamento/filtro fácil
      day_number: dayNumber, // Vital para o gráfico (D1, D2...)
      time_slot: timeSlot,
      created_at_local: now.toISOString()
    };

    await addDoc(collection(db, 'users', uid, 'trigger_logs'), payload);

  } catch (error) {
    console.error("Critical error saving trigger log:", error);
    throw error; // Propagate to UI for feedback
  }
};

/**
 * Fetches trigger logs within a date range.
 */
export const getTriggers = async (uid: string, startDateStr: string) => {
  try {
    const logsRef = collection(db, 'users', uid, 'trigger_logs');
    
    // Query uses date_string (YYYY-MM-DD)
    const q = query(
      logsRef,
      where('date_string', '>=', startDateStr),
      orderBy('date_string', 'desc')
    );

    const snapshot = await getDocs(q);
    const logs: TriggerLog[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      logs.push({ 
        id: doc.id, 
        ...data,
        // Map date_string to date for backward compatibility with UI components if needed
        date: data.date_string 
      } as TriggerLog);
    });

    return logs;
  } catch (error) {
    console.error("Error fetching triggers:", error);
    return [];
  }
};

/**
 * Dispara uma notificação local de lembrete de inatividade.
 */
export const scheduleInactivityReminder = async () => {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (Notification.permission === 'granted') {
      await registration.showNotification('⚠️ Foco no Objetivo', {
        body: 'Mantenha sua ofensiva. Não deixe o tédio vencer.',
        icon: 'https://i.imgur.com/nyLkCgz.png',
        badge: 'https://i.imgur.com/nyLkCgz.png',
        tag: 'inactivity-reminder'
      });
    }
  } catch (error) {
    console.error("Erro ao disparar notificação local:", error);
  }
};