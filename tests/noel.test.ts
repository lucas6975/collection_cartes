import { describe, expect, it } from 'vitest';
import { periodeNoel } from '../src/data/noel';

describe('thème de Noël', () => {
  it('actif du 1er décembre au 3 janvier inclus', () => {
    expect(periodeNoel(new Date(2026, 10, 30, 23, 59))).toBe(false);
    expect(periodeNoel(new Date(2026, 11, 1, 0, 1))).toBe(true);
    expect(periodeNoel(new Date(2027, 0, 3, 22))).toBe(true);
    expect(periodeNoel(new Date(2027, 0, 4, 6))).toBe(false);
  });
});
