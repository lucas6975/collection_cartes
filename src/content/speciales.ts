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
    pouvoir:
      'Transforme n’importe quelle réunion en quart d’heure sécurité… et tout le monde dit merci.',
    faiblesse: 'Un EPI mal rangé à 10 mètres.',
    de: 'Lucas',
  },
];

export const estSpeciale = (id: string) => id.startsWith('special:');
export const speciale = (id: string) => SPECIALES.find((s) => s.id === id);
