// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDpSTPJQKSADZAB_3mEMBouLhREEtRgLWw",
  authDomain: "sooner-84b42.firebaseapp.com",
  projectId: "sooner-84b42",
  storageBucket: "sooner-84b42.firebasestorage.app",
  messagingSenderId: "786818429530",
  appId: "1:786818429530:web:dcb717ddf669c846781e63",
  measurementId: "G-QSTXJ590PM"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg', // Default icon for now
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
