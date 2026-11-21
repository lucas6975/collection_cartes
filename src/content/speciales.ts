// Cartes spéciales : exemplaires uniques, offerts par l'administrateur (jamais dans un pack).

export interface CarteSpecialeDef {
  id: string;
  titre: string;
  emoji: string;
  pouvoir: string;
  faiblesse: string;
  de: string;
}

export const SPECIALES: CarteSpecialeDef[] = [
  {
    id: 'special:best-rgep',
    titre: 'La best RGEP',
    emoji: '👑',
    pouvoir: 'Fait passer la sécurité avant tout !',
    faiblesse: 'Aucune connue à ce jour.',
    de: 'Lucas',
  },
];

export const estSpeciale = (id: string) => id.startsWith('special:');
export const speciale = (id: string) => SPECIALES.find((s) => s.id === id);
