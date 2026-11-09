import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/content/cards';
import { CATEGORIES } from '../src/content/categories';
import { ICONS } from '../src/components/ui/Icon';

describe('cartes', () => {
  it('identifiants et numéros uniques, numérotés de 1 à N', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    expect(CARDS.map((c) => c.numero).sort((a, b) => a - b)).toEqual(CARDS.map((_, i) => i + 1));
  });

  it('chaque famille contient toutes les raretés', () => {
    for (const cat of CATEGORIES) {
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

  it('chaque carte cite au moins une source et a une icône connue', () => {
    for (const c of CARDS) {
      expect(c.sources.length).toBeGreaterThan(0);
      expect(ICONS[c.icone], c.icone).toBeDefined();
    }
  });
});
