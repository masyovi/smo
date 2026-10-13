/**
 * SMO — Firebase public config (filled in from Firebase Console).
 * Loaded by the service worker (sw.js) via importScripts to initialize
 * Firebase Cloud Messaging for background push notifications.
 */
self.firebaseConfig = {
  apiKey: "AIzaSyCkBTjpdg5P_Adklgbt9bMaa7YgYXJxZEs",
  authDomain: "nextjs77.firebaseapp.com",
  projectId: "nextjs77",
  storageBucket: "nextjs77.firebasestorage.app",
  messagingSenderId: "495364721162",
  appId: "1:495364721162:web:b16429cfa40abff5102df3",
  measurementId: "G-GP3ZMRYQSG",
}

// Web Push certificate (VAPID public key) — from Firebase Console →
// Project Settings → Cloud Messaging → Web Push Certificates.
self.vapidKey = "BBorY0HG13qO5k8uq7sJeCDhkZMLQMWjHBPyj0ziHOuYGBTT_edmSvnurI0oSSYFqt4kwQ05gecLZ3zM-T4o8bs"
