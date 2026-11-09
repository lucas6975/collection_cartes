// Données de démonstration : chaque collaborateur a réellement « ouvert » ses packs passés
// via les règles de src/domain/packs.ts, donc collections et historiques sont cohérents.

import { CARDS } from '../content/cards';
import { ouvrirPack, progressionVide, rng } from '../domain/packs';
import type { Card, Progress, User } from '../domain/types';

export const DEMO_USER_ID = 'u-camille';

const PEOPLE: [string, string, string, string][] = [
  // prénom, nom, équipe, service
  ['Camille', 'Martin', 'Équipe A', 'Production'],
  ['Karim', 'Benali', 'Équipe A', 'Production'],
  ['Julie', 'Lefèvre', 'Équipe B', 'Production'],
  ['Thomas', 'Moreau', 'Équipe B', 'Production'],
  ['Inès', 'Garcia', 'Quai', 'Logistique'],
  ['Lucas', 'Petit', 'Quai', 'Logistique'],
  ['Sarah', 'Roux', 'Stocks', 'Logistique'],
  ['Antoine', 'Fournier', 'Interventions', 'Maintenance'],
  ['Léa', 'Girard', 'Interventions', 'Maintenance'],
  ['Mehdi', 'Haddad', 'Méthodes', 'Maintenance'],
  ['Claire', 'Bonnet', 'RH', 'Administratif'],
  ['Hugo', 'Lambert', 'Comptabilité', 'Administratif'],
  ['Nadia', 'Rousseau', 'Contrôle', 'Qualité'],
  ['Paul', 'Mercier', 'Contrôle', 'Qualité'],
  ['Emma', 'Faure', 'Laboratoire', 'Qualité'],
];

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const DAY = 86_400_000;

/** Simule les packs du jour ouverts sur les 30 derniers jours (jamais aujourd'hui). */
function simulate(
  cards: Card[],
  userId: string,
  assiduite: number,
  seed: number,
  now: Date,
  jours = 30,
): Progress {
  const r = rng(seed);
  let p = progressionVide(userId);
  for (let d = jours; d >= 1; d--) {
    if (r() > assiduite) continue;
    const date = new Date(now.getTime() - d * DAY);
    date.setHours(7 + Math.floor(r() * 10), Math.floor(r() * 60));
    p = ouvrirPack(cards, p, date).progress;
  }
  return p;
}

export function seedDatabase(now = new Date()) {
  const cards = structuredClone(CARDS);
  const users: User[] = PEOPLE.map(([prenom, nom, equipe, service], i) => ({
    id: i === 0 ? DEMO_USER_ID : `u-${slug(prenom)}`,
    prenom,
    nom,
    equipe,
    service,
    actif: true,
  }));

  const progress: Record<string, Progress> = {};
  users.forEach((u, i) => {
    // Camille vient d'arriver : 3 packs ouverts ces 3 derniers jours, celui d'aujourd'hui l'attend.
    progress[u.id] =
      u.id === DEMO_USER_ID
        ? simulate(cards, u.id, 1, 1000, now, 3)
        : simulate(cards, u.id, 0.12 + ((i * 37) % 60) / 100, 1000 + i * 7919, now);
  });

  return { cards, users, progress };
}
