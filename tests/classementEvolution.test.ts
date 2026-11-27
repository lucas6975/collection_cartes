import { describe, expect, it } from 'vitest';
import { evolution, majRangs } from '../src/data/classement';

describe('montées et descentes du classement', () => {
  it('le premier jour, pas de flèche', () => {
    const s = majRangs({ ref: null, dernier: null }, '2026-11-27', { a: 1, b: 2 });
    expect(evolution(s.ref, 'a', 1)).toBe(0);
  });
  it('compare à la veille, même après plusieurs passages dans la journée', () => {
    let s = majRangs({ ref: null, dernier: null }, '2026-11-27', { a: 1, b: 2, c: 3 });
    s = majRangs(s, '2026-11-28', { a: 3, b: 1, c: 2 });
    s = majRangs(s, '2026-11-28', { a: 3, b: 1, c: 2 });
    expect(evolution(s.ref, 'b', 1)).toBe(1); // monte d'une place
    expect(evolution(s.ref, 'a', 3)).toBe(-2); // descend de deux places
    expect(evolution(s.ref, 'd', 4)).toBeNull(); // nouveau
  });
});
