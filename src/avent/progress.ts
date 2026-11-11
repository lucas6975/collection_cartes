// Progression du calendrier.
//
// Collaborateurs : les étoiles sont enregistrées dans le navigateur.
// Administrateur : ses étoiles sont enregistrées à part (clé distincte), pour ne jamais se
// mélanger avec celles d'un joueur. Elles restent d'une visite à l'autre et ne repartent de
// zéro que lorsqu'il touche « Remettre à zéro ».

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
const KEY_ADMIN = `team-ulysse-avent-admin-${ANNEE_AVENT}`;

function load(key: string): Etat {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Etat) : {};
  } catch {
    return {};
  }
}

function save(key: string, e: Etat) {
  try {
    localStorage.setItem(key, JSON.stringify(e));
  } catch {
    // Stockage indisponible : le résultat reste en mémoire pour la visite.
  }
}

let etat: Etat = load(KEY);
/** Étoiles de l'administrateur, enregistrées à part. */
let etatAdmin: Etat = load(KEY_ADMIN);
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
      save(KEY_ADMIN, etatAdmin);
    } else {
      etat = { ...etat, [jour]: resultat };
      save(KEY, etat);
    }
    notify();
  },
  /** Remet les étoiles de l'administrateur à zéro (avant une démonstration). */
  remettreAZeroAdmin() {
    etatAdmin = {};
    save(KEY_ADMIN, etatAdmin);
    notify();
  },
};

export function useAvent() {
  return useSyncExternalStore(aventStore.subscribe, aventStore.get);
}
