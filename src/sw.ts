/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { createHandlerBoundToURL } from 'workbox-precaching';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// ---------------------------------------------------------------------------
// 1. Configuração PWA (Workbox)
// ---------------------------------------------------------------------------
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [
    /^\/_/,
    /\/[^/?]+\.[^/]+$/,
  ],
});
registerRoute(navigationRoute);

// ---------------------------------------------------------------------------
// 2. Configuração Firebase Messaging (Background) - SECURE FALLBACK
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: (process as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyCOX18n01dJ7XNnwKpk3eZliUJ_ZZ8Uyrw",
  authDomain: (process as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "desafio-60-15.firebaseapp.com",
  projectId: (process as any).env?.VITE_FIREBASE_PROJECT_ID || "desafio-60-15",
  storageBucket: (process as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "desafio-60-15.firebasestorage.app",
  messagingSenderId: (process as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "293879220222",
  appId: (process as any).env?.VITE_FIREBASE_APP_ID || "1:293879220222:web:942a187a80755381ede2af",
  measurementId: (process as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "G-SZJ7DMD9NC"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const notificationTitle = payload.notification?.title || 'Protocolo Desviciar';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: 'https://i.imgur.com/nyLkCgz.png',
    badge: 'https://i.imgur.com/nyLkCgz.png',
    data: payload.data 
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});