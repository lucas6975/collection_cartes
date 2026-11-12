// Ulysse qui parle : bulles pendant l'ouverture des packs et après un échange. L'annonce
// d'ouverture du pack est aussi dite à voix haute (public/voix). Un seul lecteur audio est
// réutilisé : sur iPhone, une fois débloqué par un appui sur l'écran, il peut rejouer ensuite.

import { useSyncExternalStore } from 'react';
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

/** Répliques dites à voix haute (public/voix/<réplique>.mp3) ; les autres sont seulement écrites. */
const VOCALES = new Set<Replique>(['ouverture']);

/** Réplique d'Ulysse quand une carte est retournée. */
export function repliqueCarte(rarete: Rarity, nouvelle: boolean): Replique {
  if (rarete === 'legendaire' || rarete === 'epique') return rarete;
  if (!nouvelle) return 'doublon';
  return rarete === 'rare' ? 'rare' : 'nouvelle';
}

const KEY = 'team-ulysse-voix';

function charger(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'muet';
  } catch {
    return true;
  }
}

let active = charger();
const listeners = new Set<() => void>();
let lecteur: HTMLAudioElement | null = null;
let compteur = 0;

export const voixStore = {
  get: () => active,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  basculer() {
    active = !active;
    try {
      localStorage.setItem(KEY, active ? 'oui' : 'muet');
    } catch {
      // Choix valable pour la visite.
    }
    if (!active) lecteur?.pause();
    listeners.forEach((l) => l());
  },
  /**
   * Renvoie le texte à afficher dans la bulle d'Ulysse. Seules les répliques enregistrées
   * (VOCALES) sont aussi dites à voix haute, si le son est activé.
   */
  dire(r: Replique): { texte: string; vocale: boolean } {
    const variantes = REPLIQUES[r];
    const i = compteur++ % variantes.length;
    const vocale = active && VOCALES.has(r) && typeof Audio !== 'undefined';
    if (vocale) {
      try {
        lecteur ??= new Audio();
        lecteur.pause();
        lecteur.src = `${import.meta.env.BASE_URL}voix/${r}.mp3`;
        void lecteur.play().catch(() => undefined);
      } catch {
        // Son indisponible : la bulle suffit.
      }
    }
    return { texte: variantes[i], vocale };
  },
};

export function useVoix() {
  return useSyncExternalStore(voixStore.subscribe, voixStore.get);
}
