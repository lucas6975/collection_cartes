import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards';
import {
  CASES,
  angleFinal,
  carteGagnee,
  choixJoker,
  momentRoue,
  tirerCase,
} from '../src/domain/roue';
import { compteARebours, FLOUS, INDICE_DU_JOUR, INDICES } from '../src/components/roue/RoueAccueil';
import type { Progress } from '../src/domain/types';

const p = (ids: string[]): Progress => ({
  userId: 'u',
  packs: [],
  cards: ids.map((cardId) => ({ cardId, count: 1, firstAt: '' })),
});

describe('Roue de Secours', () => {
  it('teaser du 20 au 23, roue le 24 seulement', () => {
    expect(momentRoue(new Date(2026, 10, 19, 23, 59))).toBeNull();
    expect(momentRoue(new Date(2026, 10, 20, 0, 1))).toEqual({ type: 'teaser', jour: 0 });
    expect(momentRoue(new Date(2026, 10, 23, 22))).toEqual({ type: 'teaser', jour: 3 });
    expect(momentRoue(new Date(2026, 10, 24, 0, 1))).toEqual({ type: 'jour' });
    expect(momentRoue(new Date(2026, 10, 25, 9))).toBeNull();
    expect(FLOUS).toHaveLength(4);
    expect(INDICES).toHaveLength(2);
    expect(INDICE_DU_JOUR).toEqual([0, 0, 0, 1]);
  });

  it('les chances font 100 et respectent les poids', () => {
    expect(CASES.reduce((s, c) => s + c.poids, 0)).toBe(100);
    const n = Array(CASES.length).fill(0);
    for (let i = 0; i < 10000; i++) n[tirerCase((i + 0.5) / 10000)]++;
    CASES.forEach((c, i) => expect(n[i]).toBe(c.poids * 100));
  });

  it('LSR : donne une LSR manquante, sinon une légendaire', () => {
    const lsr = CARDS.filter((c) => c.categorie === 'lsr');
    const c = carteGagnee('lsr', p(lsr.slice(0, 4).map((x) => x.id)), CARDS, 0.3)!;
    expect(c.id).toBe(lsr[4].id);
    const tout = carteGagnee('lsr', p(lsr.map((x) => x.id)), CARDS, 0.3)!;
    expect(tout.rarete).toBe('legendaire');
  });

  it('carte qui manque, joker et légendaire ne donnent jamais la carte secrète', () => {
    const possedees = CARDS.filter((c) => !c.deblocage)
      .slice(0, 20)
      .map((c) => c.id);
    for (let x = 0; x < 1; x += 0.05) {
      const m = carteGagnee('manquante', p(possedees), CARDS, x)!;
      expect(possedees).not.toContain(m.id);
      expect(m.deblocage).toBeUndefined();
      expect(carteGagnee('legendaire', p(possedees), CARDS, x)!.rarete).toBe('legendaire');
    }
    expect(
      choixJoker(p(possedees), CARDS).every((c) => !possedees.includes(c.id) && !c.deblocage),
    ).toBe(true);
    expect(carteGagnee('or', p([]), CARDS)).toBeNull();
  });

  it('la roue s’arrête au milieu de la case gagnée', () => {
    for (let i = 0; i < CASES.length; i++)
      expect(((angleFinal(i) % 360) + 360) % 360).toBe((360 - i * 60) % 360);
  });

  it('compte à rebours', () => {
    expect(compteARebours(((4 * 24 + 13) * 3600 + 5 * 60 + 9) * 1000)).toEqual({
      j: 4,
      h: '13',
      m: '05',
      s: '09',
    });
  });
});
