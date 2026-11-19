import { describe, expect, it } from 'vitest';
import { vigilanceVisible } from '../src/components/VigilancePartagee';

describe('encadré vigilance partagée', () => {
  it('s’affiche jusqu’au 30 novembre, sauf le jour où on l’a caché', () => {
    expect(vigilanceVisible(new Date(2026, 10, 20, 9), null)).toBe(true);
    expect(vigilanceVisible(new Date(2026, 10, 20, 9), '2026-11-20')).toBe(false);
    expect(vigilanceVisible(new Date(2026, 10, 21, 9), '2026-11-20')).toBe(true);
    expect(vigilanceVisible(new Date(2026, 10, 30, 23), null)).toBe(true);
    expect(vigilanceVisible(new Date(2026, 11, 1, 8), null)).toBe(false);
  });
});
