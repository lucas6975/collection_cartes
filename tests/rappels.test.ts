import { describe, expect, it } from 'vitest';
import { choisirRappel, momentParis } from '../supabase/functions/envoyer-rappels/rappel';

// Heures UTC auxquelles la tâche programmée appelle la fonction : 5 h 30, 6 h 30, 7 h 30.
const appels = (annee: number, mois: number, jour: number) =>
  [5, 6, 7].map((h) =>
    choisirRappel(momentParis(new Date(Date.UTC(annee, mois - 1, jour, h, 30)))),
  );

describe('rappels', () => {
  it('en décembre (heure d’hiver) : la case à 7 h 30 puis le pack à 8 h 30, heure de Paris', () => {
    const [a, b, c] = appels(2026, 12, 8); // mardi
    expect(a).toBeNull(); // 6 h 30 à Paris
    expect(b?.type).toBe('avent');
    expect(b?.title).toContain('8 décembre');
    expect(b?.url).toBe('./#/avent/8');
    expect(c?.type).toBe('pack');
    expect(c?.url).toBe('./#/cartes');
  });

  it('le 1er décembre et la scène choc du 17', () => {
    expect(appels(2026, 12, 1)[1]?.title).toContain('1er décembre');
    expect(appels(2026, 12, 17)[1]?.title).toContain('scène choc');
  });

  it('rien le week-end, pas de case hors décembre ni après le 24', () => {
    expect(appels(2026, 12, 5).every((r) => r === null)).toBe(true); // samedi
    expect(appels(2026, 12, 6).every((r) => r === null)).toBe(true); // dimanche
    expect(appels(2026, 12, 28).map((r) => r?.type)).toEqual([undefined, undefined, 'pack']);
    expect(appels(2027, 1, 12).map((r) => r?.type)).toEqual([undefined, undefined, 'pack']);
  });

  it('l’heure d’été décale l’appel mais le pack part toujours à 8 h 30 à Paris', () => {
    // Mardi 9 juin 2026 : Paris = UTC+2, donc 6 h 30 UTC = 8 h 30 à Paris.
    // Le dernier appel tombe à 9 h 30 : en dehors du créneau, rien n'est envoyé.
    expect(appels(2026, 6, 9).map((r) => r?.type)).toEqual([undefined, 'pack', undefined]);
  });
});
