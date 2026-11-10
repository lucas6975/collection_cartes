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
