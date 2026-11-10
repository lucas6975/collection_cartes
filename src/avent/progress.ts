// Progression du calendrier, enregistrée dans le navigateur (comme la collection de cartes).

import { useSyncExternalStore } from 'react';
import { ANNEE_AVENT, PHASE_TEST } from './jours';
import type { ResultatJeu } from './types';

export interface JourTermine {
  etoiles: 0 | 1 | 2 | 3;
  resultats: ResultatJeu[];
  at: string;
}

type Etat = Record<number, JourTermine>;

// Les scores du test et ceux de décembre sont enregistrés séparément.
const KEY = `team-ulysse-avent-${PHASE_TEST ? 'test' : ANNEE_AVENT}`;
const APERCU = 'team-ulysse-avent-apercu';

function load(): Etat {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Etat) : {};
  } catch {
    return {};
  }
}

let etat: Etat = load();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const aventStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => etat,
  terminer(jour: number, resultat: JourTermine) {
    // On garde le meilleur résultat obtenu pour chaque jour.
    const avant = etat[jour];
    if (avant && avant.etoiles > resultat.etoiles) return;
    etat = { ...etat, [jour]: resultat };
    try {
      localStorage.setItem(KEY, JSON.stringify(etat));
    } catch {
      // Stockage indisponible : le résultat reste en mémoire pour la visite.
    }
    notify();
  },
};

export function useAvent() {
  return useSyncExternalStore(aventStore.subscribe, aventStore.get);
}

/**
 * Mode aperçu : toutes les cases sont ouvertes, pour préparer et tester le calendrier avant
 * décembre. On l'active en ajoutant « ?apercu » à l'adresse du calendrier ; il dure le temps
 * de la visite (onglet).
 */
export function modeApercu(search: string): boolean {
  try {
    const p = new URLSearchParams(search);
    if (p.has('apercu')) sessionStorage.setItem(APERCU, p.get('apercu') === '0' ? '0' : '1');
    return sessionStorage.getItem(APERCU) === '1';
  } catch {
    return new URLSearchParams(search).has('apercu');
  }
}
