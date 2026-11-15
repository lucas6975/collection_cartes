// Calculs de l'onglet « Lancement » de l'espace admin (sans React, testables).

export interface Inscrit {
  inscrit_le: string;
}

const memeJour = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Inscrits du jour de `maintenant`. */
export function inscritsDuJour<T extends Inscrit>(liste: T[], maintenant = new Date()): T[] {
  return liste.filter((p) => memeJour(new Date(p.inscrit_le), maintenant));
}

/**
 * Inscriptions du jour, heure par heure, de 7 h à 18 h au moins.
 * La plage s'élargit si quelqu'un s'est inscrit plus tôt ou plus tard.
 */
export function parHeure(liste: Inscrit[], maintenant = new Date()) {
  const heures = inscritsDuJour(liste, maintenant).map((p) => new Date(p.inscrit_le).getHours());
  const debut = Math.min(7, ...heures);
  const fin = Math.max(18, ...heures);
  const out: { label: string; n: number; actuelle: boolean }[] = [];
  for (let h = debut; h <= fin; h++) {
    out.push({
      label: `${h}h`,
      n: heures.filter((x) => x === h).length,
      actuelle: h === maintenant.getHours(),
    });
  }
  return out;
}

const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

/** Inscriptions des 7 derniers jours (le dernier est aujourd'hui). */
export function parJour(liste: Inscrit[], maintenant = new Date()) {
  const out: { label: string; n: number; actuelle: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - i);
    out.push({
      label: `${JOURS_COURTS[d.getDay()]} ${d.getDate()}`,
      n: liste.filter((p) => memeJour(new Date(p.inscrit_le), d)).length,
      actuelle: i === 0,
    });
  }
  return out;
}

const MOIS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];
const heure = (d: Date) => `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;

/** « aujourd'hui à 9h05 · il y a 3 min », « hier à 17h40 », « 13 nov. à 14h05 ». */
export function dateInscription(iso: string, maintenant = new Date()): string {
  const d = new Date(iso);
  const hier = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - 1);
  if (memeJour(d, maintenant)) {
    const min = Math.floor((maintenant.getTime() - d.getTime()) / 60_000);
    const relatif = min < 1 ? 'à l’instant' : min < 60 ? `il y a ${min} min` : null;
    return `aujourd’hui à ${heure(d)}${relatif ? ` · ${relatif}` : ''}`;
  }
  if (memeJour(d, hier)) return `hier à ${heure(d)}`;
  const annee = d.getFullYear() !== maintenant.getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MOIS[d.getMonth()]}${annee} à ${heure(d)}`;
}

/** Du plus récent au plus ancien. */
export function plusRecents<T extends Inscrit>(liste: T[]): T[] {
  return [...liste].sort((a, b) => b.inscrit_le.localeCompare(a.inscrit_le));
}
