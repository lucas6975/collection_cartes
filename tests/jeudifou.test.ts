import { describe, expect, it } from 'vitest';
import { duree, momentJeudiFou } from '../src/components/JeudiFou';

describe('bannière du Jeudi fou', () => {
  it('annonce la veille, puis s’affiche toute la journée', () => {
    expect(momentJeudiFou(new Date(2026, 10, 17, 23, 0))).toBeNull();
    expect(momentJeudiFou(new Date(2026, 10, 18, 9, 0))).toBe('annonce');
    expect(momentJeudiFou(new Date(2026, 10, 19, 0, 0))).toBe('pendant');
    expect(momentJeudiFou(new Date(2026, 10, 19, 23, 59))).toBe('pendant');
    expect(momentJeudiFou(new Date(2026, 10, 20, 0, 0))).toBeNull();
  });
  it('écrit le temps restant', () => {
    expect(duree(7 * 3600_000 + 5 * 60_000)).toBe('7 h 05');
    expect(duree(42 * 60_000)).toBe('42 min');
    expect(duree(10_000)).toBe('1 min');
  });
});
