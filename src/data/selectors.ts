import { jourDe, progressionVide, serie } from '../domain/packs';
import type { User } from '../domain/types';
import type { DbState } from './store';

export interface Participant {
  user: User;
  cartes: number;
  packs: number;
  serie: number;
  dernierPack: string | null;
  ouvertAujourdhui: boolean;
}

const DAY = 86_400_000;

/**
 * Participants actifs : collaborateurs ayant ouvert au moins un pack ces 7 derniers jours,
 * classés par nombre de cartes différentes collectionnées.
 */
export function participantsActifs(db: DbState, now = new Date()): Participant[] {
  const depuis = now.getTime() - 7 * DAY;
  return db.users
    .filter((u) => u.actif)
    .map((user) => {
      const p = db.progress[user.id] ?? progressionVide(user.id);
      const dernier = p.packs.reduce<string | null>((m, x) => (!m || x.at > m ? x.at : m), null);
      return {
        user,
        cartes: p.cards.length,
        packs: p.packs.length,
        serie: serie(p, now),
        dernierPack: dernier,
        ouvertAujourdhui: p.packs.some((x) => !x.bonus && x.jour === jourDe(now)),
      };
    })
    .filter((x) => x.dernierPack && Date.parse(x.dernierPack) >= depuis)
    .sort(
      (a, b) => b.cartes - a.cartes || b.serie - a.serie || a.user.nom.localeCompare(b.user.nom),
    );
}
