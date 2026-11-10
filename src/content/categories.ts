import type { CategoryId, Rarity } from '../domain/types';

export interface CategoryMeta {
  id: CategoryId;
  nom: string;
  court: string;
  description: string;
  icone: string;
  /** Couleur d'accent de la famille (doit correspondre au token CSS --color-cat-*). */
  couleur: string;
  /** Teinte claire pour les fonds. */
  fond: string;
  /** Famille spéciale, composée uniquement de cartes légendaires. */
  speciale?: boolean;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'incendie',
    nom: 'Sécurité incendie',
    court: 'Incendie',
    description: 'Prévenir, alerter, éteindre un début de feu et évacuer.',
    icone: 'Flame',
    couleur: '#D9542B',
    fond: '#FCEFEA',
  },
  {
    id: 'epi',
    nom: 'Équipements de protection',
    court: 'EPI',
    description: 'Choisir, porter et entretenir ses équipements de protection individuelle.',
    icone: 'HardHat',
    couleur: '#2563A6',
    fond: '#EAF2FA',
  },
  {
    id: 'risques',
    nom: 'Prévention des risques',
    court: 'Risques',
    description: 'Risques électriques, chimiques, mécaniques et chutes.',
    icone: 'TriangleAlert',
    couleur: '#B7791F',
    fond: '#FBF3E4',
  },
  {
    id: 'postures',
    nom: 'Gestes et postures',
    court: 'Postures',
    description: 'Ergonomie, port de charges et prévention des TMS.',
    icone: 'PersonStanding',
    couleur: '#13896F',
    fond: '#E6F4F0',
  },
  {
    id: 'organisation',
    nom: 'Organisation et procédures',
    court: 'Procédures',
    description: 'Signalisation, urgences, circulation et premiers secours.',
    icone: 'ClipboardCheck',
    couleur: '#6A4FB3',
    fond: '#F0ECF9',
  },
  {
    id: 'lsr',
    nom: 'Règles qui sauvent la vie',
    court: 'LSR IMECA',
    description: 'Les 5 Life Saving Rules d’IMECA : réunis-les toutes pour débloquer Ulysse.',
    icone: 'Star',
    couleur: '#1A2BA0',
    fond: '#EBEDFA',
    speciale: true,
  },
  {
    id: 'ulysse',
    nom: 'Team Ulysse',
    court: 'Team Ulysse',
    description: 'La carte secrète de la mascotte, débloquée avec les 5 règles qui sauvent la vie.',
    icone: 'HardHat',
    couleur: '#B07A0E',
    fond: '#FFF6D8',
    speciale: true,
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  CategoryMeta
>;

export const RARITIES: { id: Rarity; nom: string; rang: number }[] = [
  { id: 'commune', nom: 'Commune', rang: 1 },
  { id: 'peu-commune', nom: 'Peu commune', rang: 2 },
  { id: 'rare', nom: 'Rare', rang: 3 },
  { id: 'epique', nom: 'Épique', rang: 4 },
  { id: 'legendaire', nom: 'Légendaire', rang: 5 },
];

export const RARITY_BY_ID = Object.fromEntries(RARITIES.map((r) => [r.id, r])) as Record<
  Rarity,
  (typeof RARITIES)[number]
>;

export const NATURE_LABEL = {
  obligation: 'Obligation réglementaire',
  norme: 'Norme technique',
  recommandation: 'Recommandation de prévention',
  'pratique-interne': 'Pratique interne',
} as const;
