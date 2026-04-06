import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDpSTPJQKSADZAB_3mEMBouLhREEtRgLWw",
  authDomain: "sooner-84b42.firebaseapp.com",
  projectId: "sooner-84b42",
  storageBucket: "sooner-84b42.firebasestorage.app",
  messagingSenderId: "786818429530",
  appId: "1:786818429530:web:dcb717ddf669c846781e63",
  measurementId: "G-QSTXJ590PM"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Your VAPID Key
const VAPID_KEY = "BEJUVdhwxYFgKwI2qHpEPNgvihVxsgXPtuZYOkS7i4y6Jv6_Wy6fQxbCvj6K0JCXsfBEFLHrcUlMYj8KOZnC2qM";

export const requestPushPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      // console.log('FCM Token:', token);
      return token; 
    }
  } catch (error) {
    console.error('Push permission denied', error);
  }
  return null;
};

export const listenForMessages = (callback) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
