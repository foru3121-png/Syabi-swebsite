/* Syabi's.com Firebase Cloud Messaging service worker */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  "apiKey": "AIzaSyAoQPsWcpedaMO00MsWCnahueC46Ec2Kk8",
  "authDomain": "syabi-scom.firebaseapp.com",
  "projectId": "syabi-scom",
  "storageBucket": "syabi-scom.firebasestorage.app",
  "messagingSenderId": "418463227638",
  "appId": "1:418463227638:web:e08d2426f6404005bf16d7",
  "measurementId": "G-6JXBXKPTRW"
});
const messaging = firebase.messaging();

// FCM notification payloads are displayed automatically while the site is in the background.
// This handler is kept for data-only messages and provides a safe fallback.
messaging.onBackgroundMessage(function(payload) {
  const n = payload.notification || {};
  const data = payload.data || {};
  if (!n.title && !n.body) {
    self.registration.showNotification(data.title || "Syabi's.com", {
      body: data.body || "You have a new update.",
      icon: data.icon || undefined,
      data: {url: data.url || "/"}
    });
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async()=>{
    const url = new URL(target, self.location.origin).href;
    const clientsList = await clients.matchAll({type:"window",includeUncontrolled:true});
    for (const client of clientsList) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(url);
        return;
      }
    }
    if (clients.openWindow) return clients.openWindow(url);
  })());
});
