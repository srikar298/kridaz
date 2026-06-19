/* eslint-env serviceworker */
/* global firebase */
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"
);

// Initialize Firebase in the Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyCw1nodfsbj1w6gyDNsiwDl87A818cgN0Y",
  authDomain: "grounds-booking-dc802.firebaseapp.com",
  projectId: "grounds-booking-dc802",
  storageBucket: "grounds-booking-dc802.firebasestorage.app",
  messagingSenderId: "9445008437",
  appId: "1:9445008437:web:b74d5a2d9f6ad5d9a57d7c",
  measurementId: "G-B9WRH0Q80T",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const notificationTitle =
    payload.notification?.title || "Kridaz Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/favicon.ico",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
