// Mise à jour automatique : un téléphone qui garde l'ancienne version du site en cache
// (onglet resté ouvert, raccourci sur l'écran d'accueil) charge la nouvelle tout seul.
//
// La vérification a lieu à chaque lancement de l'application : ouverture, retour sur l'appli
// (écran d'accueil, autre onglet), retour du réseau, et toutes les 2 minutes tant qu'elle est
// affichée.

const CLE = 'team-ulysse-maj';
const SCRIPT = /assets\/index-[\w-]+\.js/;
/** Délai avant de retenter une même version si le cache a renvoyé l'ancienne page. */
const NOUVEL_ESSAI_MS = 60_000;
const INTERVALLE_MS = 2 * 60_000;

function versionActuelle(): string | null {
  for (const s of Array.from(document.scripts)) {
    const m = s.src.match(SCRIPT);
    if (m) return m[0];
  }
  return null;
}

function dejaTente(version: string): boolean {
  try {
    const t = JSON.parse(sessionStorage.getItem(CLE) ?? 'null') as { v: string; t: number } | null;
    return !!t && t.v === version && Date.now() - t.t < NOUVEL_ESSAI_MS;
  } catch {
    return false;
  }
}

function noterTentative(version: string) {
  try {
    sessionStorage.setItem(CLE, JSON.stringify({ v: version, t: Date.now() }));
  } catch {
    // Stockage indisponible : le délai entre deux vérifications suffit à éviter une boucle.
  }
}

function afficherBandeau() {
  const b = document.createElement('div');
  b.textContent = 'Nouvelle version du site, mise à jour…';
  b.style.cssText =
    'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;' +
    'background:#153E75;color:#fff;padding:10px 18px;border-radius:12px;' +
    'font:600 14px system-ui,-apple-system,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)';
  document.body.appendChild(b);
}

let enCours = false;

async function verifier() {
  const actuelle = versionActuelle();
  if (!actuelle || enCours || !navigator.onLine) return; // serveur de développement ou hors ligne
  enCours = true;
  try {
    const rep = await fetch(`${import.meta.env.BASE_URL}index.html?v=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!rep.ok) return;
    const enLigne = (await rep.text()).match(SCRIPT)?.[0];
    if (!enLigne || enLigne === actuelle || dejaTente(enLigne)) return;
    noterTentative(enLigne);
    afficherBandeau();
    // L'adresse change (?maj=…) pour que le navigateur ne ressorte pas la page de son cache.
    setTimeout(
      () => location.replace(`${location.pathname}?maj=${Date.now()}${location.hash}`),
      600,
    );
  } catch {
    // Réseau indisponible : on garde la version actuelle.
  } finally {
    enCours = false;
  }
}

export function surveillerMisesAJour() {
  void verifier();
  const siVisible = () => {
    if (document.visibilityState === 'visible') void verifier();
  };
  document.addEventListener('visibilitychange', siVisible);
  // iPhone : l'appli rouverte depuis l'écran d'accueil peut reprendre sans recharger la page.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) void verifier();
  });
  window.addEventListener('focus', siVisible);
  window.addEventListener('online', siVisible);
  setInterval(siVisible, INTERVALLE_MS);
}
