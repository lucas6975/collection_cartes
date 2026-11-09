import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards';
import { CATEGORIES } from '../src/content/categories';
import { QUESTIONS } from '../src/content/questions';
import { PARCOURS, SCENARIOS } from '../src/content/scenarios';

describe('contenu pédagogique', () => {
  it('cartes : identifiants et numéros uniques, une légendaire par famille', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    expect(new Set(CARDS.map((c) => c.numero)).size).toBe(CARDS.length);
    for (const cat of CATEGORIES) {
      expect(CARDS.filter((c) => c.categorie === cat.id && c.rarete === 'legendaire')).toHaveLength(
        1,
      );
    }
  });

  it('chaque contenu cite au moins une source', () => {
    for (const item of [...CARDS, ...QUESTIONS, ...SCENARIOS]) {
      expect(item.sources.length).toBeGreaterThan(0);
    }
  });

  it('les conditions d’obtention pointent vers des contenus existants', () => {
    for (const c of CARDS) {
      const o = c.obtention;
      if (o.type === 'parcours') expect(PARCOURS.map((p) => p.id)).toContain(o.parcoursId);
      if (o.type === 'scenario') expect(SCENARIOS.map((s) => s.id)).toContain(o.scenarioId);
      if (o.type === 'maitrise') {
        expect(QUESTIONS.filter((q) => q.categorie === c.categorie).length).toBeGreaterThanOrEqual(
          o.seuil,
        );
      }
    }
  });

  it('chaque question a une bonne réponse parmi ses choix', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) expect(q.choix.map((c) => c.id)).toContain(q.bonneReponse);
  });

  it('chaque étape de scénario a exactement une bonne option', () => {
    for (const s of SCENARIOS) {
      for (const e of s.etapes) expect(e.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });
});
