// Modèle de données de l'application. Ces types servent aussi de référence au schéma SQL
// (supabase/migrations), qui en est la traduction côté base de données.

export type CategoryId = 'incendie' | 'epi' | 'risques' | 'postures' | 'organisation';

export type Rarity = 'commune' | 'peu-commune' | 'rare' | 'epique' | 'legendaire';

/**
 * Nature d'une information. On ne présente jamais une recommandation comme une obligation.
 * - obligation : imposée par un texte réglementaire (Code du travail...).
 * - norme : issue d'une norme technique (NF, EN, ISO).
 * - recommandation : recommandation de prévention (INRS, Assurance Maladie...).
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

/** Contenu pédagogique traçable : nature, sources, vérification, publication. */
export interface Traceable {
  nature: Nature;
  sources: Source[];
  verification: Verification;
  publie: boolean;
}

/** Comment une carte s'obtient. Les cartes se gagnent en apprenant, jamais au hasard pur. */
export type Obtention =
  | { type: 'maitrise'; seuil: number } // N questions distinctes réussies dans la catégorie
  | { type: 'parcours'; parcoursId: string }
  | { type: 'scenario'; scenarioId: string }
  | { type: 'collection' } // toutes les autres cartes de la catégorie
  | { type: 'niveau'; niveau: number };

export interface Card extends Traceable {
  id: string;
  numero: number;
  nom: string;
  categorie: CategoryId;
  rarete: Rarity;
  /** Nom d'icône (voir components/cards/CardArt) utilisé pour l'illustration. */
  icone: string;
  /** Illustration personnalisée (URL ou data URL), prioritaire sur l'icône. */
  image?: string;
  description: string;
  info: string;
  leSavaisTu: string;
  aRetenir: string;
  obtention: Obtention;
}

export interface Choice {
  id: string;
  texte: string;
}

export interface Question extends Traceable {
  id: string;
  categorie: CategoryId;
  difficulte: 1 | 2 | 3;
  enonce: string;
  choix: Choice[];
  bonneReponse: string;
  explication: string;
}

export interface ScenarioOption {
  id: string;
  texte: string;
  correct: boolean;
  consequence: string;
}

export interface ScenarioStep {
  id: string;
  situation: string;
  options: ScenarioOption[];
}

export interface Scenario extends Traceable {
  id: string;
  categorie: CategoryId;
  titre: string;
  accroche: string;
  lieu: string;
  etapes: ScenarioStep[];
}

export interface Parcours {
  id: string;
  categorie: CategoryId;
  titre: string;
  description: string;
  questionIds: string[];
  /** Score minimal (0-1) pour valider le parcours et obtenir la récompense. */
  seuil: number;
  publie: boolean;
}

export type Role = 'collaborateur' | 'admin';

export interface User {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  equipe: string;
  service: string;
  role: Role;
  actif: boolean;
  creeLe: string;
}

export interface AnswerRecord {
  questionId: string;
  correct: boolean;
  at: string;
  contexte: 'parcours' | 'quotidien' | 'revision' | 'entrainement';
}

export interface OwnedCard {
  cardId: string;
  at: string;
}

export interface ActivityEvent {
  id: string;
  type: 'quiz' | 'parcours' | 'scenario' | 'quotidien' | 'carte' | 'succes' | 'niveau' | 'revision';
  label: string;
  xp: number;
  at: string;
}

export interface Progress {
  userId: string;
  xp: number;
  cards: OwnedCard[];
  answers: AnswerRecord[];
  parcours: { id: string; score: number; at: string }[];
  scenarios: { id: string; score: number; at: string }[];
  /** Jours (AAAA-MM-JJ) où le défi du jour a été réussi. */
  quotidiens: string[];
  achievements: { id: string; at: string }[];
  activity: ActivityEvent[];
}

/** Ce qui change à l'issue d'une action : affiché à l'utilisateur sous forme de récompenses. */
export interface RewardSummary {
  xpGagne: number;
  niveauAvant: number;
  niveauApres: number;
  nouvellesCartes: string[];
  nouveauxSucces: string[];
}
