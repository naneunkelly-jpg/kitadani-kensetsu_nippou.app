// 北谷建設 日報管理 Service Worker
// Phase 1時点ではオフラインキャッシュ・Push通知の受信基盤のみ。
// Push通知の実際の送信ロジックはPhase 7で追加する。

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push通知受信（Phase 7で本格実装。現時点では受信の枠組みのみ用意）
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "北谷建設 日報管理", body: event.data.text() };
  }

  const title = payload.title || "北谷建設 日報管理";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url || "/home" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知タップ時、対象のURL（当日/前日の日報入力画面など）を開く
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/home";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
