// Règles du calendrier : ouverture des cases, mélange des réponses, calcul des étoiles.
// Fonctions pures, testées dans tests/avent.test.ts.

import type { JourAvent, ResultatJeu } from './types';

/** Date d'ouverture d'une case : le N décembre, à minuit heure locale. */
export const dateOuverture = (annee: number, jour: number) => new Date(annee, 11, jour);

export const estOuverte = (annee: number, jour: number, now: Date) =>
  now.getTime() >= dateOuverture(annee, jour).getTime();

/** Case du jour (1 à 24) si l'on est entre le 1er et le 24 décembre, sinon null. */
export function caseDuJour(annee: number, now: Date): number | null {
  if (now.getFullYear() !== annee || now.getMonth() !== 11) return null;
  const d = now.getDate();
  return d >= 1 && d <= 24 ? d : null;
}

/** Nombre de jours avant l'ouverture de la première case (0 si déjà ouverte). */
export function joursAvantDebut(annee: number, now: Date): number {
  const debut = dateOuverture(annee, 1).getTime();
  const aujourdhui = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((debut - aujourdhui) / 86_400_000));
}

/** Mélange déterministe (même ordre à chaque affichage d'un même jour). */
export function melanger<T>(items: T[], graine: number): T[] {
  let s = graine >>> 0 || 1;
  const rand = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 2 ** 32;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Mélange qui garantit que rien n'est déjà à sa place (sinon le jeu serait trop facile). */
export function melangerSansPointFixe<T>(items: T[], graine: number): T[] {
  if (items.length < 2) return [...items];
  for (let essai = 0; essai < 50; essai++) {
    const m = melanger(items, graine + essai * 7919);
    if (m.every((x, i) => x !== items[i])) return m;
  }
  return [...items.slice(1), items[0]];
}

// ───────────── Étoiles ─────────────

const e = (n: number) => Math.max(0, Math.min(3, n)) as 0 | 1 | 2 | 3;

/** Jeux à essais (remise en ordre, association) : 3 étoiles du premier coup. */
export function etoilesEssais(essais: number, correctionVue: boolean): ResultatJeu {
  if (correctionVue) return { etoiles: 0, resume: 'Correction consultée' };
  return {
    etoiles: e(4 - essais),
    resume: essais === 1 ? 'Réussi du premier coup !' : `Réussi en ${essais} essais`,
  };
}

/** Jeux à score (quiz, vrai ou faux). */
export function etoilesScore(bonnes: number, total: number): ResultatJeu {
  const ratio = total ? bonnes / total : 0;
  return {
    etoiles: ratio === 1 ? 3 : ratio >= 0.75 ? 2 : ratio >= 0.5 ? 1 : 0,
    resume: `${bonnes}/${total} bonne${bonnes > 1 ? 's' : ''} réponse${bonnes > 1 ? 's' : ''}`,
  };
}

/** Recherche d'anomalies : selon le nombre de touches à côté. */
export function etoilesAnomalies(
  trouvees: number,
  total: number,
  rates: number,
  abandon: boolean,
): ResultatJeu {
  if (abandon)
    return {
      etoiles: trouvees >= total / 2 ? 1 : 0,
      resume: `${trouvees}/${total} anomalies trouvées`,
    };
  return {
    etoiles: rates <= 2 ? 3 : rates <= 5 ? 2 : 1,
    resume:
      rates === 0
        ? 'Sans aucune erreur !'
        : `Trouvées avec ${rates} essai${rates > 1 ? 's' : ''} à côté`,
  };
}

/** Pendu : selon le nombre d'erreurs. */
export function etoilesPendu(gagne: boolean, erreurs: number): ResultatJeu {
  if (!gagne) return { etoiles: 0, resume: 'Mot non trouvé' };
  return {
    etoiles: erreurs <= 2 ? 3 : erreurs <= 4 ? 2 : 1,
    resume: `Trouvé avec ${erreurs} erreur${erreurs > 1 ? 's' : ''}`,
  };
}

/** Étoiles d'une journée : moyenne arrondie de ses mini-jeux. */
export function etoilesJour(resultats: ResultatJeu[]): 0 | 1 | 2 | 3 {
  if (!resultats.length) return 0;
  return e(Math.round(resultats.reduce((s, r) => s + r.etoiles, 0) / resultats.length));
}

export const jourJouable = (j: JourAvent) => j.jeux.length > 0;

// ───────────── Mots mêlés ─────────────

export interface GrilleMots {
  grille: string[][];
  /** Cases de chaque mot, dans l'ordre des lettres. */
  places: { mot: string; cases: [number, number][] }[];
}

const DIRECTIONS: [number, number][] = [
  [0, 1], // vers la droite
  [1, 0], // vers le bas
  [1, 1], // en diagonale
];

/** Place les mots dans une grille carrée et complète avec des lettres au hasard (déterministe). */
export function genererGrille(mots: string[], taille: number, graine: number): GrilleMots {
  let s = graine >>> 0 || 1;
  const rand = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 2 ** 32;
  };
  for (let essai = 0; essai < 40; essai++) {
    const grille: string[][] = Array.from({ length: taille }, () => Array(taille).fill(''));
    const places: GrilleMots['places'] = [];
    const tries = [...mots].sort((a, b) => b.length - a.length);
    let ok = true;
    for (const mot of tries) {
      let pose = false;
      for (let t = 0; t < 300 && !pose; t++) {
        const [dr, dc] = DIRECTIONS[Math.floor(rand() * DIRECTIONS.length)];
        const r0 = Math.floor(rand() * (taille - dr * (mot.length - 1)));
        const c0 = Math.floor(rand() * (taille - dc * (mot.length - 1)));
        if (r0 < 0 || c0 < 0) continue;
        const cases: [number, number][] = [...mot].map((_, i) => [r0 + dr * i, c0 + dc * i]);
        if (cases.every(([r, c], i) => grille[r][c] === '' || grille[r][c] === mot[i])) {
          cases.forEach(([r, c], i) => (grille[r][c] = mot[i]));
          places.push({ mot, cases });
          pose = true;
        }
      }
      if (!pose) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const alphabet = 'ABCDEFGHIJKLMNOPRSTUVE';
    for (const ligne of grille)
      for (let c = 0; c < taille; c++)
        if (!ligne[c]) ligne[c] = alphabet[Math.floor(rand() * alphabet.length)];
    return { grille, places: mots.map((m) => places.find((p) => p.mot === m)!) };
  }
  throw new Error('Impossible de placer les mots : agrandir la grille.');
}

/** Mots mêlés : moins on utilise d'indices, plus on gagne d'étoiles. */
export function etoilesMotsMeles(
  indices: number,
  abandon: boolean,
  trouves: number,
  total: number,
): ResultatJeu {
  if (abandon)
    return { etoiles: trouves >= total / 2 ? 1 : 0, resume: `${trouves}/${total} mots trouvés` };
  return {
    etoiles: indices === 0 ? 3 : indices <= 2 ? 2 : 1,
    resume:
      indices === 0
        ? 'Tous les mots, sans indice !'
        : `Tous les mots, avec ${indices} indice${indices > 1 ? 's' : ''}`,
  };
}
