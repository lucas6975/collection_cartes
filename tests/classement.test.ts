import { describe, expect, it } from 'vitest';
import { pourTop, trier, type LigneClassement } from '../src/data/classement';

const l = (cartes: number, legendaires = 0, echanges = 0, moi = false): LigneClassement => ({
  cle: `${cartes}-${legendaires}-${echanges}-${moi}`,
  prenom: 'A',
  nom: 'B.',
  cartes,
  legendaires,
  echanges,
  moi,
});

describe('classement', () => {
  it('trie par cartes puis légendaires, avec ex aequo', () => {
    const t = trier([l(20, 1), l(25), l(20, 3), l(20, 1)], 'cartes');
    expect(t.map((x) => [x.cartes, x.legendaires, x.rang])).toEqual([
      [25, 0, 1],
      [20, 3, 2],
      [20, 1, 3],
      [20, 1, 3],
    ]);
  });

  it('trie par échanges', () => {
    expect(trier([l(30, 0, 1), l(10, 0, 6)], 'echanges')[0].echanges).toBe(6);
  });

  it('calcule ce qu’il manque pour le top 10', () => {
    const autres = Array.from({ length: 12 }, (_, i) => l(30 - i));
    expect(pourTop([...autres, l(18, 0, 0, true)])).toBe(4);
    expect(pourTop([...autres, l(29, 0, 0, true)])).toBe(0);
  });
});
