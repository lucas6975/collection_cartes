// Calculs de l'onglet « Packs » de l'espace admin (sans React, testables).
import { jourDe } from '../domain/packs';

export interface SuiviPacks {
  participant_id: string;
  packs: { jour: string; at: string }[];
  cartes: number;
  vu_le: string;
}

export type Statut =
  | { type: 'ouvert'; heure: string }
  | { type: 'pas-encore' }
  | { type: 'inconnu'; vuLe: string | null };

const heure = (d: Date) => `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;

/** Pack du jour ouvert ? « pas encore » seulement si l'appli a été ouverte aujourd'hui. */
export function statutDuJour(s: SuiviPacks | undefined, maintenant = new Date()): Statut {
  if (!s) return { type: 'inconnu', vuLe: null };
  const jour = jourDe(maintenant);
  const p = s.packs.find((x) => x.jour === jour);
  if (p) return { type: 'ouvert', heure: heure(new Date(p.at)) };
  if (jourDe(new Date(s.vu_le)) === jour) return { type: 'pas-encore' };
  return { type: 'inconnu', vuLe: s.vu_le };
}

/** Jours consécutifs (jusqu'à aujourd'hui ou hier) avec le pack du jour ouvert. */
export function seriePacks(s: SuiviPacks | undefined, maintenant = new Date()): number {
  if (!s) return 0;
  const jours = new Set(s.packs.map((x) => x.jour));
  const d = new Date(maintenant);
  if (!jours.has(jourDe(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (jours.has(jourDe(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

/** Nombre de personnes ayant ouvert le pack du jour, pour les 7 derniers jours. */
export function packsParJour(suivis: SuiviPacks[], maintenant = new Date()) {
  const out: { label: string; n: number; actuelle: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - i);
    const j = jourDe(d);
    out.push({
      label: `${JOURS_COURTS[d.getDay()]} ${d.getDate()}`,
      n: suivis.filter((s) => s.packs.some((x) => x.jour === j)).length,
      actuelle: i === 0,
    });
  }
  return out;
}
