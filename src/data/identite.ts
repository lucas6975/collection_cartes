// Identité de la personne sur ce téléphone : prénom, nom, jours choisis pour le tirage au sort,
// et éventuellement le code administrateur. Enregistrée dans le navigateur.

import { useSyncExternalStore } from 'react';
import { ApiError, api } from './api';

export interface Identite {
  prenom: string;
  nom: string;
  jours: number[];
  /** Jeton remis par la base : permet de modifier son inscription. */
  jeton?: string;
  /** Faux tant que l'inscription n'a pas pu être envoyée à la base. */
  synchro: boolean;
}

interface Etat {
  identite: Identite | null;
  /** Code administrateur, présent seulement sur le téléphone de l'administrateur. */
  codeAdmin: string | null;
}

const KEY = 'team-ulysse-identite';
export const TOUS_LES_JOURS = Array.from({ length: 24 }, (_, i) => i + 1);

function load(): Etat {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Etat;
      if (p && typeof p === 'object')
        return { identite: p.identite ?? null, codeAdmin: p.codeAdmin ?? null };
    }
  } catch {
    // Stockage indisponible : identité le temps de la visite.
  }
  return { identite: null, codeAdmin: null };
}

let etat: Etat = load();
const listeners = new Set<() => void>();

function commit(next: Etat) {
  etat = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Persistance impossible.
  }
  listeners.forEach((l) => l());
}

const propre = (s: string) => s.trim().replace(/\s+/g, ' ');

export const identiteStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => etat,

  /**
   * Enregistre (ou modifie) l'inscription. Elle est gardée sur le téléphone même si la base
   * est injoignable, et envoyée dès que possible.
   */
  async enregistrer(prenom: string, nom: string, jours: number[]) {
    const avant = etat.identite;
    commit({
      ...etat,
      identite: {
        prenom: propre(prenom),
        nom: propre(nom),
        jours: [...jours].sort((a, b) => a - b),
        jeton: avant?.jeton,
        synchro: false,
      },
    });
    return identiteStore.synchroniser();
  },

  /** Envoie l'inscription à la base si elle n'y est pas encore. Renvoie vrai si c'est fait. */
  async synchroniser(): Promise<boolean> {
    const id = etat.identite;
    if (!id || id.synchro) return true;
    try {
      const r = await api.inscrire(id.prenom, id.nom, id.jours, id.jeton);
      commit({
        ...etat,
        identite: { prenom: r.prenom, nom: r.nom, jours: r.jours, jeton: r.jeton, synchro: true },
      });
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.horsLigne) return false;
      throw e;
    }
  },

  async devenirAdmin(code: string) {
    await api.adminVerifier(code.trim());
    commit({ ...etat, codeAdmin: code.trim() });
  },

  quitterAdmin() {
    commit({ ...etat, codeAdmin: null });
  },
};

export function useIdentite() {
  return useSyncExternalStore(identiteStore.subscribe, identiteStore.get);
}
