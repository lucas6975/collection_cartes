// Sauvegarde de la partie, sans compte.
//
// Chaque navigateur reçoit un identifiant aléatoire à sa première visite, et sa collection est
// enregistrée dans le stockage local de ce navigateur (localStorage). La personne retrouve donc
// sa collection à chaque visite, sur le même appareil et le même navigateur.

import { useSyncExternalStore } from 'react';
import { CARDS } from '../content/cards';
import { ouvrirPack, progressionVide, type PackResult } from '../domain/packs';
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

  /** Ouvre le pack du jour (un seul par jour, renouvelé à minuit). */
  openDailyPack = (): PackResult => {
    const res = ouvrirPack(CARDS, this.state.progress, new Date());
    this.state = { ...this.state, progress: res.progress };
    this.save();
    this.listeners.forEach((l) => l());
    return res;
  };
}

export const game = new Game();

export function useGame() {
  const state = useSyncExternalStore(game.subscribe, game.getState);
  return { progress: state.progress, cards: CARDS };
}
