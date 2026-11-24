// Échange en cours, gardé sur le téléphone : on peut quitter l'écran (ou l'appli) sans le perdre.
// Une bannière le suit sur toutes les pages, et la collection est mise à jour même hors de l'onglet.
import { useSyncExternalStore } from 'react';
import { CARDS } from '../content/cards';
import { RARITY_BY_ID } from '../content/categories';
import type { Echange } from './api';
import { bravoStore } from './bravo';
import { game } from './store';

export interface EchangeEnCours {
  /** a : a montré son QR code ; b : a scanné le code d'un collègue. */
  role: 'a' | 'b';
  code: string;
  cle: string;
  depuis: number;
}

const CLE = 'team-ulysse-echange-en-cours';
/** Un code reste valable 30 minutes côté serveur : on s'arrête un peu avant. */
const DUREE = 28 * 60 * 1000;
const abonnes = new Set<() => void>();
let cache: EchangeEnCours | null | undefined;

function lire(): EchangeEnCours | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) ?? 'null') as EchangeEnCours | null;
    return v && Date.now() - v.depuis < DUREE ? v : null;
  } catch {
    return null;
  }
}

export const echangeEnCours = {
  get(): EchangeEnCours | null {
    if (cache === undefined) cache = lire();
    if (cache && Date.now() - cache.depuis >= DUREE) cache = null;
    return cache;
  },
  set(v: EchangeEnCours | null) {
    cache = v;
    try {
      if (v) localStorage.setItem(CLE, JSON.stringify(v));
      else localStorage.removeItem(CLE);
    } catch {
      /* stockage indisponible : l'échange vivra le temps de la page */
    }
    abonnes.forEach((f) => f());
  },
  subscribe(f: () => void) {
    abonnes.add(f);
    return () => abonnes.delete(f);
  },
  /** Minutes restantes avant que le code expire. */
  minutesRestantes(v: EchangeEnCours) {
    return Math.max(1, Math.ceil((DUREE - (Date.now() - v.depuis)) / 60000));
  },
};

export function useEchangeEnCours() {
  return useSyncExternalStore(echangeEnCours.subscribe, echangeEnCours.get, () => null);
}

// ───────────── Échanges déjà appliqués sur ce téléphone (jamais deux fois) ─────────────

const FAITS = 'team-ulysse-echanges';
function dejaFaits(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAITS) ?? '[]') as string[];
  } catch {
    return [];
  }
}

/** Met à jour la collection une seule fois par échange. Renvoie faux si déjà fait. */
export function appliquerEchange(code: string, donne: string, recoit: string) {
  const faits = dejaFaits();
  if (faits.includes(code)) return false;
  try {
    localStorage.setItem(FAITS, JSON.stringify([...faits, code].slice(-200)));
  } catch {
    // Stockage indisponible.
  }
  game.echanger(donne, recoit);
  bravoStore.montrer('Échange réussi ! 🔁', 'Ta nouvelle carte est dans ta collection.');
  return true;
}

// ───────────── Ce qui arrange chacun ─────────────

const CARTE = new Map(CARDS.map((c) => [c.id, c]));
const rang = (id: string) => RARITY_BY_ID[CARTE.get(id)!.rarete].rang;

export interface Correspondance {
  /** Ses doublons qui me manquent : ce que je peux recevoir. */
  pourMoi: string[];
  /** Mes doublons qui lui manquent : ce que je peux donner. */
  pourLui: string[];
  /** Faux si l'autre téléphone n'a pas envoyé ses cartes manquantes (ancienne version). */
  connu: boolean;
}

/**
 * Compare les deux collections. Les plus rares d'abord.
 * @param sesDoublons  doublons de l'autre
 * @param sesManquantes cartes qui manquent à l'autre (absent : version de l'appli plus ancienne)
 */
export function correspondance(
  mesDoublons: string[],
  possedees: Set<string>,
  sesDoublons: string[],
  sesManquantes: string[] | undefined,
): Correspondance {
  const tri = (ids: string[]) =>
    ids.filter((id) => CARTE.has(id)).sort((a, b) => rang(b) - rang(a));
  const connu = !!sesManquantes?.length;
  const manque = new Set(sesManquantes ?? []);
  return {
    pourMoi: tri(sesDoublons.filter((id) => !possedees.has(id))),
    pourLui: tri(connu ? mesDoublons.filter((id) => manque.has(id)) : mesDoublons),
    connu,
  };
}

export type { Echange };
