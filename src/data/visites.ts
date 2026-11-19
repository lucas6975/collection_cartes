// Compteur anonyme « Du lien à l'inscription » : chaque téléphone signale, une seule fois,
// qu'il a ouvert le lien (navigateur) puis l'appli depuis son icône. Aucun nom n'est envoyé.
import { api } from './api';
import { estIOS } from './rappels';

export type Etape = 'lien' | 'appli';
export type Plateforme = 'ios' | 'android' | 'ordi';

const CLE_APPAREIL = 'team-ulysse-appareil';
const cleEtape = (e: Etape) => `team-ulysse-visite-${e}`;

export function plateforme(): Plateforme {
  if (estIOS()) return 'ios';
  if (/Android/i.test(navigator.userAgent)) return 'android';
  return 'ordi';
}

export function appareil(): string | null {
  try {
    let id = localStorage.getItem(CLE_APPAREIL);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLE_APPAREIL, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Signale l'étape une seule fois ; réessaie à l'ouverture suivante si l'envoi échoue. */
export async function noterVisite(etape: Etape): Promise<void> {
  try {
    if (localStorage.getItem(cleEtape(etape))) return;
    const id = appareil();
    if (!id) return;
    await api.noterVisite(id, etape, plateforme());
    localStorage.setItem(cleEtape(etape), '1');
  } catch {
    /* sans importance : c'est juste un compteur */
  }
}

export interface ChiffresVisites {
  debut: string | null;
  lien: number;
  ios: number;
  android: number;
  ordi: number;
  appli: number;
  rappels: number;
}

/** Les étapes de l'entonnoir, avec la part de chaque étape par rapport aux liens ouverts. */
export function entonnoir(v: ChiffresVisites, inscritsLe: string[]) {
  const debut = v.debut ? new Date(v.debut).getTime() : null;
  const inscrits =
    debut === null ? 0 : inscritsLe.filter((d) => new Date(d).getTime() >= debut).length;
  const base = Math.max(v.lien, v.appli, inscrits, 1);
  const etapes = [
    { id: 'lien', label: 'Ont ouvert le lien', n: v.lien },
    { id: 'appli', label: 'Ont ouvert l’appli depuis l’icône', n: v.appli },
    { id: 'inscrits', label: 'Inscrits', n: inscrits },
    { id: 'rappels', label: 'Rappels activés', n: v.rappels },
  ] as const;
  return etapes.map((e, i) => ({
    ...e,
    part: Math.round((e.n / base) * 100),
    perdus: i < etapes.length - 2 ? Math.max(0, e.n - etapes[i + 1].n) : 0,
  }));
}
