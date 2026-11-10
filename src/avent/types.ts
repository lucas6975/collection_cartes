// Modèle du calendrier de l'Avent. Chaque jour contient un ou plusieurs mini-jeux.

/** Zone à toucher sur une image, en pourcentage de sa largeur et de sa hauteur. */
export interface Cible {
  x: number;
  y: number;
  /** Rayon de tolérance, en pourcentage de la largeur de l'image. */
  r: number;
}

export type Jeu =
  | {
      type: 'anomalies';
      consigne: string;
      image: string;
      /** Rapport largeur / hauteur de l'image. */
      ratio: number;
      anomalies: { id: string; label: string; cibles: Cible[] }[];
    }
  | {
      type: 'ordre';
      contexte: string;
      consigne: string;
      /** Étapes dans le BON ordre ; elles sont mélangées à l'affichage. */
      etapes: string[];
    }
  | {
      type: 'quiz';
      consigne: string;
      questions: { question: string; choix: string[]; bonne: number }[];
    }
  | {
      type: 'association';
      consigne: string;
      paires: { image: string; label: string }[];
    }
  | {
      type: 'vraifaux';
      consigne: string;
      questions: { affirmation: string; reponse: boolean }[];
    }
  | {
      type: 'pendu';
      consigne: string;
      mots: { mot: string; indice: string }[];
    };

export interface JourAvent {
  jour: number;
  titre: string;
  /** Règle de sécurité concernée (LSR), le cas échéant. */
  lsr?: string;
  /** Vide : le contenu du jour reste à préparer. */
  jeux: Jeu[];
}

/** Résultat d'un mini-jeu : de 0 à 3 étoiles. */
export interface ResultatJeu {
  etoiles: 0 | 1 | 2 | 3;
  /** Texte court résumant la performance (ex. « 4/5 bonnes réponses »). */
  resume: string;
}
