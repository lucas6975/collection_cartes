import { debutSemaine, niveauDepuisXp, progressionVide, xpDepuis } from '../domain/engine';
import type { User } from '../domain/types';
import type { DbState } from './store';

export interface Row {
  user: User;
  xp: number;
  niveau: number;
  cartes: number;
}

/** Collaborateurs actifs classés par XP (totale ou de la semaine en cours). */
export function classement(db: DbState, periode: 'general' | 'semaine', now = new Date()): Row[] {
  const depuis = debutSemaine(now);
  return db.users
    .filter((u) => u.actif && u.role === 'collaborateur')
    .map((user) => {
      const p = db.progress[user.id] ?? progressionVide(user.id);
      return {
        user,
        xp: periode === 'general' ? p.xp : xpDepuis(p, depuis),
        niveau: niveauDepuisXp(p.xp).niveau,
        cartes: p.cards.length,
      };
    })
    .sort((a, b) => b.xp - a.xp || a.user.nom.localeCompare(b.user.nom));
}

/** Classement par service : moyenne d'XP par membre, pour ne pas avantager les grandes équipes. */
export function classementEquipes(db: DbState) {
  const groups = new Map<
    string,
    { service: string; membres: number; xp: number; cartes: number }
  >();
  for (const r of classement(db, 'general')) {
    const g = groups.get(r.user.service) ?? {
      service: r.user.service,
      membres: 0,
      xp: 0,
      cartes: 0,
    };
    g.membres++;
    g.xp += r.xp;
    g.cartes += r.cartes;
    groups.set(r.user.service, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, moyenne: Math.round(g.xp / g.membres) }))
    .sort((a, b) => b.moyenne - a.moyenne);
}
