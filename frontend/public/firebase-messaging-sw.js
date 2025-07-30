// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js");

// ⚡ Hardcode env values (since Vercel does not inject env vars into public/)
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background message received:", payload);

  const notificationTitle = payload.notification?.title || "New Message";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: "/firebase-logo.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);

  saveMessageToIndexedDB(notificationTitle, notificationOptions.body);
});

function saveMessageToIndexedDB(title, body) {
  const request = indexedDB.open("FCM_DB", 1);
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("messages")) {
      db.createObjectStore("messages", { autoIncrement: true });
    }
  };
  request.onsuccess = (event) => {
    const db = event.target.result;
    const tx = db.transaction("messages", "readwrite");
    tx.objectStore("messages").add({ title, body, timestamp: Date.now() });
  };
}
