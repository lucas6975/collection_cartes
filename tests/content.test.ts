import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards';
import { CATEGORIES } from '../src/content/categories';
import { ICONS } from '../src/components/ui/Icon';

describe('cartes', () => {
  it('identifiants et numéros uniques, numérotés de 1 à N', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    expect(CARDS.map((c) => c.numero).sort((a, b) => a - b)).toEqual(CARDS.map((_, i) => i + 1));
  });

  it('chaque famille classique contient toutes les raretés', () => {
    for (const cat of CATEGORIES.filter((c) => !c.speciale)) {
      const raretes = new Set(CARDS.filter((c) => c.categorie === cat.id).map((c) => c.rarete));
      expect([...raretes].sort()).toEqual([
        'commune',
        'epique',
        'legendaire',
        'peu-commune',
        'rare',
      ]);
    }
  });

  it('les 5 règles qui sauvent la vie et Ulysse sont légendaires', () => {
    const speciales = CARDS.filter((c) => c.categorie === 'lsr' || c.categorie === 'ulysse');
    expect(speciales.map((c) => c.numero)).toEqual([31, 32, 33, 34, 35, 36]);
    expect(speciales.every((c) => c.rarete === 'legendaire')).toBe(true);
    expect(CARDS.filter((c) => c.deblocage).map((c) => c.id)).toEqual(['ulysse']);
  });

  it('chaque carte cite au moins une source et a une icône connue', () => {
    for (const c of CARDS) {
      expect(c.sources.length).toBeGreaterThan(0);
      expect(ICONS[c.icone], c.icone).toBeDefined();
    }
  });
});
