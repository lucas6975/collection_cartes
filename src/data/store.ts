// Couche d'accès aux données.
//
// `GameBackend` décrit tout ce dont l'interface a besoin. L'implémentation actuelle
// (`LocalBackend`) persiste dans le navigateur : c'est le mode démo, utilisé pour
// l'aperçu GitHub Pages. Une implémentation Supabase pourra la remplacer sans toucher
// aux pages (voir supabase/README.md).

import { useSyncExternalStore } from 'react';
import {
  soumettreQuiz,
  soumettreScenario,
  type Catalog,
  type QuizResult,
  type QuizSubmission,
  type ScenarioResult,
} from '../domain/engine';
import type { Card, Parcours, Progress, Question, User, Verification } from '../domain/types';
import { progressionVide } from '../domain/engine';
import { seedDatabase } from './seed';

export interface DbState {
  version: number;
  catalog: Catalog;
  users: User[];
  progress: Record<string, Progress>;
  sessionUserId: string | null;
}

export interface GameBackend {
  getState(): DbState;
  subscribe(listener: () => void): () => void;
  login(userId: string): void;
  logout(): void;
  submitQuiz(sub: QuizSubmission): QuizResult;
  submitScenario(scenarioId: string, choix: Record<string, string>): ScenarioResult;
  // Administration
  saveUser(user: User): void;
  deleteUser(userId: string): void;
  saveCard(card: Card): void;
  deleteCard(cardId: string): void;
  saveQuestion(q: Question): void;
  deleteQuestion(id: string): void;
  saveParcours(p: Parcours): void;
  setVerification(kind: 'card' | 'question' | 'scenario', id: string, v: Verification): void;
  /** Publier exige un contenu vérifié ; dépublier est toujours possible. */
  setPublication(kind: 'card' | 'question' | 'scenario', id: string, publie: boolean): void;
  resetDemo(): void;
}

const KEY = 'vigie-db';
const VERSION = 1;

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

  private requireAdmin() {
    if (this.me().role !== 'admin') throw new Error('Accès réservé aux administrateurs');
  }

  private catalog(patch: Partial<Catalog>) {
    this.commit({ ...this.state, catalog: { ...this.state.catalog, ...patch } });
  }

  login = (userId: string) => {
    const u = this.state.users.find((x) => x.id === userId);
    if (!u?.actif) throw new Error('Compte inactif');
    this.commit({ ...this.state, sessionUserId: userId });
  };

  logout = () => this.commit({ ...this.state, sessionUserId: null });

  submitQuiz = (sub: QuizSubmission) => {
    const u = this.me();
    const res = soumettreQuiz(
      this.state.catalog,
      this.state.progress[u.id] ?? progressionVide(u.id),
      sub,
      new Date(),
    );
    this.commit({ ...this.state, progress: { ...this.state.progress, [u.id]: res.progress } });
    return res;
  };

  submitScenario = (scenarioId: string, choix: Record<string, string>) => {
    const u = this.me();
    const res = soumettreScenario(
      this.state.catalog,
      this.state.progress[u.id] ?? progressionVide(u.id),
      scenarioId,
      choix,
      new Date(),
    );
    this.commit({ ...this.state, progress: { ...this.state.progress, [u.id]: res.progress } });
    return res;
  };

  saveUser = (user: User) => {
    this.requireAdmin();
    const exists = this.state.users.some((u) => u.id === user.id);
    this.commit({
      ...this.state,
      users: exists
        ? this.state.users.map((u) => (u.id === user.id ? user : u))
        : [...this.state.users, user],
      progress: exists
        ? this.state.progress
        : { ...this.state.progress, [user.id]: progressionVide(user.id) },
    });
  };

  deleteUser = (userId: string) => {
    this.requireAdmin();
    if (userId === this.state.sessionUserId)
      throw new Error('Impossible de supprimer son propre compte');
    const progress = { ...this.state.progress };
    delete progress[userId];
    this.commit({
      ...this.state,
      users: this.state.users.filter((u) => u.id !== userId),
      progress,
    });
  };

  saveCard = (card: Card) => {
    this.requireAdmin();
    const cards = this.state.catalog.cards;
    this.catalog({
      cards: cards.some((c) => c.id === card.id)
        ? cards.map((c) => (c.id === card.id ? card : c))
        : [...cards, card],
    });
  };

  deleteCard = (cardId: string) => {
    this.requireAdmin();
    const progress = Object.fromEntries(
      Object.entries(this.state.progress).map(([id, p]) => [
        id,
        { ...p, cards: p.cards.filter((c) => c.cardId !== cardId) },
      ]),
    );
    this.commit({
      ...this.state,
      progress,
      catalog: {
        ...this.state.catalog,
        cards: this.state.catalog.cards.filter((c) => c.id !== cardId),
      },
    });
  };

  saveQuestion = (q: Question) => {
    this.requireAdmin();
    const qs = this.state.catalog.questions;
    this.catalog({
      questions: qs.some((x) => x.id === q.id)
        ? qs.map((x) => (x.id === q.id ? q : x))
        : [...qs, q],
    });
  };

  deleteQuestion = (id: string) => {
    this.requireAdmin();
    this.catalog({
      questions: this.state.catalog.questions.filter((q) => q.id !== id),
      parcours: this.state.catalog.parcours.map((p) => ({
        ...p,
        questionIds: p.questionIds.filter((x) => x !== id),
      })),
    });
  };

  saveParcours = (p: Parcours) => {
    this.requireAdmin();
    this.catalog({ parcours: this.state.catalog.parcours.map((x) => (x.id === p.id ? p : x)) });
  };

  setVerification = (kind: 'card' | 'question' | 'scenario', id: string, v: Verification) => {
    this.requireAdmin();
    const c = this.state.catalog;
    if (kind === 'card')
      this.catalog({ cards: c.cards.map((x) => (x.id === id ? { ...x, verification: v } : x)) });
    if (kind === 'question')
      this.catalog({
        questions: c.questions.map((x) => (x.id === id ? { ...x, verification: v } : x)),
      });
    if (kind === 'scenario')
      this.catalog({
        scenarios: c.scenarios.map((x) => (x.id === id ? { ...x, verification: v } : x)),
      });
  };

  setPublication = (kind: 'card' | 'question' | 'scenario', id: string, publie: boolean) => {
    this.requireAdmin();
    const c = this.state.catalog;
    const list = kind === 'card' ? c.cards : kind === 'question' ? c.questions : c.scenarios;
    const item = list.find((x) => x.id === id);
    if (!item) return;
    if (publie && item.verification.statut !== 'valide')
      throw new Error('Un contenu doit être vérifié avant publication.');
    if (kind === 'card')
      this.catalog({ cards: c.cards.map((x) => (x.id === id ? { ...x, publie } : x)) });
    if (kind === 'question')
      this.catalog({ questions: c.questions.map((x) => (x.id === id ? { ...x, publie } : x)) });
    if (kind === 'scenario')
      this.catalog({ scenarios: c.scenarios.map((x) => (x.id === id ? { ...x, publie } : x)) });
  };

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
  return { db, user, progress, catalog: db.catalog };
}
