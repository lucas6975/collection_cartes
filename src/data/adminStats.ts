import { CATEGORIES } from '../content/categories';
import { niveauDepuisXp, progressionVide, published } from '../domain/engine';
import type { CategoryId, User } from '../domain/types';
import type { DbState } from './store';

export interface StatsFilter {
  service: string;
  equipe: string;
  jours: number;
}

const DAY = 86_400_000;
const QUIZ_TYPES = new Set(['quiz', 'parcours', 'quotidien', 'revision', 'scenario']);

export function collaborateurs(db: DbState, f: Pick<StatsFilter, 'service' | 'equipe'>): User[] {
  return db.users.filter(
    (u) =>
      u.role === 'collaborateur' &&
      (!f.service || u.service === f.service) &&
      (!f.equipe || u.equipe === f.equipe),
  );
}

export function computeStats(db: DbState, f: StatsFilter, now = new Date()) {
  const users = collaborateurs(db, f);
  const since = now.getTime() - f.jours * DAY;
  const progressOf = (u: User) => db.progress[u.id] ?? progressionVide(u.id);
  const qById = new Map(db.catalog.questions.map((q) => [q.id, q]));

  const inscrits = users.filter((u) => u.actif);
  const actifs = inscrits.filter((u) =>
    progressOf(u).activity.some((e) => Date.parse(e.at) >= since),
  );

  let quizRealises = 0;
  const answers: {
    userId: string;
    questionId: string;
    correct: boolean;
    t: number;
    categorie: CategoryId;
  }[] = [];
  for (const u of inscrits) {
    const p = progressOf(u);
    quizRealises += p.activity.filter(
      (e) => QUIZ_TYPES.has(e.type) && Date.parse(e.at) >= since,
    ).length;
    for (const a of p.answers) {
      const t = Date.parse(a.at);
      const q = qById.get(a.questionId);
      if (t >= since && q)
        answers.push({
          userId: u.id,
          questionId: a.questionId,
          correct: a.correct,
          t,
          categorie: q.categorie,
        });
    }
  }
  const rate = (xs: { correct: boolean }[]) =>
    xs.length ? xs.filter((x) => x.correct).length / xs.length : null;

  const parCategorie = CATEGORIES.map((c) => {
    const xs = answers.filter((a) => a.categorie === c.id);
    return { id: c.id, nom: c.court, couleur: c.couleur, score: rate(xs), reponses: xs.length };
  });

  // Évolution : par jour sur 7 jours, sinon par semaine.
  const step = f.jours <= 7 ? DAY : 7 * DAY;
  const buckets = Math.ceil((f.jours * DAY) / step);
  const evolution = Array.from({ length: buckets }, (_, i) => {
    const start = since + i * step;
    const xs = answers.filter((a) => a.t >= start && a.t < start + step);
    const d = new Date(start);
    return {
      label:
        step === DAY
          ? d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
          : `Sem. du ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`,
      court: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      score: rate(xs),
      reponses: xs.length,
    };
  });

  // Questions les plus échouées : signale les notions à renforcer.
  const byQ = new Map<string, { correct: number; total: number }>();
  for (const a of answers) {
    const s = byQ.get(a.questionId) ?? { correct: 0, total: 0 };
    s.total++;
    if (a.correct) s.correct++;
    byQ.set(a.questionId, s);
  }
  const difficultes = [...byQ.entries()]
    .filter(([, s]) => s.total >= 3)
    .map(([id, s]) => ({ question: qById.get(id)!, score: s.correct / s.total, total: s.total }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 6);

  const totalCartes = published(db.catalog.cards).length;
  const collectionMoyenne = inscrits.length
    ? inscrits.reduce((s, u) => s + progressOf(u).cards.length / totalCartes, 0) / inscrits.length
    : 0;
  const niveauMoyen = inscrits.length
    ? inscrits.reduce((s, u) => s + niveauDepuisXp(progressOf(u).xp).niveau, 0) / inscrits.length
    : 0;

  const services = [...new Set(users.map((u) => u.service))].sort().map((service) => {
    const members = inscrits.filter((u) => u.service === service);
    const ids = new Set(members.map((m) => m.id));
    const xs = answers.filter((a) => ids.has(a.userId));
    return {
      service,
      membres: members.length,
      actifs: members.filter((m) => actifs.includes(m)).length,
      score: rate(xs),
      collection: members.length
        ? members.reduce((s, m) => s + progressOf(m).cards.length / totalCartes, 0) / members.length
        : 0,
    };
  });

  return {
    inscrits: inscrits.length,
    totalComptes: users.length,
    actifs: actifs.length,
    participation: inscrits.length ? actifs.length / inscrits.length : 0,
    quizRealises,
    reponses: answers.length,
    scoreMoyen: rate(answers),
    parCategorie,
    evolution,
    difficultes,
    collectionMoyenne,
    niveauMoyen,
    services,
  };
}
