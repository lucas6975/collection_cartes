// Modèle de données. Le schéma SQL (supabase/migrations) en est la traduction côté serveur.

export type CategoryId =
  'incendie' | 'epi' | 'risques' | 'postures' | 'organisation' | 'lsr' | 'ulysse';

export type Rarity = 'commune' | 'peu-commune' | 'rare' | 'epique' | 'legendaire';

/**
 * Nature d'une information : on ne présente jamais une recommandation comme une obligation.
 * - obligation : imposée par un texte réglementaire (Code du travail…).
 * - norme : issue d'une norme technique (NF, EN, ISO).
 * - recommandation : recommandation de prévention (INRS, Assurance Maladie…).
 * - pratique-interne : règle propre à l'entreprise.
 */
export type Nature = 'obligation' | 'norme' | 'recommandation' | 'pratique-interne';

export interface Source {
  label: string;
  url?: string;
}

export interface Verification {
  statut: 'a-verifier' | 'valide';
  /** Date ISO (AAAA-MM-JJ) de la dernière vérification. */
  date: string | null;
  par: string | null;
}

export interface Card {
  id: string;
  numero: number;
  nom: string;
  categorie: CategoryId;
  rarete: Rarity;
  /** Nom d'icône (voir components/ui/Icon) utilisé pour l'illustration. */
  icone: string;
  /** Illustration personnalisée (URL), prioritaire sur l'icône. */
  image?: string;
  /** Illustration spéciale : une règle qui sauve la vie (gros chiffre) ou la mascotte. */
  art?: { type: 'lsr'; chiffre: number; couleur: string } | { type: 'mascotte' };
  /** Carte qui ne sort jamais d'un pack : elle se débloque en réunissant toutes les LSR. */
  deblocage?: 'toutes-les-lsr';
  description: string;
  info: string;
  leSavaisTu: string;
  aRetenir: string;
  nature: Nature;
  sources: Source[];
  verification: Verification;
}

export interface User {
  id: string;
  prenom: string;
  nom: string;
  equipe: string;
  service: string;
  actif: boolean;
}

export interface OwnedCard {
  cardId: string;
  /** Nombre d'exemplaires obtenus (les doublons sont comptés). */
  count: number;
  firstAt: string;
}

export interface PackOpening {
  /** Jour (AAAA-MM-JJ) du pack. */
  jour: string;
  at: string;
  cardIds: string[];
  bonus: boolean;
}

export interface Progress {
  userId: string;
  cards: OwnedCard[];
  packs: PackOpening[];
  /** Date de réception de la carte personnelle (offerte une seule fois, dans un pack). */
  cartePerso?: string;
}
