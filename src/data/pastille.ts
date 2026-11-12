// Pastille sur l'icône de l'appli (écran d'accueil du téléphone) : un « 1 » tant que le pack du
// jour n'est pas ouvert. Sur iPhone, elle ne s'affiche que si les notifications sont autorisées.
// Le matin, le rappel « pack du jour » la remet aussi (public/sw.js).

import { packDuJourOuvert } from '../domain/packs';
import { game } from './store';

type NavigateurPastille = Navigator & {
  setAppBadge?: (n?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

export function majPastille() {
  const nav = navigator as NavigateurPastille;
  if (!nav.setAppBadge) return;
  const dispo = !packDuJourOuvert(game.getState().progress, new Date());
  (dispo ? nav.setAppBadge(1) : (nav.clearAppBadge?.() ?? nav.setAppBadge(0))).catch(
    () => undefined,
  );
}

let demarre = false;

/** À l'ouverture de l'appli : met la pastille à jour, puis à chaque pack ouvert et à chaque retour. */
export function demarrerPastille() {
  if (demarre) return;
  demarre = true;
  majPastille();
  game.subscribe(majPastille);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') majPastille();
  });
}
