// Animation du compte à rebours avant le calendrier de l'Avent (J-7 → J-1, puis le jour J).
// Jouée une fois par jour, à la première ouverture de l'appli après minuit.
import { ANNEE_AVENT } from '../avent/jours';
import { joursAvantDebut } from '../avent/logic';

/** Messages du jour, de J-7 à J-1, puis 0 = jour J (1er décembre). */
export const MESSAGES_COMPTE: Record<number, { titre: string; texte: string }> = {
  7: {
    titre: 'Ulysse s’est mis en route 🏃',
    texte: 'Le calendrier de l’Avent ouvre le mardi 1er décembre.',
  },
  6: {
    titre: 'Il accélère ! 🎁',
    texte: 'Chaque jour de décembre, un tirage au sort avec des cadeaux.',
  },
  5: { titre: 'Mi-parcours… ⚡', texte: 'Et aujourd’hui, c’est le JEUDI FOU : légendaires ×3 !' },
  4: {
    titre: 'Plus que 4 jours ! 🔥',
    texte: 'En attendant, ouvre ton pack et complète ta collection.',
  },
  3: { titre: 'Il aperçoit le calendrier 👀', texte: 'Plus que 3 jours avant la première case.' },
  2: { titre: 'Dernière ligne droite ! 🎄', texte: 'Après-demain, la case n°1 s’ouvre.' },
  1: { titre: 'C’est demain ! ⏰', texte: 'La case n°1 s’ouvre demain matin, dès 7 h 30.' },
  0: { titre: 'C’est parti ! 🎄', texte: 'La case n°1 du calendrier de l’Avent est ouverte.' },
};

/** Étape du compte à rebours aujourd'hui (7 à 1, 0 le 1er décembre), sinon null. */
export function etapeCompteARebours(now: Date): number | null {
  if (now.getFullYear() !== ANNEE_AVENT) return null;
  if (now.getMonth() === 11) return now.getDate() === 1 ? 0 : null;
  const n = joursAvantDebut(ANNEE_AVENT, now);
  return n >= 1 && n <= 7 ? n : null;
}

/** Date locale « 2026-11-24 » : sert à ne jouer l'animation qu'une fois par jour. */
export const jourLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Taille d'Ulysse : il se rapproche du calendrier chaque jour (0,45 à J-7 → 1 le jour J). */
export const tailleUlysse = (n: number) => 0.45 + ((7 - Math.min(7, Math.max(0, n))) / 7) * 0.55;
