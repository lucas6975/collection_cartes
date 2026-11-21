import { describe, expect, it } from 'vitest';
import { THEME_NOEL, joursAvantNoel, periodeNoel, themeNoel } from '../src/data/noel';

describe('thème de Noël', () => {
  it('actif du 1er décembre au 3 janvier inclus', () => {
    expect(periodeNoel(new Date(2026, 10, 30, 23, 59))).toBe(false);
    expect(periodeNoel(new Date(2026, 11, 1, 0, 1))).toBe(true);
    expect(periodeNoel(new Date(2027, 0, 3, 22))).toBe(true);
    expect(periodeNoel(new Date(2027, 0, 4, 6))).toBe(false);
  });
  it("l'aperçu ne s'applique qu'à l'administrateur", () => {
    const nov = new Date(2026, 10, 21);
    expect(themeNoel(nov, 'nuit', true)).toBe('nuit');
    expect(themeNoel(nov, 'nuit', false)).toBeNull();
    expect(themeNoel(nov, null, true)).toBeNull();
    expect(themeNoel(new Date(2026, 11, 2), null, false)).toBe(THEME_NOEL);
  });
  it('compte les jours avant Noël', () => {
    expect(joursAvantNoel(new Date(2026, 11, 1, 18))).toBe(24);
    expect(joursAvantNoel(new Date(2026, 11, 25))).toBe(0);
  });
});
