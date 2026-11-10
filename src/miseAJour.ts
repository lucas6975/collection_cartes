// Mise à jour automatique : un téléphone qui garde l'ancienne version du site en cache
// (onglet resté ouvert, raccourci sur l'écran d'accueil) recharge la nouvelle dès sa sortie.

const CLE = 'team-ulysse-maj';
const SCRIPT = /assets\/index-[\w-]+\.js/;

function versionActuelle(): string | null {
  for (const s of Array.from(document.scripts)) {
    const m = s.src.match(SCRIPT);
    if (m) return m[0];
  }
  return null;
}

async function verifier() {
  const actuelle = versionActuelle();
  if (!actuelle) return; // serveur de développement
  try {
    const rep = await fetch(`${import.meta.env.BASE_URL}index.html?v=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!rep.ok) return;
    const enLigne = (await rep.text()).match(SCRIPT)?.[0];
    if (!enLigne || enLigne === actuelle) return;
    // Une seule tentative par version, pour ne jamais recharger en boucle.
    if (sessionStorage.getItem(CLE) === enLigne) return;
    sessionStorage.setItem(CLE, enLigne);
    // L'adresse change (?maj=…) pour que le navigateur ne ressorte pas la page de son cache.
    location.replace(`${location.pathname}?maj=${Date.now()}${location.hash}`);
  } catch {
    // Hors ligne : on garde la version actuelle.
  }
}

export function surveillerMisesAJour() {
  void verifier();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void verifier();
  });
}
