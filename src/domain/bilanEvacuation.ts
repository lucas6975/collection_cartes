// Statistiques du bilan d'une évacuation (exercice ou réelle). Fonctions pures, testées.
import type { PresentEvacuation, SuiviEvacuation } from '../data/api';
import { comparer } from './appel';

export type Moyen = 'inscrit' | 'qr' | 'manuel';

export interface Bilan {
  /** Durée totale (secondes) entre le lancement et la fin. */
  duree: number | null;
  total: number;
  parStatut: [string, number][];
  parMoyen: Record<Moyen, number>;
  /** Secondes après le lancement : 1re arrivée, 50 %, 90 %, dernière arrivée. */
  premiere: number | null;
  t50: number | null;
  t90: number | null;
  derniere: number | null;
  /** Courbe cumulée des arrivées, une valeur par minute écoulée. */
  courbe: number[];
  /** Arrivées dans les 3 premières minutes (objectif courant d'un exercice). */
  avant3min: number;
  liste: {
    effectif: number;
    ensemble: number;
    manquants: string[];
    horsListe: PresentEvacuation[];
    /** Part de la liste d'appel retrouvée parmi les présents (0 à 1). */
    taux: number;
  } | null;
}

const ordre = ['Salarié IMECA', 'Intérimaire', 'Prestataire', 'Visiteur'];

export function moyenDe(p: PresentEvacuation): Moyen {
  if (p.ajoute_par === 'manuel') return 'manuel';
  return p.appli ? 'inscrit' : 'qr';
}

/** Valeur au rang q (0 à 1) d'une liste triée. */
function rang(tri: number[], q: number): number | null {
  if (!tri.length) return null;
  return tri[Math.min(tri.length - 1, Math.ceil(q * tri.length) - 1)];
}

export function bilanEvacuation(s: SuiviEvacuation): Bilan {
  const ev = s.evacuation!;
  const debut = Date.parse(ev.debut);
  const presents = s.presents;
  const delais = presents
    .map((p) => Math.max(0, Math.round((Date.parse(p.heure) - debut) / 1000)))
    .sort((a, b) => a - b);

  const parStatut = new Map<string, number>();
  for (const p of presents) parStatut.set(p.statut, (parStatut.get(p.statut) ?? 0) + 1);
  const statuts = [...parStatut.entries()].sort(
    (a, b) => (ordre.indexOf(a[0]) + 1 || 99) - (ordre.indexOf(b[0]) + 1 || 99) || b[1] - a[1],
  );

  const parMoyen: Record<Moyen, number> = { inscrit: 0, qr: 0, manuel: 0 };
  for (const p of presents) parMoyen[moyenDe(p)]++;

  const fin = ev.fin ? Math.round((Date.parse(ev.fin) - debut) / 1000) : null;
  const minutes = Math.max(1, Math.ceil(Math.max(fin ?? 0, delais.at(-1) ?? 0) / 60));
  const courbe = Array.from(
    { length: minutes + 1 },
    (_, m) => delais.filter((d) => d <= m * 60).length,
  );

  let liste: Bilan['liste'] = null;
  if (ev.liste_appel?.length) {
    const c = comparer(ev.liste_appel, presents, (p) => `${p.prenom} ${p.nom}`);
    liste = {
      effectif: ev.liste_appel.length,
      ensemble: c.ensemble.length,
      manquants: c.manquants,
      horsListe: c.horsListe,
      taux: c.ensemble.length / ev.liste_appel.length,
    };
  }

  return {
    duree: fin,
    total: presents.length,
    parStatut: statuts,
    parMoyen,
    premiere: delais[0] ?? null,
    t50: rang(delais, 0.5),
    t90: rang(delais, 0.9),
    derniere: delais.at(-1) ?? null,
    courbe,
    avant3min: delais.filter((d) => d <= 180).length,
    liste,
  };
}

/** « 4 min 05 s », « 52 s ». */
export function dureeLisible(s: number | null): string {
  if (s === null) return '—';
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (!m) return `${r} s`;
  if (m >= 60) return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
  return `${m} min ${String(r).padStart(2, '0')} s`;
}
