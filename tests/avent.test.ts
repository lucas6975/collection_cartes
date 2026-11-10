import { describe, expect, it } from 'vitest';
import { ANNEE_AVENT, JOURS } from '../src/avent/jours';
import {
  caseDuJour,
  estOuverte,
  etoilesEssais,
  etoilesJour,
  etoilesScore,
  joursAvantDebut,
  melangerSansPointFixe,
} from '../src/avent/logic';

describe('ouverture des cases', () => {
  it('la case N s’ouvre le N décembre à minuit', () => {
    expect(estOuverte(2026, 5, new Date(2026, 11, 4, 23, 59))).toBe(false);
    expect(estOuverte(2026, 5, new Date(2026, 11, 5, 0, 0))).toBe(true);
    expect(estOuverte(2026, 1, new Date(2026, 10, 30))).toBe(false);
    expect(estOuverte(2026, 24, new Date(2027, 0, 3))).toBe(true);
  });

  it('identifie la case du jour et le compte à rebours', () => {
    expect(caseDuJour(2026, new Date(2026, 11, 12, 9))).toBe(12);
    expect(caseDuJour(2026, new Date(2026, 11, 26))).toBeNull();
    expect(caseDuJour(2026, new Date(2026, 10, 10))).toBeNull();
    expect(joursAvantDebut(2026, new Date(2026, 10, 10, 18))).toBe(21);
    expect(joursAvantDebut(2026, new Date(2026, 11, 3))).toBe(0);
  });
});

describe('étoiles', () => {
  it('récompensent la réussite du premier coup', () => {
    expect(etoilesEssais(1, false).etoiles).toBe(3);
    expect(etoilesEssais(3, false).etoiles).toBe(1);
    expect(etoilesEssais(6, false).etoiles).toBe(0);
    expect(etoilesEssais(1, true).etoiles).toBe(0);
    expect(etoilesScore(4, 4).etoiles).toBe(3);
    expect(etoilesScore(3, 5).etoiles).toBe(1);
    expect(
      etoilesJour([
        { etoiles: 3, resume: '' },
        { etoiles: 2, resume: '' },
      ]),
    ).toBe(3);
  });
});

describe('mélange', () => {
  it('ne laisse aucune étape à sa place', () => {
    const etapes = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (let g = 1; g < 100; g++) {
      const m = melangerSansPointFixe(etapes, g);
      expect([...m].sort()).toEqual(etapes);
      expect(m.some((x, i) => x === etapes[i])).toBe(false);
    }
  });
});

describe('contenu du calendrier', () => {
  it('contient les 24 jours de décembre', () => {
    expect(JOURS.map((j) => j.jour)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(ANNEE_AVENT).toBe(2026);
  });

  it('chaque jeu est cohérent', () => {
    for (const j of JOURS) {
      for (const jeu of j.jeux) {
        if (jeu.type === 'ordre') expect(new Set(jeu.etapes).size).toBe(jeu.etapes.length);
        if (jeu.type === 'quiz') {
          for (const q of jeu.questions) expect(q.bonne).toBeLessThan(q.choix.length);
        }
        if (jeu.type === 'association')
          expect(new Set(jeu.paires.map((p) => p.label)).size).toBe(jeu.paires.length);
        if (jeu.type === 'anomalies') {
          for (const a of jeu.anomalies) {
            for (const c of a.cibles) {
              expect(c.x).toBeGreaterThan(0);
              expect(c.x).toBeLessThan(100);
              expect(c.y).toBeGreaterThan(0);
              expect(c.y).toBeLessThan(100);
            }
          }
        }
        if (jeu.type === 'pendu') for (const m of jeu.mots) expect(m.mot).toMatch(/^[A-Z ]+$/);
      }
    }
  });
});
