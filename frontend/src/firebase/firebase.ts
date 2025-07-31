import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  Messaging,
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

let messaging: Messaging | null = null;

export const registerSWAndRequestNotificationPermission = async () => {
  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase messaging not supported in this browser.');
    return null;
  }

  try {
    messaging = getMessaging(app);
    await registerServiceWorker();

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_APP_FCM_VAPID_KEY,
    });

    if (!token) {
      console.warn('No FCM token received. Check VAPID key.');
      return null;
    }

    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error requesting notification permission', error);
    return null;
  }
};

export const listenForForegroundMessages = async () => {
  const supported = await isSupported();
  if (!supported) {
    console.warn('Messaging not supported in this browser');
    return;
  }

  if (!messaging) {
    messaging = getMessaging(app);
  }

  onMessage(messaging, (payload) => {
    console.log('Foreground notification received:', payload);
    const event = new CustomEvent('fcm-notification', { detail: payload });
    window.dispatchEvent(event);
  });
};

let serviceWorkerRegistered = false;

const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      if (serviceWorkerRegistered) {
        return;
      }

      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
      );
      console.log('Service Worker registered with scope:', registration.scope);
      serviceWorkerRegistered = true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

export const unregisterServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      })
      .catch((error) => {
        console.error('Error unregistering service worker:', error);
      });
  }
};
