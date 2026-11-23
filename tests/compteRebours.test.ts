import { describe, expect, it } from 'vitest';
import { MESSAGES_COMPTE, etapeCompteARebours, tailleUlysse } from '../src/domain/compteRebours';

describe('compte à rebours avant le calendrier', () => {
  it('J-7 le 24 novembre dès minuit, jusqu’au jour J le 1er décembre', () => {
    expect(etapeCompteARebours(new Date(2026, 10, 23, 23, 59))).toBeNull();
    expect(etapeCompteARebours(new Date(2026, 10, 24, 0, 0))).toBe(7);
    expect(etapeCompteARebours(new Date(2026, 10, 26, 9))).toBe(5);
    expect(etapeCompteARebours(new Date(2026, 10, 30, 23, 59))).toBe(1);
    expect(etapeCompteARebours(new Date(2026, 11, 1, 0, 0))).toBe(0);
    expect(etapeCompteARebours(new Date(2026, 11, 2, 8))).toBeNull();
  });
  it('un message pour chaque jour, et Ulysse grandit en s’approchant', () => {
    for (let n = 0; n <= 7; n++) expect(MESSAGES_COMPTE[n].titre).toBeTruthy();
    expect(tailleUlysse(7)).toBeLessThan(tailleUlysse(1));
    expect(tailleUlysse(0)).toBe(1);
  });
});
