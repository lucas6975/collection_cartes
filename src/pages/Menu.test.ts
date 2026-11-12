import { describe, expect, it } from 'vitest';
import { salut, sousTitre } from './Menu';

const a = (h: number, m = 0) => new Date(2026, 10, 12, h, m);

describe('salut d’Ulysse', () => {
  it('change selon l’heure', () => {
    expect(salut(a(8), 'Léa')).toBe('Bonjour Léa ! ☀️');
    expect(salut(a(12), 'Léa')).toBe('Bon appétit Léa ! 🍽️');
    expect(salut(a(15), 'Léa')).toBe('Bon après-midi Léa ! 😎');
    expect(salut(a(20), 'Léa')).toBe('Bonsoir Léa ! 🌙');
    expect(salut(a(23, 30), 'Léa')).toBe('Encore debout Léa ? 🦉');
    expect(salut(a(3))).toBe('Encore debout ? 🦉');
  });
  it('dit ce qui attend la personne', () => {
    expect(sousTitre({ packOuvert: false, caseDuJour: false, caseFaite: false })).toMatch(/pack/);
    expect(sousTitre({ packOuvert: true, caseDuJour: true, caseFaite: false })).toMatch(/case/);
    expect(sousTitre({ packOuvert: true, caseDuJour: false, caseFaite: false })).toMatch(/demain/);
  });
});
