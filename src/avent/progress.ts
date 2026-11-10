// Progression du calendrier.
//
// Collaborateurs : les étoiles sont enregistrées dans le navigateur.
// Administrateur : rien n'est enregistré. Ses étoiles ne durent que le temps de la visite,
// pour pouvoir présenter les défis à l'équipe en repartant toujours de zéro.

import { useSyncExternalStore } from 'react';
import { identiteStore } from '../data/identite';
import { ANNEE_AVENT } from './jours';
import type { ResultatJeu } from './types';

export interface JourTermine {
  etoiles: 0 | 1 | 2 | 3;
  resultats: ResultatJeu[];
  at: string;
}

type Etat = Record<number, JourTermine>;

const KEY = `team-ulysse-avent-${ANNEE_AVENT}`;

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
/** Étoiles de l'administrateur, gardées en mémoire uniquement. */
let etatAdmin: Etat = {};
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const estAdmin = () => !!identiteStore.get().codeAdmin;

export const aventStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    const stop = identiteStore.subscribe(l);
    return () => {
      listeners.delete(l);
      stop();
    };
  },
  get: () => (estAdmin() ? etatAdmin : etat),
  terminer(jour: number, resultat: JourTermine) {
    const courant = aventStore.get();
    // On garde le meilleur résultat obtenu pour chaque jour.
    if (courant[jour] && courant[jour].etoiles > resultat.etoiles) return;
    if (estAdmin()) {
      etatAdmin = { ...etatAdmin, [jour]: resultat };
    } else {
      etat = { ...etat, [jour]: resultat };
      try {
        localStorage.setItem(KEY, JSON.stringify(etat));
      } catch {
        // Stockage indisponible : le résultat reste en mémoire pour la visite.
      }
    }
    notify();
  },
  /** Remet les étoiles de l'administrateur à zéro (avant une démonstration). */
  remettreAZeroAdmin() {
    etatAdmin = {};
    notify();
  },
};

export function useAvent() {
  return useSyncExternalStore(aventStore.subscribe, aventStore.get);
}
