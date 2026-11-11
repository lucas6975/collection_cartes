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
  /** Vrai quand la personne a validé ses jours de tirage au sort (dans le calendrier). */
  joursChoisis?: boolean;
}

interface Etat {
  identite: Identite | null;
  /** Code administrateur, présent seulement sur le téléphone de l'administrateur. */
  codeAdmin: string | null;
}

const KEY = 'team-ulysse-identite';
/** Week-ends de décembre 2026 : pas de défi ni de tirage ces jours-là. */
export const WEEKENDS = [5, 6, 12, 13, 19, 20];
/** Jours ouvrés du 1er au 24 décembre, les seuls où l'on peut s'inscrire. */
export const JOURS_OUVRES = Array.from({ length: 24 }, (_, i) => i + 1).filter(
  (j) => !WEEKENDS.includes(j),
);

function load(): Etat {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Etat;
      if (p && typeof p === 'object') {
        let identite = p.identite ?? null;
        // Les week-ends ne sont plus proposés : on les retire des inscriptions existantes,
        // et l'inscription corrigée sera renvoyée à la base.
        if (identite && identite.jours.some((j) => WEEKENDS.includes(j))) {
          identite = {
            ...identite,
            jours: identite.jours.filter((j) => !WEEKENDS.includes(j)),
            synchro: false,
          };
        }
        if (identite && identite.joursChoisis === undefined)
          identite = { ...identite, joursChoisis: identite.jours.length > 0 };
        return { identite, codeAdmin: p.codeAdmin ?? null };
      }
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
  async enregistrer(prenom: string, nom: string, jours: number[], joursChoisis?: boolean) {
    const avant = etat.identite;
    commit({
      ...etat,
      identite: {
        prenom: propre(prenom),
        nom: propre(nom),
        jours: jours.filter((j) => !WEEKENDS.includes(j)).sort((a, b) => a - b),
        jeton: avant?.jeton,
        synchro: false,
        joursChoisis: joursChoisis ?? avant?.joursChoisis ?? false,
      },
    });
    return identiteStore.synchroniser();
  },

  /** Inscription au tirage au sort : valide les jours choisis dans le calendrier. */
  async choisirJours(jours: number[]) {
    const id = etat.identite;
    if (!id) return false;
    return identiteStore.enregistrer(id.prenom, id.nom, jours, true);
  },

  /** Envoie l'inscription à la base si elle n'y est pas encore. Renvoie vrai si c'est fait. */
  async synchroniser(): Promise<boolean> {
    const id = etat.identite;
    if (!id || id.synchro) return true;
    try {
      const r = await api.inscrire(id.prenom, id.nom, id.jours, id.jeton);
      commit({
        ...etat,
        identite: {
          prenom: r.prenom,
          nom: r.nom,
          jours: r.jours,
          jeton: r.jeton,
          synchro: true,
          joursChoisis: id.joursChoisis,
        },
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
