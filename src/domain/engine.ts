// Moteur de jeu : toutes les règles de progression sont ici, sous forme de fonctions pures.
// En mode démo, il s'exécute dans le navigateur. En production, les mêmes règles sont
// appliquées côté serveur (voir supabase/migrations) pour empêcher la triche : le client
// envoie uniquement les réponses choisies, jamais un score ou un nombre de points.

import type {
  ActivityEvent,
  Card,
  CategoryId,
  Parcours,
  Progress,
  Question,
  RewardSummary,
  Scenario,
} from './types';

export interface Catalog {
  cards: Card[];
  questions: Question[];
  scenarios: Scenario[];
  parcours: Parcours[];
}

export const XP = {
  bonneReponse: 10,
  parcours: 50,
  scenario: 40,
  quotidien: 30,
  collection: 100,
} as const;

export const SEUIL_QUOTIDIEN = 0.75;
export const QUESTIONS_QUOTIDIEN = 4;

// ───────────── Niveaux ─────────────

const TITRES = [
  'Recrue',
  'Vigilant',
  'Observateur',
  'Sentinelle',
  'Garant',
  'Référent',
  'Expert',
  'Maître de la prévention',
];

/** XP cumulée nécessaire pour atteindre le niveau n (n ≥ 1). */
export const xpPourNiveau = (n: number) => 50 * (n - 1) * n;

export function niveauDepuisXp(xp: number) {
  let niveau = 1;
  while (xp >= xpPourNiveau(niveau + 1)) niveau++;
  const base = xpPourNiveau(niveau);
  const suivant = xpPourNiveau(niveau + 1);
  return {
    niveau,
    titre: TITRES[Math.min(niveau - 1, TITRES.length - 1)],
    xpDansNiveau: xp - base,
    xpPourSuivant: suivant - base,
    progression: (xp - base) / (suivant - base),
  };
}

// ───────────── Lecture de la progression ─────────────

export const published = <T extends { publie: boolean }>(items: T[]) =>
  items.filter((i) => i.publie);

/** Questions publiées d'un parcours, dans l'ordre défini. */
export function questionsParcours(catalog: Catalog, p: Parcours): Question[] {
  return p.questionIds
    .map((id) => catalog.questions.find((q) => q.id === id))
    .filter((q): q is Question => !!q && q.publie);
}

export const ownsCard = (p: Progress, cardId: string) => p.cards.some((c) => c.cardId === cardId);

/** Questions déjà réussies au moins une fois. */
export function questionsReussies(p: Progress): Set<string> {
  return new Set(p.answers.filter((a) => a.correct).map((a) => a.questionId));
}

/** Dernière réponse donnée à chaque question. */
export function dernieresReponses(p: Progress): Map<string, boolean> {
  const m = new Map<string, boolean>();
  for (const a of p.answers) m.set(a.questionId, a.correct);
  return m;
}

/** Questions dont la dernière réponse était fausse : elles sont à réviser. */
export function fileDeRevision(catalog: Catalog, p: Progress): Question[] {
  const last = dernieresReponses(p);
  return published(catalog.questions).filter((q) => last.get(q.id) === false);
}

/** Maîtrise d'une catégorie : part des questions dont la dernière réponse est correcte. */
export function maitrise(catalog: Catalog, p: Progress, cat: CategoryId): number {
  const qs = published(catalog.questions).filter((q) => q.categorie === cat);
  if (qs.length === 0) return 0;
  const last = dernieresReponses(p);
  return qs.filter((q) => last.get(q.id) === true).length / qs.length;
}

export function collectionCategorie(catalog: Catalog, p: Progress, cat: CategoryId) {
  const cards = published(catalog.cards).filter((c) => c.categorie === cat);
  const obtenues = cards.filter((c) => ownsCard(p, c.id)).length;
  return { obtenues, total: cards.length, ratio: cards.length ? obtenues / cards.length : 0 };
}

export function parcoursValide(catalog: Catalog, p: Progress, parcoursId: string) {
  const def = catalog.parcours.find((x) => x.id === parcoursId);
  return !!def && p.parcours.some((x) => x.id === parcoursId && x.score >= def.seuil);
}

export const scenarioValide = (p: Progress, scenarioId: string) =>
  p.scenarios.some((s) => s.id === scenarioId && s.score === 1);

/** Une carte est-elle débloquée selon sa condition d'obtention ? */
export function conditionRemplie(catalog: Catalog, p: Progress, card: Card): boolean {
  const o = card.obtention;
  switch (o.type) {
    case 'maitrise': {
      const ok = questionsReussies(p);
      const n = catalog.questions.filter(
        (q) => q.categorie === card.categorie && ok.has(q.id),
      ).length;
      return n >= o.seuil;
    }
    case 'parcours':
      return parcoursValide(catalog, p, o.parcoursId);
    case 'scenario':
      return scenarioValide(p, o.scenarioId);
    case 'collection':
      return published(catalog.cards)
        .filter((c) => c.categorie === card.categorie && c.id !== card.id)
        .every((c) => ownsCard(p, c.id));
    case 'niveau':
      return niveauDepuisXp(p.xp).niveau >= o.niveau;
  }
}

/** Texte expliquant comment obtenir une carte encore verrouillée. */
export function indiceObtention(catalog: Catalog, card: Card): string {
  const o = card.obtention;
  switch (o.type) {
    case 'maitrise':
      return o.seuil === 1
        ? 'Réussir une première question de cette catégorie.'
        : `Réussir ${o.seuil} questions différentes de cette catégorie.`;
    case 'parcours': {
      const p = catalog.parcours.find((x) => x.id === o.parcoursId);
      return `Valider le parcours « ${p?.titre ?? o.parcoursId} ».`;
    }
    case 'scenario': {
      const s = catalog.scenarios.find((x) => x.id === o.scenarioId);
      return `Réussir sans faute la mise en situation « ${s?.titre ?? o.scenarioId} ».`;
    }
    case 'collection':
      return 'Obtenir toutes les autres cartes de cette famille.';
    case 'niveau':
      return `Atteindre le niveau ${o.niveau}.`;
  }
}

// ───────────── Succès ─────────────

export interface AchievementDef {
  id: string;
  titre: string;
  description: string;
  icone: string;
  test: (catalog: Catalog, p: Progress) => boolean;
}

const CAT_NOMS: Record<CategoryId, string> = {
  incendie: 'incendie',
  epi: 'EPI',
  risques: 'risques',
  postures: 'gestes et postures',
  organisation: 'procédures',
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'premier-pas',
    titre: 'Premier pas',
    description: 'Terminer son premier quiz.',
    icone: 'Footprints',
    test: (_, p) => p.answers.length > 0,
  },
  {
    id: 'sans-faute',
    titre: 'Sans faute',
    description: 'Obtenir 100 % à un parcours.',
    icone: 'BadgeCheck',
    test: (_, p) => p.parcours.some((x) => x.score === 1),
  },
  {
    id: 'immersion',
    titre: 'Immersion',
    description: 'Réussir une mise en situation.',
    icone: 'Clapperboard',
    test: (_, p) => p.scenarios.some((s) => s.score === 1),
  },
  {
    id: 'reviseur',
    titre: 'Réviseur',
    description: 'Corriger une erreur en révision.',
    icone: 'RotateCcw',
    test: (_, p) => p.answers.some((a) => a.contexte === 'revision' && a.correct),
  },
  {
    id: 'assidu',
    titre: 'Assidu',
    description: 'Réussir le défi du jour trois jours différents.',
    icone: 'CalendarCheck',
    test: (_, p) => p.quotidiens.length >= 3,
  },
  {
    id: 'collectionneur',
    titre: 'Collectionneur',
    description: 'Obtenir 10 cartes.',
    icone: 'Layers',
    test: (_, p) => p.cards.length >= 10,
  },
  {
    id: 'album-complet',
    titre: 'Album complet',
    description: 'Compléter une famille de cartes.',
    icone: 'BookOpenCheck',
    test: (c, p) =>
      (['incendie', 'epi', 'risques', 'postures', 'organisation'] as CategoryId[]).some(
        (cat) => collectionCategorie(c, p, cat).ratio === 1,
      ),
  },
  ...(
    ['incendie', 'epi', 'risques', 'postures', 'organisation'] as CategoryId[]
  ).map<AchievementDef>((cat) => ({
    id: `expert-${cat}`,
    titre: `Expert ${CAT_NOMS[cat]}`,
    description: `Valider tous les défis de la catégorie ${CAT_NOMS[cat]}.`,
    icone: 'Medal',
    test: (c, p) =>
      c.parcours
        .filter((x) => x.categorie === cat && x.publie)
        .every((x) => parcoursValide(c, p, x.id)) &&
      c.scenarios
        .filter((s) => s.categorie === cat && s.publie)
        .every((s) => scenarioValide(p, s.id)),
  })),
  {
    id: 'maitre',
    titre: 'Maître collectionneur',
    description: 'Obtenir toutes les cartes.',
    icone: 'Crown',
    test: (c, p) => published(c.cards).every((card) => ownsCard(p, card.id)),
  },
];

// ───────────── Application des actions ─────────────

const event = (
  type: ActivityEvent['type'],
  label: string,
  xp: number,
  at: string,
): ActivityEvent => ({
  id: crypto.randomUUID(),
  type,
  label,
  xp,
  at,
});

function clone(p: Progress): Progress {
  return structuredClone(p);
}

/**
 * Débloque les cartes, bonus de collection et succès dont les conditions sont remplies.
 * Boucle jusqu'à stabilité, car une carte peut en débloquer une autre (carte « collection »).
 */
function consolider(catalog: Catalog, p: Progress, at: string, summary: RewardSummary) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const card of published(catalog.cards)) {
      if (!ownsCard(p, card.id) && conditionRemplie(catalog, p, card)) {
        p.cards.push({ cardId: card.id, at });
        p.activity.push(event('carte', `Carte obtenue : ${card.nom}`, 0, at));
        summary.nouvellesCartes.push(card.id);
        changed = true;

        const col = collectionCategorie(catalog, p, card.categorie);
        if (col.ratio === 1) {
          p.xp += XP.collection;
          summary.xpGagne += XP.collection;
          p.activity.push(event('carte', 'Famille de cartes complétée', XP.collection, at));
        }
      }
    }
  }
  for (const a of ACHIEVEMENTS) {
    if (!p.achievements.some((x) => x.id === a.id) && a.test(catalog, p)) {
      p.achievements.push({ id: a.id, at });
      p.activity.push(event('succes', `Succès débloqué : ${a.titre}`, 0, at));
      summary.nouveauxSucces.push(a.id);
    }
  }
  summary.niveauApres = niveauDepuisXp(p.xp).niveau;
  if (summary.niveauApres > summary.niveauAvant) {
    p.activity.push(event('niveau', `Niveau ${summary.niveauApres} atteint`, 0, at));
  }
}

export interface QuizSubmission {
  contexte: 'parcours' | 'quotidien' | 'revision' | 'entrainement';
  parcoursId?: string;
  reponses: { questionId: string; choixId: string }[];
}

export interface QuizResult {
  progress: Progress;
  summary: RewardSummary;
  score: number;
  corrections: { questionId: string; correct: boolean; xp: number }[];
  valide: boolean;
}

export class SoumissionInvalide extends Error {}

const memesIds = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

/**
 * Refuse toute soumission qui ne correspond pas exactement au défi proposé :
 * on ne peut pas choisir ses questions, ni répondre deux fois à la même.
 */
function verifierSoumission(catalog: Catalog, p: Progress, sub: QuizSubmission, now: Date) {
  const ids = sub.reponses.map((r) => r.questionId);
  if (new Set(ids).size !== ids.length) throw new SoumissionInvalide('Question répétée.');
  if (ids.length === 0) throw new SoumissionInvalide('Aucune réponse.');
  switch (sub.contexte) {
    case 'parcours': {
      const def = catalog.parcours.find((x) => x.id === sub.parcoursId && x.publie);
      if (
        !def ||
        !memesIds(
          ids,
          questionsParcours(catalog, def).map((q) => q.id),
        )
      )
        throw new SoumissionInvalide('Questions du parcours incorrectes.');
      break;
    }
    case 'quotidien':
      if (
        !memesIds(
          ids,
          defiDuJour(catalog, now).questions.map((q) => q.id),
        )
      )
        throw new SoumissionInvalide('Ce ne sont pas les questions du défi du jour.');
      break;
    case 'revision': {
      const file = new Set(fileDeRevision(catalog, p).map((q) => q.id));
      if (!ids.every((id) => file.has(id)))
        throw new SoumissionInvalide('Question absente de la file de révision.');
      break;
    }
    case 'entrainement':
      break;
  }
}

/** Corrige un quiz et calcule les récompenses. C'est le seul point d'entrée qui attribue de l'XP pour un quiz. */
export function soumettreQuiz(
  catalog: Catalog,
  progress: Progress,
  sub: QuizSubmission,
  now: Date,
): QuizResult {
  verifierSoumission(catalog, progress, sub, now);
  const at = now.toISOString();
  const p = clone(progress);
  const summary: RewardSummary = {
    xpGagne: 0,
    niveauAvant: niveauDepuisXp(p.xp).niveau,
    niveauApres: 0,
    nouvellesCartes: [],
    nouveauxSucces: [],
  };
  const dejaReussies = questionsReussies(p);
  const corrections: QuizResult['corrections'] = [];

  for (const r of sub.reponses) {
    const q = catalog.questions.find((x) => x.id === r.questionId);
    if (!q) continue;
    const correct = q.bonneReponse === r.choixId;
    // L'XP n'est accordée qu'à la première réussite d'une question : répéter un quiz
    // déjà maîtrisé ne permet pas d'accumuler des points sans apprendre.
    const xp = correct && !dejaReussies.has(q.id) ? XP.bonneReponse : 0;
    if (correct) dejaReussies.add(q.id);
    p.answers.push({ questionId: q.id, correct, at, contexte: sub.contexte });
    p.xp += xp;
    summary.xpGagne += xp;
    corrections.push({ questionId: q.id, correct, xp });
  }

  const total = corrections.length;
  const score = total ? corrections.filter((c) => c.correct).length / total : 0;
  let valide = false;
  let label = 'Quiz';

  if (sub.contexte === 'parcours' && sub.parcoursId) {
    const def = catalog.parcours.find((x) => x.id === sub.parcoursId);
    if (def) {
      label = `Parcours : ${def.titre}`;
      const dejaValide = parcoursValide(catalog, p, def.id);
      p.parcours.push({ id: def.id, score, at });
      valide = score >= def.seuil;
      if (valide && !dejaValide) {
        p.xp += XP.parcours;
        summary.xpGagne += XP.parcours;
      }
    }
  } else if (sub.contexte === 'quotidien') {
    label = 'Défi du jour';
    const jour = at.slice(0, 10);
    valide = score >= SEUIL_QUOTIDIEN;
    if (valide && !p.quotidiens.includes(jour)) {
      p.quotidiens.push(jour);
      p.xp += XP.quotidien;
      summary.xpGagne += XP.quotidien;
    }
  } else if (sub.contexte === 'revision') {
    label = 'Révision';
    valide = score === 1;
  }

  p.activity.push(
    event(
      sub.contexte === 'revision'
        ? 'revision'
        : sub.contexte === 'quotidien'
          ? 'quotidien'
          : sub.contexte === 'parcours'
            ? 'parcours'
            : 'quiz',
      `${label} (${Math.round(score * 100)} %)`,
      summary.xpGagne,
      at,
    ),
  );
  consolider(catalog, p, at, summary);
  return { progress: p, summary, score, corrections, valide };
}

export interface ScenarioResult {
  progress: Progress;
  summary: RewardSummary;
  score: number;
  valide: boolean;
}

export function soumettreScenario(
  catalog: Catalog,
  progress: Progress,
  scenarioId: string,
  choix: Record<string, string>,
  now: Date,
): ScenarioResult {
  const at = now.toISOString();
  const p = clone(progress);
  const summary: RewardSummary = {
    xpGagne: 0,
    niveauAvant: niveauDepuisXp(p.xp).niveau,
    niveauApres: 0,
    nouvellesCartes: [],
    nouveauxSucces: [],
  };
  const s = catalog.scenarios.find((x) => x.id === scenarioId);
  if (!s) throw new Error(`Scénario inconnu : ${scenarioId}`);

  const bonnes = s.etapes.filter(
    (e) => e.options.find((o) => o.id === choix[e.id])?.correct,
  ).length;
  const score = bonnes / s.etapes.length;
  const dejaValide = scenarioValide(p, s.id);
  p.scenarios.push({ id: s.id, score, at });
  const valide = score === 1;
  if (valide && !dejaValide) {
    p.xp += XP.scenario;
    summary.xpGagne += XP.scenario;
  }
  p.activity.push(
    event(
      'scenario',
      `Mise en situation : ${s.titre} (${bonnes}/${s.etapes.length})`,
      summary.xpGagne,
      at,
    ),
  );
  consolider(catalog, p, at, summary);
  return { progress: p, summary, score, valide };
}

// ───────────── Défi du jour ─────────────

/** Générateur pseudo-aléatoire déterministe (même défi pour tout le monde le même jour). */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const CATEGORY_ORDER: CategoryId[] = ['incendie', 'epi', 'risques', 'postures', 'organisation'];

export function defiDuJour(catalog: Catalog, date: Date) {
  const jour = date.toISOString().slice(0, 10);
  const dayIndex = Math.floor(Date.parse(jour) / 86_400_000);
  const categorie = CATEGORY_ORDER[dayIndex % CATEGORY_ORDER.length];
  const rand = seeded(dayIndex);
  const pool = published(catalog.questions).filter((q) => q.categorie === categorie);
  const questions = [...pool]
    .map((q) => ({ q, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .slice(0, QUESTIONS_QUOTIDIEN)
    .map((x) => x.q);
  return { jour, categorie, questions };
}

/** Prochaine carte « maîtrise » que le joueur peut obtenir dans une catégorie. */
export function prochaineCarteMaitrise(
  catalog: Catalog,
  p: Progress,
  cat: CategoryId,
): Card | undefined {
  return published(catalog.cards)
    .filter((c) => c.categorie === cat && c.obtention.type === 'maitrise' && !ownsCard(p, c.id))
    .sort((a, b) => a.numero - b.numero)[0];
}

// ───────────── Classement ─────────────

export function debutSemaine(now: Date): Date {
  const d = new Date(now);
  const jour = (d.getDay() + 6) % 7; // lundi = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - jour);
  return d;
}

export function xpDepuis(p: Progress, depuis: Date): number {
  const t = depuis.getTime();
  return p.activity.filter((e) => Date.parse(e.at) >= t).reduce((s, e) => s + e.xp, 0);
}

export const progressionVide = (userId: string): Progress => ({
  userId,
  xp: 0,
  cards: [],
  answers: [],
  parcours: [],
  scenarios: [],
  quotidiens: [],
  achievements: [],
  activity: [],
});
