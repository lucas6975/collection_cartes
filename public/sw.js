// Service worker de Team Ulysse : il sert UNIQUEMENT à recevoir les rappels (notifications).
//
// Il ne met volontairement aucune page en cache : le site se met à jour normalement
// (voir src/miseAJour.ts), et ce fichier n'intercepte aucune requête.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const base = self.registration.scope;
  event.waitUntil(
    self.registration.showNotification(data.title || 'Team Ulysse', {
      body: data.body || '',
      icon: `${base}icone-192.png`,
      badge: `${base}favicon.png`,
      tag: data.tag || 'team-ulysse',
      data: { url: new URL(data.url || './', base).href },
    }),
  );
});

// Un appui sur la notification ouvre l'appli à la bonne page (pack ou case du jour).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || self.registration.scope;
  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const f of fenetres) {
        if (f.url.startsWith(self.registration.scope)) {
          await f.focus();
          return f.navigate(url);
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
