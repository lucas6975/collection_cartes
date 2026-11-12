// Cartes holographiques : le reflet suit l'inclinaison du téléphone (ou la souris sur ordinateur).
//
// La position est publiée dans deux variables CSS globales, --hx et --hy (de -1 à 1), lues par
// les calques .holo des cartes. Tant qu'aucun mouvement n'est reçu, l'attribut data-holo n'est
// pas posé et les cartes gardent leur reflet automatique habituel. Sur iPhone, les mouvements
// demandent une autorisation d'Apple : on ne la demande pas, les cartes y gardent leur reflet
// automatique (sur Android et ordinateur, l'effet suit les mouvements ou la souris).

import { useSyncExternalStore } from 'react';

const racine = () => document.documentElement;
const borne = (v: number) => Math.max(-1, Math.min(1, v));

let x = 0;
let y = 0;
let image = 0;
let actif = false;
let demarre = false;
const listeners = new Set<() => void>();

function publier(nx: number, ny: number) {
  x = borne(nx);
  y = borne(ny);
  if (!actif) {
    actif = true;
    racine().dataset.holo = 'actif';
    listeners.forEach((l) => l());
  }
  if (image) return;
  image = requestAnimationFrame(() => {
    image = 0;
    racine().style.setProperty('--hx', x.toFixed(3));
    racine().style.setProperty('--hy', y.toFixed(3));
  });
}

function surOrientation(e: DeviceOrientationEvent) {
  if (e.gamma == null || e.beta == null) return;
  // Téléphone tenu à environ 45° : c'est la position « au repos ».
  publier(e.gamma / 25, (e.beta - 45) / 25);
}

function surSouris(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return;
  publier((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
}

export const inclinaisonStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** Vrai quand le reflet suit déjà les mouvements. */
  get: () => actif,

  /** À l'ouverture de l'appli : écoute les capteurs (et la souris). */
  demarrer() {
    if (demarre || typeof window === 'undefined') return;
    demarre = true;
    window.addEventListener('deviceorientation', surOrientation);
    window.addEventListener('pointermove', surSouris, { passive: true });
  },
};

export function useInclinaison() {
  return useSyncExternalStore(inclinaisonStore.subscribe, inclinaisonStore.get, () => false);
}
