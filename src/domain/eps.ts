// Échange Périodique de Sécurité (EPS) : calcul du niveau sur la courbe de Bradley.
// Reprend exactement les formules du fichier « Formulaire EPS digital Version 2 » :
// chaque question croise le type de réponse (1 à 4) et la fréquence (1 à 4), puis la moyenne
// pondérée des 4 questions (0,5 · 1,5 · 0,5 · 1,5) donne la culture sécurité finale.

export type Niveau = 1 | 2 | 3 | 4;

export const NIVEAUX: Record<Niveau, { nom: string; couleur: string; phrase: string }> = {
  1: {
    nom: 'Réactif',
    couleur: '#D63A46',
    phrase: 'Instinct : la sécurité, on y pense après l’accident.',
  },
  2: {
    nom: 'Dépendant',
    couleur: '#E8952B',
    phrase: 'Surveillance : « je suis en sécurité parce que mon chef le veut ».',
  },
  3: {
    nom: 'Indépendant',
    couleur: '#2E6ED0',
    phrase: 'Personnel : « je suis en sécurité parce que je le veux ».',
  },
  4: {
    nom: 'Interdépendant',
    couleur: '#1F9A63',
    phrase: 'Équipe : « nous sommes en sécurité parce que nous le voulons ».',
  },
};

export const LISTE_NIVEAUX: Niveau[] = [1, 2, 3, 4];

export const TYPES_REPONSE = [
  'Pas de souvenir',
  'Rappel du respect des règles',
  'Expliquer les conséquences d’une situation',
  'Promouvoir une dynamique collective sur la sécurité',
];

export const FREQUENCES = [
  'Plus d’un mois',
  'Dans le mois',
  'Dans la semaine',
  'Aujourd’hui ou hier',
];

export interface QuestionEps {
  id: 'q1' | 'q2' | 'q3' | 'q4';
  court: string;
  texte: string;
  /** Question posée juste avant (correspondant sécurité, manager). */
  qui?: { champ: 'correspondant' | 'manager'; texte: string };
  interactions: string[];
  poids: number;
}

export const QUESTIONS: QuestionEps[] = [
  {
    id: 'q1',
    court: 'Vigilance reçue',
    texte:
      'Parlez-moi d’un évènement récent durant lequel quelqu’un vous a félicité pour avoir eu un comportement préventif ou vous a corrigé pour un écart de sécurité ?',
    interactions: [
      'Aucun - Pas de souvenir',
      'Échange sur un écart de sécurité',
      'Reconnaissance sur une pratique sécurité',
    ],
    poids: 0.5,
  },
  {
    id: 'q2',
    court: 'Vigilance donnée',
    texte:
      'Parlez-moi d’un évènement récent durant lequel vous avez félicité quelqu’un pour avoir eu un comportement préventif ou vous l’avez corrigé pour un écart de sécurité ?',
    interactions: [
      'Aucun - Pas de souvenir',
      'Échange sur un écart de sécurité',
      'Reconnaissance sur une pratique sécurité',
    ],
    poids: 1.5,
  },
  {
    id: 'q3',
    court: 'Correspondant sécurité',
    qui: { champ: 'correspondant', texte: 'Qui est votre correspondant sécurité ?' },
    texte:
      'Quelle a été votre dernière interaction avec votre CS pour vous engager ou vous encourager à propos d’un comportement sécurité ?',
    interactions: ['Aucun - Pas de souvenir', 'Information du CS', 'Échange entre les 2 parties'],
    poids: 0.5,
  },
  {
    id: 'q4',
    court: 'Manager',
    qui: { champ: 'manager', texte: 'Qui est votre manager ?' },
    texte:
      'Quelle a été votre dernière interaction avec votre manager pour vous engager ou vous encourager à propos d’un comportement sécurité ?',
    interactions: [
      'Aucun - Pas de souvenir',
      'Information du Manager',
      'Échange entre les 2 parties',
    ],
    poids: 1.5,
  },
];

/**
 * Niveau d'une question (colonne M du fichier Excel).
 * type : type de réponse 1 à 4 ; frequence : 1 à 4 (0 si non renseignée).
 */
export function niveauQuestion(type: number, frequence: number): Niveau | null {
  const k = type;
  const l = frequence;
  if (k === 1) return 1;
  if ((k === 2 && l >= 1 && l <= 2) || (k === 3 && l === 1)) return 2;
  if ((k === 2 && l > 2) || (k === 3 && l > 1) || (k === 4 && l === 1)) return 3;
  if (k === 4 && l > 1) return 4;
  return null;
}

/** Moyenne pondérée des questions répondues (identique au total Excel une fois les 4 remplies). */
export function scoreEps(niveaux: (Niveau | null)[]): number | null {
  let somme = 0;
  let poids = 0;
  niveaux.forEach((n, i) => {
    if (n === null) return;
    somme += n * QUESTIONS[i].poids;
    poids += QUESTIONS[i].poids;
  });
  return poids ? somme / poids : null;
}

/** Niveau final selon le score (cellule I19 du fichier Excel). */
export function niveauGlobal(score: number): Niveau {
  if (score < 2) return 1;
  if (score < 2.5) return 2;
  if (score < 3.5) return 3;
  return 4;
}

/** Position horizontale (0 à 1) sur la courbe de Bradley : chaque niveau occupe un quart. */
export function positionBradley(score: number): number {
  const bornes: [number, number][] = [
    [1, 2],
    [2, 2.5],
    [2.5, 3.5],
    [3.5, 4],
  ];
  const s = Math.min(4, Math.max(1, score));
  const i = niveauGlobal(s) - 1;
  const [a, b] = bornes[i];
  return (i + (s - a) / (b - a)) / 4;
}

// ───────────── Noms : ne pas réinterviewer la même personne avant 2 mois ─────────────

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Clé d'une personne : initiale du prénom + « . » + NOM, en majuscules.
 * « Eric Dupont », « DUPONT Eric », « E.DUPONT » et « E.DUPONT2 » → « E.DUPONT ».
 * Un nom seul (« ZORAN ») donne « ZORAN ».
 */
export function clePersonne(nom: string): string {
  const mots = sansAccent(nom)
    .replace(/\(.*?\)/g, ' ')
    .replace(/\d+/g, ' ')
    .split(/[.\s]+/)
    .filter(Boolean);
  if (!mots.length) return '';
  if (mots.length === 1) return mots[0].toUpperCase();
  const majuscules = mots.filter((m) => m.length > 1 && m === m.toUpperCase());
  // « E.NAY », « JP.MARTIN » : le NOM suit le point. « LI LAURENT » (annuaire) : NOM d'abord.
  // « BERNARD Alexandre » : le mot en majuscules. « Eric Dupont » : le dernier mot.
  let nomFamille: string;
  if (majuscules.length === 1) nomFamille = majuscules[0];
  else if (majuscules.length > 1) nomFamille = nom.includes('.') ? mots[mots.length - 1] : mots[0];
  else nomFamille = mots[mots.length - 1];
  const prenom = mots.find((m) => m !== nomFamille) ?? '';
  return `${prenom.charAt(0).toUpperCase()}.${nomFamille.toUpperCase()}`;
}

/** Deux clés désignent-elles la même personne ? (un nom sans initiale correspond au NOM) */
export function memePersonne(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const nom = (c: string) => (c.includes('.') ? c.split('.')[1] : c);
  return (!a.includes('.') || !b.includes('.')) && nom(a) === nom(b);
}

/** Date (AAAA-MM-JJ) à partir de laquelle la personne peut être réinterviewée. */
export function dansDeuxMois(date: string): string {
  const [a, m, j] = date.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 + 2, j));
  return d.toISOString().slice(0, 10);
}

export interface EpsResume {
  interviewe: string;
  cle: string;
  interviewer: string;
  date: string;
}

/** Dernière EPS de la personne qui empêche une nouvelle interview à cette date (ou null). */
export function blocageDeuxMois(cle: string, date: string, liste: EpsResume[]): EpsResume | null {
  let pire: EpsResume | null = null;
  for (const e of liste) {
    if (!memePersonne(cle, e.cle)) continue;
    if (e.date <= date && dansDeuxMois(e.date) > date) {
      if (!pire || e.date > pire.date) pire = e;
    }
    if (e.date > date && dansDeuxMois(date) > e.date) pire = e;
  }
  return pire;
}

// ───────────── Bilans des années passées (support « Rappel EPS ») ─────────────

export const HISTORIQUE: Record<
  number,
  { taux: number; repartition: Record<Niveau, number>; questions: Niveau[] }
> = {
  2024: { taux: 72, repartition: { 1: 35, 2: 53, 3: 11, 4: 2 }, questions: [1, 1, 2, 2] },
  2025: { taux: 93, repartition: { 1: 17, 2: 63, 3: 20, 4: 0 }, questions: [1, 2, 2, 2] },
};
