import { describe, expect, it } from 'vitest';
import { entonnoir } from '../src/data/visites';

const v = {
  debut: '2026-11-17T06:00:00.000Z',
  lien: 41,
  ios: 24,
  android: 15,
  ordi: 2,
  appli: 18,
  rappels: 10,
};

describe('Du lien à l’inscription', () => {
  it('ne compte que les inscrits arrivés depuis le début du compteur', () => {
    const avant = Array(13).fill('2026-11-16T09:00:00.000Z');
    const apres = Array(13).fill('2026-11-17T09:00:00.000Z');
    const e = entonnoir(v, [...avant, ...apres]);
    expect(e.map((x) => x.n)).toEqual([41, 18, 13, 10]);
  });

  it('calcule les parts et les pertes entre étapes', () => {
    const e = entonnoir(v, Array(13).fill('2026-11-17T09:00:00.000Z'));
    expect(e.map((x) => x.part)).toEqual([100, 44, 32, 24]);
    expect(e.map((x) => x.perdus)).toEqual([23, 5, 0, 0]);
  });

  it('reste à zéro tant que le compteur n’a pas démarré', () => {
    const e = entonnoir({ ...v, debut: null, lien: 0, appli: 0, rappels: 0 }, [
      '2026-11-16T09:00:00.000Z',
    ]);
    expect(e.every((x) => x.n === 0 && x.part === 0)).toBe(true);
  });
});
