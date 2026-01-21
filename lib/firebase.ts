import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken } from 'firebase/messaging';

// 1. Definição Robusta da Configuração (Env Vars OU Hardcoded)
// Nota: Usamos o encadeamento opcional para evitar erro se import.meta.env for undefined
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyCOX18n01dJ7XNnwKpk3eZliUJ_ZZ8Uyrw",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "desafio-60-15.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "desafio-60-15",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "desafio-60-15.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "293879220222",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:293879220222:web:942a187a80755381ede2af",
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "G-SZJ7DMD9NC"
};

// 2. Debug de Inicialização
console.log("Firebase Status:", firebaseConfig.apiKey ? "Configurado" : "Erro de Configuração");

// 3. Inicialização
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore com Cache Persistente (Suporte Offline)
initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const db = getFirestore(app);
export const storage = getStorage(app);

// Tratamento de erro seguro para Messaging
let messagingInstance: any = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messagingInstance = getMessaging(app);
  }
} catch (e) {
  console.log('Firebase Messaging não suportado neste ambiente.');
}
export const messaging = messagingInstance;

/**
 * Solicita permissão e recupera o token FCM para notificações push.
 */
export const requestForToken = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      const currentToken = await getToken(messaging, { 
        vapidKey: 'BIfzJbY9Esj4NVlIfbQs9qKU58y0CBAoxfpAGR0AzMXVKG6QygXVzKsxghzp7qYcR0SZuvR3UUZMr-1ifwese8s',
        serviceWorkerRegistration: registration 
      });

      if (currentToken) {
        console.log('Token FCM obtido:', currentToken);
        return currentToken;
      }
    }
  } catch (err) {
    console.error('Erro ao recuperar o token FCM.', err);
  }
  return null;
};

// Helper para Analytics
export const logEvent = async (eventName: string, params?: any) => {
  if (typeof window !== 'undefined') {
    try {
      const { getAnalytics, logEvent: firebaseLogEvent } = await import('firebase/analytics');
      const analytics = getAnalytics(app);
      firebaseLogEvent(analytics, eventName, params);
    } catch (e) {
      // Ignora erros de analytics (adblockers etc)
    }
  }
};