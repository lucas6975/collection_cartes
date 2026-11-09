// Données de démonstration. Les progressions sont générées en rejouant de vraies actions via
// le moteur de jeu : XP, cartes, succès et historiques sont donc cohérents entre eux.

import { CARDS } from '../content/cards';
import { QUESTIONS } from '../content/questions';
import { PARCOURS, SCENARIOS } from '../content/scenarios';
import {
  defiDuJour,
  progressionVide,
  questionsParcours,
  soumettreQuiz,
  soumettreScenario,
  type Catalog,
} from '../domain/engine';
import type { Progress, User } from '../domain/types';

export const DEMO_USER_ID = 'u-camille';
export const DEMO_ADMIN_ID = 'u-admin';

export const defaultCatalog = (): Catalog =>
  structuredClone({ cards: CARDS, questions: QUESTIONS, scenarios: SCENARIOS, parcours: PARCOURS });

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
  ['Romain', 'Blanc', 'Équipe B', 'Production'],
];

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const DAY = 86_400_000;

/** Simule l'activité d'un collaborateur sur les `jours` derniers jours. */
function simulate(
  catalog: Catalog,
  userId: string,
  seed: number,
  competence: number,
  assiduite: number,
  now: Date,
): Progress {
  const r = rng(seed);
  let p = progressionVide(userId);
  const jours = 42;
  for (let d = jours; d >= 0; d--) {
    if (r() > assiduite) continue;
    const date = new Date(now.getTime() - d * DAY - Math.floor(r() * 8) * 3_600_000);
    // La compétence progresse avec le temps : on apprend de ses erreurs.
    const c = Math.min(0.97, competence + (jours - d) * 0.004);
    const answer = (qid: string) => {
      const q = catalog.questions.find((x) => x.id === qid)!;
      const wrong = q.choix.filter((x) => x.id !== q.bonneReponse);
      return r() < c ? q.bonneReponse : wrong[Math.floor(r() * wrong.length)].id;
    };
    const roll = r();
    if (roll < 0.45) {
      const daily = defiDuJour(catalog, date);
      p = soumettreQuiz(
        catalog,
        p,
        {
          contexte: 'quotidien',
          reponses: daily.questions.map((q) => ({ questionId: q.id, choixId: answer(q.id) })),
        },
        date,
      ).progress;
    } else if (roll < 0.8) {
      const parc = catalog.parcours[Math.floor(r() * catalog.parcours.length)];
      p = soumettreQuiz(
        catalog,
        p,
        {
          contexte: 'parcours',
          parcoursId: parc.id,
          reponses: questionsParcours(catalog, parc).map(({ id }) => ({
            questionId: id,
            choixId: answer(id),
          })),
        },
        date,
      ).progress;
    } else {
      const s = catalog.scenarios[Math.floor(r() * catalog.scenarios.length)];
      const choix = Object.fromEntries(
        s.etapes.map((e) => {
          const good = e.options.find((o) => o.correct)!;
          const bad = e.options.filter((o) => !o.correct);
          return [e.id, r() < c ? good.id : bad[Math.floor(r() * bad.length)].id];
        }),
      );
      p = soumettreScenario(catalog, p, s.id, choix, date).progress;
    }
  }
  return p;
}

/**
 * Progression scénarisée de Camille, le compte de démonstration : elle a démarré
 * la sécurité incendie (3 cartes sur 6) et validé les EPI, avec quelques erreurs à réviser.
 */
function camille(catalog: Catalog, now: Date): Progress {
  let p = progressionVide(DEMO_USER_ID);
  const at = (daysAgo: number, h = 10) =>
    new Date(now.getTime() - daysAgo * DAY + h * 3_600_000 - 12 * 3_600_000);
  const parcours = (parcoursId: string, rep: Record<string, string>, date: Date) => {
    p = soumettreQuiz(
      catalog,
      p,
      {
        contexte: 'parcours',
        parcoursId,
        reponses: Object.entries(rep).map(([questionId, choixId]) => ({ questionId, choixId })),
      },
      date,
    ).progress;
  };
  /** Défi du jour réellement proposé à cette date ; les `erreurs` premières réponses sont fausses. */
  const quotidien = (date: Date, erreurs: number) => {
    const { questions } = defiDuJour(catalog, date);
    const reponses = questions.map((q, i) => ({
      questionId: q.id,
      choixId: i < erreurs ? q.choix.find((c) => c.id !== q.bonneReponse)!.id : q.bonneReponse,
    }));
    p = soumettreQuiz(catalog, p, { contexte: 'quotidien', reponses }, date).progress;
  };
  // EPI : parcours validé avec une erreur, puis mise en situation réussie.
  parcours(
    'p-epi',
    { 'epi-1': 'b', 'epi-2': 'b', 'epi-3': 'b', 'epi-4': 'c', 'epi-5': 'b', 'epi-6': 'b' },
    at(12),
  );
  p = soumettreScenario(catalog, p, 's-epi', { e1: 'b', e2: 'b', e3: 'a' }, at(11)).progress;
  quotidien(at(10), 0);
  // Organisation : parcours tenté, pas encore validé (4/6).
  parcours(
    'p-organisation',
    { 'org-1': 'c', 'org-2': 'c', 'org-3': 'c', 'org-4': 'b', 'org-5': 'a', 'org-6': 'a' },
    at(7),
  );
  quotidien(at(6), 1);
  quotidien(at(4), 0);
  // Incendie : parcours tenté mais pas encore validé (4/6) : la carte rare reste à gagner.
  parcours(
    'p-incendie',
    { 'inc-1': 'a', 'inc-2': 'b', 'inc-3': 'b', 'inc-4': 'b', 'inc-5': 'b', 'inc-6': 'c' },
    at(2),
  );
  quotidien(at(1), 1);
  return p;
}

export function seedDatabase(now = new Date()) {
  const catalog = defaultCatalog();
  const users: User[] = PEOPLE.map(([prenom, nom, equipe, service], i) => ({
    id: i === 0 ? DEMO_USER_ID : `u-${slug(prenom)}`,
    prenom,
    nom,
    email: `${slug(prenom)}.${slug(nom)}@exemple.fr`,
    equipe,
    service,
    role: 'collaborateur',
    actif: i !== 15,
    creeLe: new Date(now.getTime() - (60 + i) * DAY).toISOString(),
  }));
  users.push({
    id: DEMO_ADMIN_ID,
    prenom: 'Nathalie',
    nom: 'Durand',
    email: 'nathalie.durand@exemple.fr',
    equipe: 'QSE',
    service: 'Direction',
    role: 'admin',
    actif: true,
    creeLe: new Date(now.getTime() - 90 * DAY).toISOString(),
  });

  const progress: Record<string, Progress> = {};
  users.forEach((u, i) => {
    if (u.id === DEMO_USER_ID) progress[u.id] = camille(catalog, now);
    else if (u.role === 'admin' || !u.actif) progress[u.id] = progressionVide(u.id);
    else {
      const competence = 0.45 + ((i * 37) % 40) / 100;
      const assiduite = 0.1 + ((i * 53) % 30) / 100;
      progress[u.id] = simulate(catalog, u.id, 1000 + i * 7919, competence, assiduite, now);
    }
  });

  return { catalog, users, progress };
}
