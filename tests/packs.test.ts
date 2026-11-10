import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards';
import {
  CARTES_PAR_PACK,
  PackIndisponible,
  carteADebloquer,
  PROBABILITES,
  PROBABILITES_GARANTIE,
  ouvrirPack,
  packDuJourOuvert,
  progressionVide,
  serie,
  tirerPack,
} from '../src/domain/packs';

const now = new Date(2026, 10, 9, 10, 0);
const RANG = { commune: 1, 'peu-commune': 2, rare: 3, epique: 4, legendaire: 5 } as const;

describe('tirage', () => {
  it('les tables de probabilités totalisent 100', () => {
    expect(Object.values(PROBABILITES).reduce((a, b) => a + b)).toBe(100);
    expect(Object.values(PROBABILITES_GARANTIE).reduce((a, b) => a + b)).toBe(100);
  });

  it('un pack contient 5 cartes, dont au moins une peu commune ou mieux', () => {
    for (let seed = 1; seed < 500; seed++) {
      const pack = tirerPack(CARDS, seed);
      expect(pack).toHaveLength(CARTES_PAR_PACK);
      expect(Math.max(...pack.map((c) => RANG[c.rarete]))).toBeGreaterThanOrEqual(2);
    }
  });

  it('est déterministe pour une même graine', () => {
    expect(tirerPack(CARDS, 42).map((c) => c.id)).toEqual(tirerPack(CARDS, 42).map((c) => c.id));
  });

  it('respecte approximativement les probabilités', () => {
    const counts: Record<string, number> = {};
    const N = 4000;
    for (let seed = 1; seed <= N; seed++) {
      // Les 4 premiers emplacements suivent la table normale.
      for (const c of tirerPack(CARDS, seed * 7919).slice(0, 4))
        counts[c.rarete] = (counts[c.rarete] ?? 0) + 1;
    }
    // Tri du pack : les 4 premières sont les moins rares, donc on vérifie seulement des bornes larges.
    expect(counts.commune / (N * 4)).toBeGreaterThan(0.4);
    expect((counts.legendaire ?? 0) / (N * 4)).toBeLessThan(0.07);
  });

  it('ne tire jamais Ulysse, qui se débloque autrement', () => {
    for (let seed = 1; seed < 3000; seed++)
      expect(tirerPack(CARDS, seed).some((c) => c.id === 'ulysse')).toBe(false);
  });
});

describe('pack du jour', () => {
  it('ne peut être ouvert qu’une fois par jour, et les packs bonus restent possibles', () => {
    const a = ouvrirPack(CARDS, progressionVide('u'), now);
    expect(packDuJourOuvert(a.progress, now)).toBe(true);
    expect(() => ouvrirPack(CARDS, a.progress, now)).toThrow(PackIndisponible);
    const b = ouvrirPack(CARDS, a.progress, now, true);
    expect(b.progress.packs).toHaveLength(2);
  });

  it('a un contenu fixe pour un joueur et un jour donnés', () => {
    const a = ouvrirPack(CARDS, progressionVide('u'), now);
    const b = ouvrirPack(CARDS, progressionVide('u'), new Date(2026, 10, 9, 18, 30));
    expect(a.cards.map((c) => c.id)).toEqual(b.cards.map((c) => c.id));
  });

  it('compte les doublons sans les ajouter deux fois à la collection', () => {
    let p = progressionVide('u');
    let exemplaires = 0;
    for (let d = 0; d < 20; d++) {
      p = ouvrirPack(CARDS, p, new Date(2026, 9, 1 + d, 9)).progress;
      exemplaires += CARTES_PAR_PACK;
    }
    expect(new Set(p.cards.map((c) => c.cardId)).size).toBe(p.cards.length);
    expect(p.cards.reduce((s, c) => s + c.count, 0)).toBe(exemplaires);
  });

  it('débloque Ulysse quand les 5 règles qui sauvent la vie sont réunies', () => {
    const lsr = CARDS.filter((c) => c.categorie === 'lsr').map((c) => c.id);
    expect(carteADebloquer(CARDS, new Set(lsr.slice(0, 4)))).toBeNull();
    expect(carteADebloquer(CARDS, new Set(lsr))?.id).toBe('ulysse');
    expect(carteADebloquer(CARDS, new Set([...lsr, 'ulysse']))).toBeNull();

    // Ouverture d'un pack : il manque une seule LSR, que le pack apporte.
    const manquante = lsr[4];
    const cartes = lsr.slice(0, 4).map((id) => ({ cardId: id, count: 1, firstAt: '' }));
    let d = 0;
    let res;
    do {
      const p = { ...progressionVide(`u${d}`), cards: cartes };
      res = ouvrirPack(CARDS, p, new Date(2026, 10, 9, 9));
      d++;
    } while (!res.cards.some((c) => c.id === manquante) && d < 5000);
    expect(res.debloquee?.id).toBe('ulysse');
    expect(res.progress.cards.some((c) => c.cardId === 'ulysse')).toBe(true);
  });

  it('calcule la série de jours consécutifs', () => {
    let p = progressionVide('u');
    for (const d of [5, 6, 7, 8]) p = ouvrirPack(CARDS, p, new Date(2026, 10, d, 9)).progress;
    expect(serie(p, now)).toBe(4); // jusqu'à hier (le 8), aujourd'hui pas encore ouvert
    p = ouvrirPack(CARDS, p, now).progress;
    expect(serie(p, now)).toBe(5);
    expect(serie(p, new Date(2026, 10, 12, 9))).toBe(0);
  });
});
