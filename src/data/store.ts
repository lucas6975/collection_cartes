// Sauvegarde de la partie, sans compte.
//
// Chaque navigateur reçoit un identifiant aléatoire à sa première visite, et sa collection est
// enregistrée dans le stockage local de ce navigateur (localStorage). La personne retrouve donc
// sa collection à chaque visite, sur le même appareil et le même navigateur.

import { useSyncExternalStore } from 'react';
import { CARDS } from '../content/cards';
import {
  carteADebloquer,
  jourDe,
  ouvrirPack,
  progressionVide,
  type PackResult,
} from '../domain/packs';
import { retirerCopies } from '../domain/recyclage';
import { CASES, carteGagnee, tirerCase } from '../domain/roue';
import type { Progress } from '../domain/types';

export interface SavedGame {
  version: number;
  progress: Progress;
}

const KEY = 'vigie-partie';
const VERSION = 3;

function nouvelIdentifiant(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function estValide(g: unknown): g is SavedGame {
  const p = (g as SavedGame | null)?.progress;
  return (
    (g as SavedGame | null)?.version === VERSION &&
    typeof p?.userId === 'string' &&
    Array.isArray(p.cards) &&
    Array.isArray(p.packs)
  );
}

function load(): SavedGame {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (estValide(parsed)) return parsed;
    }
  } catch {
    // Stockage indisponible (navigation privée stricte) : la partie vit le temps de la visite.
  }
  return { version: VERSION, progress: progressionVide(nouvelIdentifiant()) };
}

class Game {
  private state: SavedGame = load();
  private listeners = new Set<() => void>();

  constructor() {
    this.save();
    // Demande au navigateur de ne pas effacer ces données pour libérer de la place.
    navigator.storage?.persist?.().catch(() => undefined);
  }

  getState = () => this.state;

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // Persistance impossible : la partie reste en mémoire pour la visite.
    }
  }

  private commit(progress: Progress) {
    this.state = { ...this.state, progress };
    this.save();
    this.listeners.forEach((l) => l());
  }

  /**
   * Ouvre un pack. La carte personnelle est glissée dans le premier pack ouvert après son
   * arrivée dans l'appli (premier pack pour les nouveaux, prochain pack pour les autres).
   */
  private ouvrir(bonus: boolean): PackResultat {
    const now = new Date();
    const res = ouvrirPack(CARDS, this.state.progress, now, bonus);
    const perso = !this.state.progress.cartePerso;
    const progress = perso ? { ...res.progress, cartePerso: now.toISOString() } : res.progress;
    this.commit(progress);
    return { ...res, progress, perso };
  }

  /** Ouvre le pack du jour (un seul par jour, renouvelé à minuit). */
  openDailyPack = () => this.ouvrir(false);

  /** Administrateur : rend le pack du jour de nouveau disponible (pour tester la pastille). */
  remettrePackDuJour = () => {
    const jour = jourDe(new Date());
    const p = this.state.progress;
    this.commit({ ...p, packs: p.packs.filter((x) => x.bonus || x.jour !== jour) });
  };

  /** Recycle 5 doublons, puis ouvre un pack bonus. */
  recycler = (choix: Record<string, number>): PackResultat => {
    this.commit(retirerCopies(this.state.progress, CARDS, choix, new Date()));
    return this.ouvrir(true);
  };

  /** Ajoute une carte à la collection (et débloque Ulysse si toutes les LSR sont réunies). */
  private ajouterCarte(p: Progress, id: string) {
    const at = new Date().toISOString();
    const deja = p.cards.some((c) => c.cardId === id);
    const next = deja
      ? p.cards.map((c) => (c.cardId === id ? { ...c, count: c.count + 1 } : c))
      : [...p.cards, { cardId: id, count: 1, firstAt: at }];
    const debloquee = carteADebloquer(CARDS, new Set(next.map((c) => c.cardId)));
    if (debloquee) next.push({ cardId: debloquee.id, count: 1, firstAt: at });
    return { progress: { ...p, cards: next }, nouvelle: !deja, debloquee };
  }

  /** Carte offerte (cadeau de l'administrateur). */
  recevoirCarte = (id: string) => {
    const r = this.ajouterCarte(this.state.progress, id);
    this.commit(r.progress);
    return r;
  };

  /** Roue de Secours : un seul tour. Les cartes gagnées sont ajoutées tout de suite. */
  tournerRoue = () => {
    const p = this.state.progress;
    const jour = jourDe(new Date());
    if (p.roue) throw new Error('Tu as déjà tourné la roue !');
    const index = tirerCase();
    const gain = CASES[index].id;
    const carte = carteGagnee(gain, p, CARDS);
    let next: Progress = { ...p, roue: { jour, gain, carteId: carte?.id, recupere: !!carte } };
    let debloquee = null;
    if (carte) {
      const r = this.ajouterCarte(next, carte.id);
      next = r.progress;
      debloquee = r.debloquee;
    }
    if (gain === 'or') {
      next = {
        ...next,
        ulysseOr: { at: new Date().toISOString(), numero: null },
        roue: { ...next.roue!, recupere: true },
      };
    }
    this.commit(next);
    return { index, gain, carte, debloquee };
  };

  /** Joker : la personne choisit la carte qu'elle veut. */
  choisirJoker = (id: string) => {
    const p = this.state.progress;
    if (p.roue?.gain !== 'joker' || p.roue.recupere) throw new Error('Joker déjà utilisé.');
    const r = this.ajouterCarte(p, id);
    this.commit({ ...r.progress, roue: { ...p.roue, carteId: id, recupere: true } });
    return r;
  };

  /** Pack bonus gagné à la roue. */
  ouvrirPackRoue = (): PackResultat => {
    const p = this.state.progress;
    if (p.roue?.gain !== 'pack' || p.roue.recupere) throw new Error('Pack déjà ouvert.');
    this.commit({ ...p, roue: { ...p.roue, recupere: true } });
    return this.ouvrir(true);
  };

  /** Administrateur : permet de retourner la roue (pour tester). */
  remettreRoue = () => {
    const { roue: _r, ...p } = this.state.progress;
    void _r;
    this.commit(p);
  };

  /** Numéro de la carte Ulysse en Or, attribué par la base. */
  numeroterOr = (numero: number) => {
    const p = this.state.progress;
    if (p.ulysseOr) this.commit({ ...p, ulysseOr: { ...p.ulysseOr, numero } });
  };

  /** Pack supplémentaire, réservé à l'administrateur pour tester l'ouverture. */
  openPackTest = () => this.ouvrir(true);

  /** Applique un échange : une carte donnée (un doublon) contre une carte reçue. */
  echanger = (donne: string, recoit: string) => {
    const p = this.state.progress;
    const at = new Date().toISOString();
    const cards = p.cards
      .map((c) => (c.cardId === donne ? { ...c, count: c.count - 1 } : c))
      .filter((c) => c.count > 0);
    const deja = cards.find((c) => c.cardId === recoit);
    const next = deja
      ? cards.map((c) => (c.cardId === recoit ? { ...c, count: c.count + 1 } : c))
      : [...cards, { cardId: recoit, count: 1, firstAt: at }];
    const debloquee = carteADebloquer(CARDS, new Set(next.map((c) => c.cardId)));
    if (debloquee) next.push({ cardId: debloquee.id, count: 1, firstAt: at });
    this.commit({ ...p, cards: next });
    return { nouvelle: !deja, debloquee };
  };
}

/** Cartes échangeables : celles en plusieurs exemplaires (jamais la carte secrète Ulysse). */
export function doublons(p: Progress): string[] {
  const secretes = new Set(CARDS.filter((c) => c.deblocage).map((c) => c.id));
  return p.cards.filter((c) => c.count > 1 && !secretes.has(c.cardId)).map((c) => c.cardId);
}

export interface PackResultat extends PackResult {
  /** Vrai si la carte personnelle est offerte dans ce pack. */
  perso: boolean;
}

export const game = new Game();

export function useGame() {
  const state = useSyncExternalStore(game.subscribe, game.getState);
  return { progress: state.progress, cards: CARDS };
}
