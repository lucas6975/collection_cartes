import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards';
import {
  RecyclageImpossible,
  choixParDefaut,
  peutRecycler,
  retirerCopies,
  totalEnTrop,
} from '../src/domain/recyclage';
import type { Progress } from '../src/domain/types';

const now = new Date(2026, 10, 19, 10, 0);
const de = (r: string) => CARDS.filter((c) => c.rarete === r && !c.deblocage);
const p = (cartes: [string, number][], recyclages: string[] = []): Progress => ({
  userId: 'u',
  packs: [],
  recyclages,
  cards: cartes.map(([cardId, count]) => ({ cardId, count, firstAt: '' })),
});

describe('recyclage des doublons', () => {
  const [c1, c2] = de('commune');
  const [e1] = de('epique');
  const base = p([
    [c1.id, 4],
    [c2.id, 2],
    [e1.id, 3],
  ]);

  it('compte les copies en trop', () => {
    expect(totalEnTrop(base, CARDS)).toBe(3 + 1 + 2);
    expect(peutRecycler(base, CARDS, now)).toBe(true);
  });

  it('présélectionne les plus courantes, jamais les épiques', () => {
    expect(choixParDefaut(base, CARDS)).toEqual({ [c1.id]: 3, [c2.id]: 1 });
  });

  it('retire 5 copies en gardant toujours un exemplaire', () => {
    const r = retirerCopies(base, CARDS, { [c1.id]: 3, [c2.id]: 1, [e1.id]: 1 }, now);
    expect(r.cards.map((c) => c.count)).toEqual([1, 1, 2]);
    expect(r.recyclages).toEqual(['2026-11-19']);
  });

  it('refuse un deuxième recyclage le même jour, ou un mauvais choix', () => {
    const fait = p([[c1.id, 10]], ['2026-11-19']);
    expect(() => retirerCopies(fait, CARDS, { [c1.id]: 5 }, now)).toThrow(RecyclageImpossible);
    expect(peutRecycler(fait, CARDS, now)).toBe(false);
    expect(() => retirerCopies(base, CARDS, { [c1.id]: 4, [c2.id]: 1 }, now)).toThrow(
      RecyclageImpossible,
    );
    expect(() => retirerCopies(base, CARDS, { [c1.id]: 3 }, now)).toThrow(RecyclageImpossible);
  });

  it('autorise à nouveau le lendemain', () => {
    const hier = p([[c1.id, 10]], ['2026-11-18']);
    expect(peutRecycler(hier, CARDS, now)).toBe(true);
  });
});
