// Ulysse commente l'ouverture des packs et les échanges dans une bulle (texte seulement).

import type { Rarity } from '../domain/types';

export type Replique =
  | 'ouverture'
  | 'legendaire'
  | 'epique'
  | 'rare'
  | 'nouvelle'
  | 'doublon'
  | 'secrete'
  | 'perso'
  | 'echange';

/** Variantes enregistrées et texte affiché dans la bulle d'Ulysse. */
const REPLIQUES: Record<Replique, string[]> = {
  ouverture: ['C’est parti, on ouvre ce pack !'],
  legendaire: ['Waouh ! Une légendaire !', 'Incroyable ! Une carte légendaire !'],
  epique: ['Ouah, une épique ! Superbe !', 'Une carte épique, quelle chance !'],
  rare: ['Oh, une rare ! Joli !', 'Une carte rare, bien vu !'],
  nouvelle: [
    'Une nouvelle carte, bien joué !',
    'Nouvelle carte pour ta collection !',
    'Celle-là, tu ne l’avais pas !',
  ],
  doublon: [
    'Encore un doublon…',
    'Oh, un doublon. Tu pourras l’échanger !',
    'Tiens, tu l’as déjà, celle-là.',
  ],
  secrete: ['Incroyable ! Les 5 règles sont réunies. Je rejoins ta collection !'],
  perso: ['Et voici ta carte rien qu’à toi. Bienvenue dans la Team Ulysse !'],
  echange: ['Échange réussi ! Félicitations !'],
};

/** Réplique d'Ulysse quand une carte est retournée. */
export function repliqueCarte(rarete: Rarity, nouvelle: boolean): Replique {
  if (rarete === 'legendaire' || rarete === 'epique') return rarete;
  if (!nouvelle) return 'doublon';
  return rarete === 'rare' ? 'rare' : 'nouvelle';
}

let compteur = 0;

/** Texte à afficher dans la bulle d'Ulysse (les variantes alternent). */
export function replique(r: Replique): string {
  const variantes = REPLIQUES[r];
  return variantes[compteur++ % variantes.length];
}
