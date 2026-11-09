import { describe, expect, it } from 'vitest';
import { defaultCatalog, seedDatabase } from '../src/data/seed';
import {
  SoumissionInvalide,
  XP,
  defiDuJour,
  fileDeRevision,
  niveauDepuisXp,
  progressionVide,
  soumettreQuiz,
  soumettreScenario,
} from '../src/domain/engine';

const catalog = defaultCatalog();
const now = new Date('2026-11-09T10:00:00Z');
const parcoursIncendie = catalog.parcours.find((p) => p.id === 'p-incendie')!;
const bonnes = (ids: string[]) =>
  ids.map((id) => ({
    questionId: id,
    choixId: catalog.questions.find((q) => q.id === id)!.bonneReponse,
  }));

describe('niveaux', () => {
  it('suit une courbe croissante', () => {
    expect(niveauDepuisXp(0).niveau).toBe(1);
    expect(niveauDepuisXp(99).niveau).toBe(1);
    expect(niveauDepuisXp(100).niveau).toBe(2);
    expect(niveauDepuisXp(300).niveau).toBe(3);
    expect(niveauDepuisXp(150).progression).toBeCloseTo(0.25);
  });
});

describe('quiz', () => {
  it('valide un parcours parfait : XP, carte rare et succès', () => {
    const res = soumettreQuiz(
      catalog,
      progressionVide('u'),
      {
        contexte: 'parcours',
        parcoursId: 'p-incendie',
        reponses: bonnes(parcoursIncendie.questionIds),
      },
      now,
    );
    expect(res.valide).toBe(true);
    expect(res.score).toBe(1);
    expect(res.summary.nouvellesCartes).toContain('extincteur-co2');
    expect(res.summary.nouvellesCartes).toContain('triangle-du-feu');
    expect(res.summary.nouveauxSucces).toContain('sans-faute');
    expect(res.progress.xp).toBe(6 * XP.bonneReponse + XP.parcours);
  });

  it('ne donne pas d’XP deux fois pour les mêmes bonnes réponses', () => {
    const sub = {
      contexte: 'parcours' as const,
      parcoursId: 'p-incendie',
      reponses: bonnes(parcoursIncendie.questionIds),
    };
    const first = soumettreQuiz(catalog, progressionVide('u'), sub, now);
    const second = soumettreQuiz(catalog, first.progress, sub, now);
    expect(second.summary.xpGagne).toBe(0);
  });

  it('ne valide pas un parcours sous le seuil et place les erreurs en révision', () => {
    const reponses = parcoursIncendie.questionIds.map((id, i) => {
      const q = catalog.questions.find((x) => x.id === id)!;
      return {
        questionId: id,
        choixId: i < 2 ? q.choix.find((c) => c.id !== q.bonneReponse)!.id : q.bonneReponse,
      };
    });
    const res = soumettreQuiz(
      catalog,
      progressionVide('u'),
      { contexte: 'parcours', parcoursId: 'p-incendie', reponses },
      now,
    );
    expect(res.valide).toBe(false);
    expect(res.summary.nouvellesCartes).not.toContain('extincteur-co2');
    expect(fileDeRevision(catalog, res.progress)).toHaveLength(2);
  });

  it('refuse les soumissions truquées', () => {
    const p = progressionVide('u');
    const run = (sub: Parameters<typeof soumettreQuiz>[2]) => () =>
      soumettreQuiz(catalog, p, sub, now);
    expect(run({ contexte: 'entrainement', reponses: bonnes(['inc-1', 'inc-1']) })).toThrow(
      SoumissionInvalide,
    );
    expect(
      run({ contexte: 'parcours', parcoursId: 'p-incendie', reponses: bonnes(['inc-1']) }),
    ).toThrow(SoumissionInvalide);
    expect(run({ contexte: 'quotidien', reponses: bonnes(['inc-1']) })).toThrow(SoumissionInvalide);
    expect(run({ contexte: 'revision', reponses: bonnes(['inc-1']) })).toThrow(SoumissionInvalide);
  });

  it('accorde le défi du jour une seule fois par jour', () => {
    const daily = defiDuJour(catalog, now);
    const sub = {
      contexte: 'quotidien' as const,
      reponses: bonnes(daily.questions.map((q) => q.id)),
    };
    const a = soumettreQuiz(catalog, progressionVide('u'), sub, now);
    const b = soumettreQuiz(catalog, a.progress, sub, now);
    expect(a.summary.xpGagne).toBe(daily.questions.length * XP.bonneReponse + XP.quotidien);
    expect(b.summary.xpGagne).toBe(0);
  });
});

describe('collection', () => {
  it('débloque la carte légendaire quand la famille est complète', () => {
    let p = progressionVide('u');
    const parc = catalog.parcours.find((x) => x.id === 'p-epi')!;
    p = soumettreQuiz(
      catalog,
      p,
      { contexte: 'parcours', parcoursId: 'p-epi', reponses: bonnes(parc.questionIds) },
      now,
    ).progress;
    const s = catalog.scenarios.find((x) => x.id === 's-epi')!;
    const choix = Object.fromEntries(
      s.etapes.map((e) => [e.id, e.options.find((o) => o.correct)!.id]),
    );
    const res = soumettreScenario(catalog, p, 's-epi', choix, now);
    expect(res.summary.nouvellesCartes).toEqual(
      expect.arrayContaining(['chaussures', 'protection-collective']),
    );
    expect(res.summary.xpGagne).toBe(XP.scenario + XP.collection);
  });
});

describe('données de démonstration', () => {
  it('génère des progressions cohérentes', () => {
    const db = seedDatabase(now);
    for (const p of Object.values(db.progress)) {
      expect(p.activity.reduce((s, e) => s + e.xp, 0)).toBe(p.xp);
      expect(new Set(p.cards.map((c) => c.cardId)).size).toBe(p.cards.length);
    }
    expect(db.progress['u-camille'].cards.length).toBeGreaterThan(5);
  });
});
