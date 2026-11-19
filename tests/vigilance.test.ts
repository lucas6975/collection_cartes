import { describe, expect, it } from 'vitest';
import { vigilanceVisible } from '../src/components/VigilancePartagee';

describe('encadré vigilance partagée', () => {
  it('ne s’affiche que le vendredi 20 novembre', () => {
    expect(vigilanceVisible(new Date(2026, 10, 19, 18), null)).toBe(false);
    expect(vigilanceVisible(new Date(2026, 10, 20, 0, 5), null)).toBe(true);
    expect(vigilanceVisible(new Date(2026, 10, 20, 23, 55), null)).toBe(true);
    expect(vigilanceVisible(new Date(2026, 10, 21, 9), null)).toBe(false);
  });
  it('disparaît pour de bon après « Plus tard »', () => {
    expect(vigilanceVisible(new Date(2026, 10, 20, 9), '1')).toBe(false);
  });
});
