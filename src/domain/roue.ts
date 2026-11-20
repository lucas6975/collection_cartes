// La Roue de Secours d'Ulysse : un tour par personne, le lundi 23 novembre 2026.
// Teaser sur l'accueil à partir du 20 novembre. Fonctions pures, testées.
import { jourDe } from './packs';
import type { Card, Progress } from './types';

export const JOUR_ROUE = '2026-11-23';
export const DEBUT_TEASER = '2026-11-20';

export type Gain = 'or' | 'joker' | 'lsr' | 'legendaire' | 'manquante' | 'pack';

/** Les 6 cases, dans l'ordre de la roue (la première en haut), avec leurs chances (total 100). */
export const CASES: { id: Gain; emoji: string; label: string; poids: number; couleur: string }[] = [
  { id: 'or', emoji: '👑', label: 'Ulysse en Or', poids: 10, couleur: '#C8283A' },
  { id: 'joker', emoji: '🃏', label: 'Le Joker', poids: 20, couleur: '#F8FAFC' },
  { id: 'lsr', emoji: '🦺', label: 'LSR qui te manque', poids: 15, couleur: '#16A34A' },
  { id: 'pack', emoji: '🎁', label: 'Pack bonus', poids: 15, couleur: '#F5C542' },
  { id: 'manquante', emoji: '🔍', label: 'Carte qui te manque', poids: 25, couleur: '#1F5AA6' },
  { id: 'legendaire', emoji: '⚡', label: 'Légendaire garantie', poids: 15, couleur: '#7C3AED' },
];

export type MomentRoue = { type: 'teaser'; jour: number } | { type: 'jour' } | null;

/** Teaser du 20 au 22 novembre (jour 0 à 2), puis la roue le 23. */
export function momentRoue(now: Date): MomentRoue {
  const j = jourDe(now);
  if (j === JOUR_ROUE) return { type: 'jour' };
  if (j >= DEBUT_TEASER && j < JOUR_ROUE) {
    const [a, m, d] = DEBUT_TEASER.split('-').map(Number);
    const debut = new Date(a, m - 1, d).getTime();
    const jour = Math.round(
      (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - debut) / 86_400_000,
    );
    return { type: 'teaser', jour };
  }
  return null;
}

export function tirerCase(x = Math.random()): number {
  let reste = x * 100;
  for (let i = 0; i < CASES.length; i++) {
    reste -= CASES[i].poids;
    if (reste < 0) return i;
  }
  return CASES.length - 1;
}

const pickAu = <T>(l: T[], x: number) => l[Math.floor(x * l.length) % l.length];

/** Carte gagnée pour les cases qui donnent une carte (null pour or, joker, pack). */
export function carteGagnee(
  gain: Gain,
  p: Progress,
  cards: Card[],
  x = Math.random(),
): Card | null {
  const possedees = new Set(p.cards.map((c) => c.cardId));
  const jouables = cards.filter((c) => !c.deblocage);
  const legendaires = jouables.filter((c) => c.rarete === 'legendaire');
  const legendaireManquante = () => {
    const m = legendaires.filter((c) => !possedees.has(c.id));
    return pickAu(m.length ? m : legendaires, x);
  };
  if (gain === 'lsr') {
    const m = jouables.filter((c) => c.categorie === 'lsr' && !possedees.has(c.id));
    return m.length ? pickAu(m, x) : legendaireManquante();
  }
  if (gain === 'legendaire') return legendaireManquante();
  if (gain === 'manquante') {
    const m = jouables.filter((c) => !possedees.has(c.id));
    return m.length ? pickAu(m, x) : legendaireManquante();
  }
  return null;
}

/** Cartes proposées au Joker : toutes celles qui manquent (ou toutes, si la collection est complète). */
export function choixJoker(p: Progress, cards: Card[]): Card[] {
  const possedees = new Set(p.cards.map((c) => c.cardId));
  const jouables = cards.filter((c) => !c.deblocage);
  const m = jouables.filter((c) => !possedees.has(c.id));
  return m.length ? m : jouables;
}

/** Angle final de la roue (degrés) pour s'arrêter au milieu de la case i, après plusieurs tours. */
export const angleFinal = (i: number, decalage = 0) =>
  360 * 6 - i * (360 / CASES.length) + decalage;
