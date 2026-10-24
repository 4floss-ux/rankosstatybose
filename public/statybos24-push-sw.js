/* Statybos24.lt Web Push (without custom notification icons). /hire remains separate. */
self.addEventListener('push', (event) => {
  let message = {};
  try { message = event.data ? event.data.json() : {}; } catch {}
  const title = String(message.title || 'Statybos24.lt').slice(0, 90);
  const body = String(message.body || 'Turite naują pranešimą.').slice(0, 190);
  const target = '/'; // Intentionally never route notification clicks into /hire.
  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag: 'statybos24-' + String(message.id || Date.now()),
    renotify: false,
    // One optional native action; OS/browser chooses whether to show it.
    actions: [{action: 'open', title: 'Atidaryti'}],
    data: {url: target},
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await clients.matchAll({type: 'window', includeUncontrolled: true});
    const existing = windows.find((client) => {
      try {
        const u = new URL(client.url);
        return u.origin === self.location.origin && !/^\/hire(?:\/|$)/.test(u.pathname);
      } catch { return false; }
    });
    if (existing) { await existing.focus(); return; }
    if (clients.openWindow) await clients.openWindow('/');
  })());
});
