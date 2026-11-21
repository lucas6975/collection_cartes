// Thème de Noël de l'appli : actif pour tout le monde du 1er décembre au 4 janvier.
// L'administrateur peut l'essayer avant sur son téléphone (aperçu, réglé dans l'espace admin).
import { useSyncExternalStore } from 'react';
import { useIdentite } from './identite';

export type ThemeNoel = 'rouge' | 'neige' | 'nuit';

export const THEMES_NOEL: { id: ThemeNoel; nom: string; emoji: string }[] = [
  { id: 'rouge', nom: 'Rouge Noël', emoji: '🎅' },
  { id: 'neige', nom: 'Neige qui tombe', emoji: '❄️' },
  { id: 'nuit', nom: 'Nuit dorée', emoji: '✨' },
];

/** Thème choisi pour tout le monde à partir du 1er décembre. */
export const THEME_NOEL: ThemeNoel = 'rouge';
export const DEBUT_NOEL = '2026-12-01';
/** Premier jour où l'appli revient au thème habituel. */
export const FIN_NOEL = '2027-01-04';

const jourLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function periodeNoel(now: Date): boolean {
  const j = jourLocal(now);
  return j >= DEBUT_NOEL && j < FIN_NOEL;
}

/** Jours restants avant le 25 décembre (0 le jour de Noël et après). */
export function joursAvantNoel(now: Date): number {
  const noel = new Date(now.getFullYear(), 11, 25);
  const auj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((noel.getTime() - auj.getTime()) / 86_400_000));
}

// ── Aperçu administrateur (ce téléphone seulement) ──
const CLE = 'team-ulysse-apercu-noel';
const abonnes = new Set<() => void>();
export const apercuNoelStore = {
  get(): ThemeNoel | null {
    try {
      const v = localStorage.getItem(CLE);
      return THEMES_NOEL.some((t) => t.id === v) ? (v as ThemeNoel) : null;
    } catch {
      return null;
    }
  },
  set(v: ThemeNoel | null) {
    try {
      if (v) localStorage.setItem(CLE, v);
      else localStorage.removeItem(CLE);
    } catch {
      /* navigation privée : l'aperçu ne sera pas retenu */
    }
    abonnes.forEach((f) => f());
  },
  subscribe(f: () => void) {
    abonnes.add(f);
    return () => abonnes.delete(f);
  },
};

/** Thème choisi : l'aperçu admin s'il y en a un, sinon celui de la période de Noël. */
export function themeNoel(now: Date, apercu: ThemeNoel | null, admin: boolean): ThemeNoel | null {
  if (admin && apercu) return apercu;
  return periodeNoel(now) ? THEME_NOEL : null;
}

export function useApercuNoel() {
  return useSyncExternalStore(apercuNoelStore.subscribe, apercuNoelStore.get, () => null);
}

/** Thème de Noël à afficher sur ce téléphone, ou null (thème habituel). */
export function useNoel(): ThemeNoel | null {
  const apercu = useApercuNoel();
  const { codeAdmin } = useIdentite();
  return themeNoel(new Date(), apercu, !!codeAdmin);
}
