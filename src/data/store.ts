// Couche d'accès aux données.
//
// `GameBackend` décrit ce dont l'interface a besoin. L'implémentation actuelle (`LocalBackend`)
// enregistre tout dans le navigateur : c'est le mode démo de l'aperçu GitHub Pages. Une
// implémentation Supabase pourra la remplacer sans toucher aux pages (voir docs/ARCHITECTURE.md).

import { useSyncExternalStore } from 'react';
import { ouvrirPack, progressionVide, type PackResult } from '../domain/packs';
import type { Card, Progress, User } from '../domain/types';
import { seedDatabase } from './seed';

export interface DbState {
  version: number;
  cards: Card[];
  users: User[];
  progress: Record<string, Progress>;
  sessionUserId: string | null;
}

export interface GameBackend {
  getState(): DbState;
  subscribe(listener: () => void): () => void;
  login(userId: string): void;
  logout(): void;
  /** Ouvre le pack du jour (un seul par jour). */
  openDailyPack(): PackResult;
  /** Pack supplémentaire, réservé à la démonstration. */
  openBonusPack(): PackResult;
  resetDemo(): void;
}

const KEY = 'vigie-db';
const VERSION = 2;

function load(): DbState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DbState;
      if (parsed.version === VERSION) return parsed;
    }
  } catch {
    // Stockage indisponible (navigation privée, quota) : on repart des données de démo.
  }
  return { version: VERSION, ...seedDatabase(), sessionUserId: null };
}

class LocalBackend implements GameBackend {
  private state: DbState = load();
  private listeners = new Set<() => void>();

  getState = () => this.state;

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  private commit(next: DbState) {
    this.state = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Persistance impossible : l'état reste en mémoire pour la session.
    }
    this.listeners.forEach((l) => l());
  }

  private me(): User {
    const u = this.state.users.find((x) => x.id === this.state.sessionUserId);
    if (!u || !u.actif) throw new Error('Non connecté');
    return u;
  }

  private open(bonus: boolean): PackResult {
    const u = this.me();
    const p = this.state.progress[u.id] ?? progressionVide(u.id);
    const res = ouvrirPack(this.state.cards, p, new Date(), bonus);
    this.commit({ ...this.state, progress: { ...this.state.progress, [u.id]: res.progress } });
    return res;
  }

  login = (userId: string) => {
    const u = this.state.users.find((x) => x.id === userId);
    if (!u?.actif) throw new Error('Compte inactif');
    this.commit({ ...this.state, sessionUserId: userId });
  };

  logout = () => this.commit({ ...this.state, sessionUserId: null });

  openDailyPack = () => this.open(false);

  openBonusPack = () => this.open(true);

  resetDemo = () => {
    const session = this.state.sessionUserId;
    this.commit({ version: VERSION, ...seedDatabase(), sessionUserId: session });
  };
}

export const backend: GameBackend = new LocalBackend();

export function useDb(): DbState {
  return useSyncExternalStore(backend.subscribe, backend.getState);
}

export function useSession() {
  const db = useDb();
  const user = db.users.find((u) => u.id === db.sessionUserId) ?? null;
  const progress = user ? (db.progress[user.id] ?? progressionVide(user.id)) : null;
  return { db, user, progress, cards: db.cards };
}
