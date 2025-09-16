importScripts(
  'https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js',
);

const firebaseConfig = {
  apiKey: 'AIzaSyD80eB9Z5epIQqcjLeDkQ_ormX2PR_OjFU',
  authDomain: 'auctix-a3bb1.firebaseapp.com',
  projectId: 'auctix-a3bb1',
  storageBucket: 'auctix-a3bb1.firebasestorage.app',
  messagingSenderId: '70644926183',
  appId: '1:70644926183:web:b81e6ee3213c876954c442',
  measurementId: 'G-VEEMJRYMRE',
};

const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging(app);

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message',
    payload,
  );

  // const notificationTitle = payload.data?.title || 'New Notification';
  // const notificationOptions = {
  //   body: payload.data?.body || 'You have a new message',
  //   icon: payload.data?.image,
  // };

  // self.registration.showNotification(notificationTitle, notificationOptions);
});

// might be needed later on overriding the default behavior  for bg notifications
// https://stackoverflow.com/questions/71009407/override-web-firebase-cloud-messaging-background-notification-with-custom-behavi
