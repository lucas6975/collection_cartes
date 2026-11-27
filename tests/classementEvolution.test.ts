import { describe, expect, it } from 'vitest';
import { evolution, type LigneClassement } from '../src/data/classement';

const l = (o: Partial<LigneClassement>): LigneClassement => ({
  cle: 'a',
  prenom: 'A',
  nom: 'B.',
  cartes: 10,
  legendaires: 0,
  echanges: 0,
  moi: false,
  photo: true,
  ...o,
});

describe('montées et descentes du classement', () => {
  it('compare la place en direct à celle de la photo du jour', () => {
    expect(evolution(l({ avant_cartes: 4 }), 'cartes', 2)).toBe(2);
    expect(evolution(l({ avant_cartes: 1 }), 'cartes', 3)).toBe(-2);
    expect(evolution(l({ avant_echanges: 5 }), 'echanges', 5)).toBe(0);
  });
  it('nouveau venu, ou pas encore de photo', () => {
    expect(evolution(l({ avant_cartes: null }), 'cartes', 7)).toBeNull();
    expect(evolution(l({ photo: false }), 'cartes', 7)).toBe(0);
  });
});
